import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product rewards configuration (same as Stripe webhook)
const PRODUCT_REWARDS: Record<string, { gems?: number; lives?: number; powerups?: number; noAdsDays?: number; noAdsForever?: boolean }> = {
  "quick_pack": { lives: 3, gems: 20 },
  "gems_100": { gems: 100 },
  "gems_300": { gems: 300 },
  "gems_1200": { gems: 1200 },
  "no_ads_month": { noAdsDays: 30 },
  "no_ads_forever": { noAdsForever: true },
  "garden_pass": { gems: 1000, noAdsDays: 30 },
  "flash_offer": { lives: 10, gems: 150 },
  "victory_multiplier": { lives: 2 },
  "finish_level": { powerups: 5 },
  "starter_pack": { gems: 500, lives: 10, powerups: 3 },
  "continue_game": { lives: 1, powerups: 5 },
  "buy_moves": { powerups: 5 },
  "reward_doubler": { gems: 50 }, // Doubled gems handled separately
  "pack_victoria_segura": { powerups: 5, lives: 3 },
  "pack_racha_infinita": { lives: 2 },
  "extra_spin": { gems: 0 }, // Handled in-app
  "streak_protection": { gems: 0 }, // Handled in-app
  "lifesaver_pack": { lives: 3 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseAnonClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAnonClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { purchaseToken, productId, orderId } = await req.json();

    if (!purchaseToken || !productId) {
      throw new Error("Missing purchaseToken or productId");
    }

    console.log(`Verifying Google Play purchase: ${productId}, order: ${orderId}`);

    // In production, verify the purchase with Google Play Developer API
    // For now, we trust the client (you should add server-side verification)
    // See: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
    
    // Check if this purchase was already processed (prevent double-spend)
    const { data: existingPurchase } = await supabaseClient
      .from('user_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', `gp_${orderId}`)
      .single();

    if (existingPurchase) {
      console.log('Purchase already processed');
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get product rewards
    const rewards = PRODUCT_REWARDS[productId];
    if (!rewards) {
      throw new Error(`Unknown product: ${productId}`);
    }

    // Get current game progress
    const { data: progress, error: progressError } = await supabaseClient
      .from('game_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (progressError && progressError.code !== 'PGRST116') {
      throw progressError;
    }

    // Calculate new values
    const currentGems = progress?.gems || 0;
    const currentLives = progress?.lives || 5;
    const currentHammer = progress?.hammer_count || 0;
    const currentShuffle = progress?.shuffle_count || 0;
    const currentUndo = progress?.undo_count || 0;

    const updates: Record<string, any> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (rewards.gems) {
      updates.gems = currentGems + rewards.gems;
    }
    if (rewards.lives) {
      updates.lives = Math.min(currentLives + rewards.lives, 99);
    }
    if (rewards.powerups) {
      // Distribute powerups evenly
      const perType = Math.ceil(rewards.powerups / 3);
      updates.hammer_count = currentHammer + perType;
      updates.shuffle_count = currentShuffle + perType;
      updates.undo_count = currentUndo + perType;
    }
    if (rewards.noAdsDays) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + rewards.noAdsDays);
      updates.unlimited_lives_until = expireDate.toISOString();
    }

    // Update or insert game progress
    if (progress) {
      await supabaseClient
        .from('game_progress')
        .update(updates)
        .eq('user_id', user.id);
    } else {
      updates.lives = updates.lives || 5;
      updates.gems = updates.gems || 0;
      await supabaseClient
        .from('game_progress')
        .insert(updates);
    }

    // Record purchase to prevent double-processing
    await supabaseClient
      .from('user_purchases')
      .insert({
        user_id: user.id,
        product_id: `gp_${orderId}`,
        expires_at: rewards.noAdsDays 
          ? new Date(Date.now() + rewards.noAdsDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
      });

    // Handle no_ads_forever
    if (rewards.noAdsForever) {
      await supabaseClient
        .from('user_purchases')
        .insert({
          user_id: user.id,
          product_id: 'no_ads_forever',
          expires_at: null,
        });
    }

    console.log(`Purchase verified and rewards granted for ${productId}`);

    return new Response(JSON.stringify({ success: true, rewards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error verifying purchase:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
