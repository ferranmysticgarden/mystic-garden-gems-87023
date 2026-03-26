import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[WEBHOOK] ${step}${detailsStr}`);
};

const PRODUCT_REWARDS: Record<
  string,
  {
    gems?: number;
    lives?: number;
    powerups?: number;
    noAdsDays?: number;
    noAdsForever?: boolean;
    unlimitedLivesMinutes?: number;
  }
> = {
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

async function resolveStripeEvent(
  stripe: Stripe,
  body: string,
  signature: string | null,
  webhookSecret: string | null,
): Promise<{ event: Stripe.Event; verificationMode: "signature" | "api_retrieve" }> {
  if (signature && webhookSecret) {
    try {
      const verifiedEvent = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      return { event: verifiedEvent, verificationMode: "signature" };
    } catch (signatureError) {
      logStep("Signature verification failed, trying Stripe API fallback", {
        message: signatureError instanceof Error ? signatureError.message : String(signatureError),
      });
    }
  }

  let parsedBody: { id?: string; type?: string };
  try {
    parsedBody = JSON.parse(body);
  } catch {
    throw new Error("Invalid webhook payload JSON");
  }

  const eventId = parsedBody.id;
  if (!eventId) {
    throw new Error("Webhook payload missing event id");
  }

  const retrievedEvent = await stripe.events.retrieve(eventId);
  if (parsedBody.type && retrievedEvent.type !== parsedBody.type) {
    throw new Error("Webhook event mismatch between payload and Stripe API");
  }

  return { event: retrievedEvent, verificationMode: "api_retrieve" };
}

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");

  if (!stripeKey) {
    logStep("ERROR: Missing STRIPE_SECRET_KEY");
    return new Response("Missing Stripe key", { status: 500 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    logStep("ERROR: Missing backend config");
    return new Response("Missing backend config", { status: 500 });
  }

  try {
    const body = await req.text();
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { event, verificationMode } = await resolveStripeEvent(stripe, body, signature, webhookSecret);
    logStep("Event verified", { type: event.type, id: event.id, verificationMode });

    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const productId = session.metadata?.product_id;
    const customerEmail = session.customer_details?.email;
    const amountPaid = (session.amount_total || 0) / 100;

    logStep("Payment completed", { userId, productId, customerEmail, amountPaid });

    if (!userId || !productId || userId === "guest") {
      logStep("Skipping grant: missing metadata", { userId, productId });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const sessionCreatedSeconds = session.created ?? Math.floor(Date.now() / 1000);
    const { data: existingGrant, error: existingGrantError } = await supabaseAdmin
      .from("user_purchases")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("product_id", `stripe_${productId}`)
      .gte("created_at", getGrantWindowStartIso(sessionCreatedSeconds))
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingGrantError) {
      logStep("ERROR checking existing Stripe grant", { error: existingGrantError.message });
      throw existingGrantError;
    }

    if (existingGrant?.length) {
      logStep("⚠️ Stripe grant already exists for session window, skipping duplicate grant", {
        sessionId: session.id,
        productId,
        userId,
      });
      return new Response(JSON.stringify({ received: true, duplicate: true, source: "existing_purchase" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const eventKey = event.id;
    const sessionKey = session.id ?? null;

    const { error: lockError } = await supabaseAdmin.from("processed_webhook_events").insert({
      id: eventKey,
      product_id: productId,
      user_id: userId,
      stripe_session_id: sessionKey,
    });

    if (lockError) {
      const code = (lockError as { code?: string }).code;
      if (code === "23505") {
        logStep("⚠️ Duplicate webhook skipped", { eventId: eventKey, sessionId: sessionKey });
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      logStep("ERROR creating idempotency lock", { error: lockError.message, code });
      throw lockError;
    }

    const rewards = PRODUCT_REWARDS[productId];
    logStep("Rewards lookup", { productId, rewards });

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

    if (purchaseError) {
      logStep("ERROR saving purchase", { error: purchaseError.message });
    }

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

      if (progressError) {
        logStep("ERROR fetching game progress", { error: progressError.message });
      }

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

        if (updateError) {
          logStep("ERROR updating game progress", { error: updateError.message });
        } else {
          logStep("✅ Game progress updated");
        }
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

        if (insertError) {
          logStep("ERROR inserting game progress", { error: insertError.message });
        } else {
          logStep("✅ Game progress created");
        }
      }
    }

    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Mystic Garden <onboarding@resend.dev>",
            to: ["fcanamases@gmail.com"],
            subject: `💰 ¡Pago: ${productId} - €${amountPaid.toFixed(2)}!`,
            html: `<h1>💰 Pago Recibido</h1><p>Producto: ${productId}</p><p>Monto: €${amountPaid.toFixed(2)}</p><p>Email: ${customerEmail}</p>`,
          }),
        });
      }
    } catch (emailError) {
      logStep("ERROR sending email", { error: String(emailError) });
    }

    try {
      await fetch("https://ntfy.sh/mystic-garden-admin-7225", {
        method: "POST",
        headers: { Title: `💰 Compra: ${productId}`, Priority: "high", Tags: "moneybag,tada" },
        body: `€${amountPaid.toFixed(2)} - ${customerEmail || "anónimo"}`,
      });
    } catch (pushErr) {
      logStep("Push notification failed", { error: String(pushErr) });
    }

    logStep("✅ Purchase completed", { productId, userId });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});