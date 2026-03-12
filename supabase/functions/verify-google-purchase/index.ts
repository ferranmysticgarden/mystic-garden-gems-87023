import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product rewards configuration (canonical app IDs)
const PRODUCT_REWARDS: Record<string, { gems?: number; lives?: number; powerups?: number; noAdsDays?: number; noAdsForever?: boolean }> = {
  // Cofres (reward granted client-side, randomized)
  "chest_wooden": {},
  "chest_silver": {},
  "chest_gold": {},
  // Packs principales
  "mega_pack_inicial": { gems: 500, lives: 10, powerups: 3, noAdsDays: 1 },
  "pack_revancha": { gems: 50, lives: 5 },
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
  "welcome_pack": { powerups: 5, lives: 3 },
  "pack_impulso": { powerups: 5, lives: 3 },
  "pack_experiencia": { lives: 2 },
  "pack_victoria_segura_pro": { powerups: 8, lives: 3 },
};

const GOOGLE_PLAY_PRODUCT_ALIASES: Record<string, string> = {
  welcomepack: 'welcome_pack',
  packimpulso: 'pack_impulso',
  packexperiencia: 'pack_experiencia',
  packrachainfinita: 'pack_racha_infinita',
  packvictoriasegura: 'pack_victoria_segura',
  packvictoriasegurapro: 'pack_victoria_segura_pro',
  quickpack: 'quick_pack',
  gems100: 'gems_100',
  gems300: 'gems_300',
  gems1200: 'gems_1200',
  noadsmonth: 'no_ads_month',
  noadsforever: 'no_ads_forever',
  gardenpass: 'garden_pass',
  // Compatibilidad con catálogos donde añadieron sufijo numérico
  welcomepack1: 'welcome_pack',
  packimpulso1: 'pack_impulso',
  packexperiencia1: 'pack_experiencia',
  packrachainfinita1: 'pack_racha_infinita',
  packvictoriasegura1: 'pack_victoria_segura',
  packvictoriasegurapro1: 'pack_victoria_segura_pro',
  quickpack1: 'quick_pack',
  gems1001: 'gems_100',
  gems3001: 'gems_300',
  gems12001: 'gems_1200',
  noadsmonth1: 'no_ads_month',
  noadsforever1: 'no_ads_forever',
  gardenpass1: 'garden_pass',
};

const normalizeGoogleProductId = (productId: string) => {
  return GOOGLE_PLAY_PRODUCT_ALIASES[productId] ?? productId;
};

