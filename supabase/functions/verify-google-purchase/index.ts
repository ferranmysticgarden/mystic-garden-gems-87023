import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product rewards configuration
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
  "reward_doubler": { gems: 50 },
  "pack_victoria_segura": { powerups: 5, lives: 3 },
  "pack_racha_infinita": { lives: 2 },
  "extra_spin": { gems: 0 },
  "streak_protection": { gems: 0 },
  "lifesaver_pack": { lives: 3 },
};

// Google Play API verification
async function verifyWithGooglePlay(
  packageName: string,
  productId: string,
  purchaseToken: string,
  serviceAccountKey: string | null
): Promise<{ valid: boolean; consumptionState?: number; purchaseState?: number; error?: string }> {
  
  // If no service account key, skip verification (development mode)
  if (!serviceAccountKey) {
    console.log('[WARN] No GOOGLE_PLAY_SERVICE_ACCOUNT configured - skipping API verification');
    console.log('[WARN] For production, add the service account JSON as a secret');
    return { valid: true };
  }

  try {
    // Parse service account key
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Get access token using service account
    const tokenResponse = await getGoogleAccessToken(serviceAccount);
    if (!tokenResponse.access_token) {
      return { valid: false, error: 'Failed to get access token' };
    }

    // Call Google Play Developer API
    const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] Google Play API error:', response.status, errorText);
      return { valid: false, error: `Google Play API error: ${response.status}` };
    }

    const purchaseData = await response.json();
    console.log('[INFO] Google Play purchase data:', JSON.stringify(purchaseData));

    // Check purchase state (0 = purchased, 1 = canceled, 2 = pending)
    if (purchaseData.purchaseState !== 0) {
      return { 
        valid: false, 
        purchaseState: purchaseData.purchaseState,
        error: `Purchase state is ${purchaseData.purchaseState}, not purchased` 
      };
    }

    return { 
      valid: true, 
      consumptionState: purchaseData.consumptionState,
      purchaseState: purchaseData.purchaseState 
    };

  } catch (error) {
    console.error('[ERROR] Verification error:', error);
    return { valid: false, error: String(error) };
  }
}

// Get Google OAuth access token from service account
async function getGoogleAccessToken(serviceAccount: any): Promise<{ access_token?: string }> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  // Create JWT header and payload
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  };

  // Encode and sign JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  return await tokenResponse.json();
}

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
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

    console.log(`[INFO] Verifying purchase: product=${productId}, order=${orderId}, user=${user.id}`);

    // Check if this purchase was already processed (prevent double-spend)
    const { data: existingPurchase } = await supabaseClient
      .from('user_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', `gp_${orderId}`)
      .single();

    if (existingPurchase) {
      console.log('[INFO] Purchase already processed');
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify with Google Play API (if service account is configured)
    const serviceAccountKey = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT") || null;
    const packageName = "com.mysticgarden.game";
    
    const verification = await verifyWithGooglePlay(
      packageName,
      productId,
      purchaseToken,
      serviceAccountKey
    );

    if (!verification.valid) {
      console.error('[ERROR] Purchase verification failed:', verification.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: verification.error || 'Purchase verification failed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('[INFO] Purchase verified successfully');

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

    console.log(`[INFO] Purchase completed: ${productId} for user ${user.id}`);

    return new Response(JSON.stringify({ success: true, rewards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ERROR] verify-google-purchase:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
