import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_REWARDS: Record<string, {
  gems?: number;
  lives?: number;
  powerups?: number;
  noAdsDays?: number;
  noAdsForever?: boolean;
  unlimitedLivesMinutes?: number;
}> = {
  starter_gems: { gems: 50 },
  gems_100: { gems: 100 },
  gems_300: { gems: 300 },
  gems_1200: { gems: 1200 },
  no_ads_month: { noAdsDays: 30 },
  no_ads_forever: { noAdsForever: true },
  garden_pass: { gems: 1000, noAdsDays: 30 },
  quick_pack: { lives: 3, gems: 20 },
  mega_pack_inicial: { gems: 500, lives: 10, powerups: 3, noAdsDays: 1 },
  pack_revancha: { gems: 50, lives: 5, powerups: 5 },
  starter_pack: { gems: 500, lives: 10, powerups: 3 },
  flash_offer: { lives: 10, gems: 150 },
  continue_game: { lives: 1, powerups: 5 },
  buy_moves: { powerups: 5 },
  finish_level: { powerups: 5 },
  victory_multiplier: { lives: 2 },
  reward_doubler: { gems: 50 },
  extra_spin: {},
  streak_protection: {},
  lifesaver_pack: { lives: 1, powerups: 3 },
  pack_victoria_segura: { powerups: 5, lives: 3 },
  pack_racha_infinita: { lives: 2 },
  welcome_pack: { powerups: 5, lives: 3 },
  pack_impulso: { powerups: 5, lives: 3 },
  pack_experiencia: { lives: 2 },
  pack_victoria_segura_pro: { powerups: 8, lives: 3 },
  first_day_offer: { powerups: 5, lives: 3 },
  chest_silver: {},
  chest_gold: {},
  unlimited_lives_30min: { unlimitedLivesMinutes: 30 },
  first_purchase: { gems: 500, lives: 20, noAdsDays: 1 },
  extra_moves: { powerups: 5 },
};

const getGrantWindowStartIso = (sessionCreatedSeconds: number) =>
  new Date(Math.max(0, sessionCreatedSeconds - 300) * 1000).toISOString();

const hasRecentStripeGrant = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  productId: string,
  sessionCreatedSeconds: number,
) => {
  const { data, error } = await supabaseAdmin
    .from("user_purchases")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("product_id", `stripe_${productId}`)
    .gte("created_at", getGrantWindowStartIso(sessionCreatedSeconds))
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
};

const hasProcessedSession = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  sessionId: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("processed_webhook_events")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
};