// Google Play API verification
async function verifyWithGooglePlay(
  packageName: string,
  productId: string,
  purchaseToken: string,
  serviceAccountKey: string | null
): Promise<{ valid: boolean; consumptionState?: number; purchaseState?: number; error?: string }> {
  
  if (!serviceAccountKey) {
    console.log('[WARN] No GOOGLE_PLAY_SERVICE_ACCOUNT configured - skipping API verification');
    return { valid: true };
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    const tokenResponse = await getGoogleAccessToken(serviceAccount);
    if (!tokenResponse.access_token) {
      return { valid: false, error: 'Failed to get access token' };
    }

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
  const expiry = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

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

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

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

  try {
    // Try to authenticate user — but allow guests (no auth = guest purchase)
    let userId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAnonClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const { data: userData } = await supabaseAnonClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    const { purchaseToken, productId, orderId } = await req.json();

    if (!purchaseToken || !productId) {
      throw new Error("Missing purchaseToken or productId");
    }

    const purchaseKey = orderId || purchaseToken;
    const purchaseRecordId = `gp_${purchaseKey}`;
    const isGuest = !userId;

    console.log(`[INFO] Verifying purchase: product=${productId}, order=${orderId}, user=${userId || 'GUEST'}, isGuest=${isGuest}`);

    const { error: auditInsertError } = await supabaseClient
      .from('app_events')
      .insert({
        event_name: 'gp_verify_started',
        event_data: {
          productId,
          orderId: orderId || null,
          purchaseTokenPrefix: purchaseToken.slice(0, 12),
          isGuest,
          userId,
        },
        platform: 'android',
        device_id: purchaseToken.slice(0, 24),
      });

    if (auditInsertError) {
      console.error('[WARN] Failed to audit gp_verify_started:', auditInsertError.message);
    }

    // Verify with Google Play API (ALWAYS — this is the real security check)
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

      const { error: auditFailError } = await supabaseClient
        .from('app_events')
        .insert({
          event_name: 'gp_verify_failed',
          event_data: {
            productId,
            orderId: orderId || null,
            error: verification.error || 'Purchase verification failed',
            purchaseState: verification.purchaseState ?? null,
            consumptionState: verification.consumptionState ?? null,
            isGuest,
            userId,
          },
          platform: 'android',
          device_id: purchaseToken.slice(0, 24),
        });

      if (auditFailError) {
        console.error('[WARN] Failed to audit gp_verify_failed:', auditFailError.message);
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: verification.error || 'Purchase verification failed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('[INFO] Purchase verified successfully with Google Play');

    const { error: auditVerifiedError } = await supabaseClient
      .from('app_events')
      .insert({
        event_name: 'gp_verify_ok',
        event_data: {
          productId,
          orderId: orderId || null,
          purchaseState: verification.purchaseState ?? null,
          consumptionState: verification.consumptionState ?? null,
          isGuest,
          userId,
        },
        platform: 'android',
        device_id: purchaseToken.slice(0, 24),
      });

    if (auditVerifiedError) {
      console.error('[WARN] Failed to audit gp_verify_ok:', auditVerifiedError.message);
    }

    // Get product rewards
    const rewards = PRODUCT_REWARDS[productId];
    if (!rewards) {
      throw new Error(`Unknown product: ${productId}`);
    }

    // If user is authenticated, save to DB and grant rewards server-side
    if (userId) {
      // Check if this purchase was already processed (prevent double-spend)
      const { data: existingPurchase } = await supabaseClient
        .from('user_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', purchaseRecordId)
        .single();

      if (existingPurchase) {
        console.log('[INFO] Purchase already processed');
        return new Response(JSON.stringify({ success: true, message: 'Already processed', rewards }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Get current game progress
      const { data: progress, error: progressError } = await supabaseClient
        .from('game_progress')
        .select('*')
        .eq('user_id', userId)
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
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (rewards.gems) updates.gems = currentGems + rewards.gems;
      if (rewards.lives) updates.lives = Math.min(currentLives + rewards.lives, 99);
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
          .eq('user_id', userId);
      } else {
        updates.lives = updates.lives || 5;
        updates.gems = updates.gems || 0;
        await supabaseClient
          .from('game_progress')
          .insert(updates);
      }

      // Record purchase
      await supabaseClient
        .from('user_purchases')
        .insert({
          user_id: userId,
          product_id: purchaseRecordId,
          expires_at: rewards.noAdsDays 
            ? new Date(Date.now() + rewards.noAdsDays * 24 * 60 * 60 * 1000).toISOString()
            : null,
        });

      if (rewards.noAdsForever) {
        await supabaseClient
          .from('user_purchases')
          .insert({
            user_id: userId,
            product_id: 'no_ads_forever',
            expires_at: null,
          });
      }

      const { error: auditGrantedError } = await supabaseClient
        .from('app_events')
        .insert({
          event_name: 'gp_purchase_granted',
          event_data: {
            productId,
            orderId: orderId || null,
            isGuest: false,
            userId,
            rewards,
          },
          platform: 'android',
          device_id: purchaseToken.slice(0, 24),
        });

      if (auditGrantedError) {
        console.error('[WARN] Failed to audit gp_purchase_granted:', auditGrantedError.message);
      }

      console.log(`[INFO] ✅ Purchase completed (authenticated): ${productId} for user ${userId}`);
    } else {
      // Guest purchase: Google Play verified it, rewards will be applied client-side
      const { error: auditGuestError } = await supabaseClient
        .from('app_events')
        .insert({
          event_name: 'gp_purchase_guest_verified',
          event_data: {
            productId,
            orderId: orderId || null,
            isGuest: true,
          },
          platform: 'android',
          device_id: purchaseToken.slice(0, 24),
        });

      if (auditGuestError) {
        console.error('[WARN] Failed to audit gp_purchase_guest_verified:', auditGuestError.message);
      }

      console.log(`[INFO] ✅ Purchase verified (guest): ${productId} — rewards applied client-side`);
    }

    return new Response(JSON.stringify({ success: true, rewards, isGuest }), {
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