const applyStripeGrant = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  productId: string,
  sessionId: string,
) => {
  const rewards = PRODUCT_REWARDS[productId];

  let expiresAt: Date | null = null;
  if (rewards?.noAdsDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rewards.noAdsDays);
  }

  const { error: purchaseError } = await supabaseAdmin.from("user_purchases").insert({
    user_id: userId,
    product_id: `stripe_${productId}`,
    expires_at: expiresAt?.toISOString() || null,
  });

  if (purchaseError) throw purchaseError;

  if (rewards?.noAdsForever) {
    await supabaseAdmin.from("user_purchases").insert({
      user_id: userId,
      product_id: "no_ads_forever",
      expires_at: null,
    });
  }

  if (rewards && (rewards.gems || rewards.lives || rewards.powerups || rewards.noAdsDays || rewards.unlimitedLivesMinutes)) {
    const { data: progressData, error: progressError } = await supabaseAdmin
      .from("game_progress")
      .select("gems, lives, hammer_count, shuffle_count, undo_count, no_ads_until, unlimited_lives_until")
      .eq("user_id", userId)
      .maybeSingle();

    if (progressError) throw progressError;

    const currentGems = progressData?.gems || 0;
    const currentLives = progressData?.lives || 5;
    const currentHammer = progressData?.hammer_count || 0;
    const currentShuffle = progressData?.shuffle_count || 0;
    const currentUndo = progressData?.undo_count || 0;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (rewards.gems) updates.gems = currentGems + rewards.gems;
    if (rewards.lives) updates.lives = Math.min(currentLives + rewards.lives, 99);

    if (rewards.powerups) {
      const perType = Math.floor(rewards.powerups / 3);
      const remainder = rewards.powerups % 3;
      updates.hammer_count = currentHammer + perType + (remainder >= 1 ? 1 : 0);
      updates.shuffle_count = currentShuffle + perType + (remainder >= 2 ? 1 : 0);
      updates.undo_count = currentUndo + perType;
    }

    if (rewards.noAdsDays) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + rewards.noAdsDays);
      updates.no_ads_until = expireDate.toISOString();
    }

    if (rewards.unlimitedLivesMinutes) {
      const now = new Date();
      const currentUL = progressData?.unlimited_lives_until
        ? new Date(progressData.unlimited_lives_until)
        : null;
      const base = currentUL && currentUL > now ? currentUL : now;
      updates.unlimited_lives_until = new Date(
        base.getTime() + rewards.unlimitedLivesMinutes * 60 * 1000,
      ).toISOString();
    }

    if (progressData) {
      const { error: updateError } = await supabaseAdmin
        .from("game_progress")
        .update(updates)
        .eq("user_id", userId);

      if (updateError) throw updateError;
    } else {
      const insertData: Record<string, unknown> = {
        user_id: userId,
        gems: rewards.gems || 0,
        lives: rewards.lives || 5,
        hammer_count: rewards.powerups
          ? Math.floor(rewards.powerups / 3) + (rewards.powerups % 3 >= 1 ? 1 : 0)
          : 0,
        shuffle_count: rewards.powerups
          ? Math.floor(rewards.powerups / 3) + (rewards.powerups % 3 >= 2 ? 1 : 0)
          : 0,
        undo_count: rewards.powerups ? Math.floor(rewards.powerups / 3) : 0,
      };

      if (rewards.noAdsDays) {
        insertData.no_ads_until = new Date(
          Date.now() + rewards.noAdsDays * 24 * 60 * 60 * 1000,
        ).toISOString();
      }

      if (rewards.unlimitedLivesMinutes) {
        insertData.unlimited_lives_until = new Date(
          Date.now() + rewards.unlimitedLivesMinutes * 60 * 1000,
        ).toISOString();
      }

      const { error: insertError } = await supabaseAdmin.from("game_progress").insert(insertData);
      if (insertError) throw insertError;
    }
  }

  await supabaseAdmin.from("processed_webhook_events").insert({
    id: `stripe_verify_${sessionId}`,
    user_id: userId,
    product_id: productId,
    stripe_session_id: sessionId,
  });
};

/**
 * Verifies a Stripe checkout session was actually paid.
 * Called from the client after returning from Stripe with ?payment=success.
 * Returns: { verified: true, productId, rewards } or { verified: false }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing backend config");
    if (!serviceRoleKey) throw new Error("Missing service role key");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!authResponse.ok) {
      const authText = await authResponse.text();
      console.error("[verify-stripe] Auth lookup failed:", authResponse.status, authText);
      throw new Error("User not authenticated");
    }

    const user = await authResponse.json() as { id: string };
    if (!user?.id) {
      throw new Error("User not authenticated");
    }
    const userId = user.id;

    const { productId, sessionId } = await req.json();
    if (!productId || typeof productId !== "string") {
      throw new Error("productId is required");
    }

    if (!sessionId || typeof sessionId !== "string") {
      throw new Error("sessionId is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionCreatedSeconds = session.created ?? Math.floor(Date.now() / 1000);

    const verified =
      session.payment_status === "paid" &&
      session.status === "complete" &&
      session.metadata?.user_id === userId &&
      session.metadata?.product_id === productId;

    if (!verified) {
      console.log(`[verify-stripe] Verification failed for session=${sessionId}, user=${userId}, product=${productId}`);
      return new Response(JSON.stringify({ verified: false, error: "Payment not verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const recentGrantExists = await hasRecentStripeGrant(supabaseAdmin, userId, productId, sessionCreatedSeconds);

    if (!recentGrantExists) {
      const processedSessionExists = await hasProcessedSession(supabaseAdmin, sessionId);

      if (processedSessionExists) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      const grantExistsAfterWait = await hasRecentStripeGrant(supabaseAdmin, userId, productId, sessionCreatedSeconds);
      if (!grantExistsAfterWait) {
        console.log(`[verify-stripe] Grant missing after paid session ${session.id}. Applying server grant now.`);
        await applyStripeGrant(supabaseAdmin, userId, productId, sessionId);
      }
    }

    console.log(`[verify-stripe] ✅ Verified paid session ${session.id} for product=${productId}`);

    return new Response(JSON.stringify({
      verified: true,
      productId,
      sessionId: session.id,
      amountPaid: (session.amount_total || 0) / 100,
      paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[verify-stripe] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
