import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_REWARDS: Record<string, { gems?: number; lives?: number; powerups?: number; noAdsDays?: number; noAdsForever?: boolean; unlimitedLivesMinutes?: number }> = {
  "chest_wooden": {},
  "chest_silver": {},
  "chest_gold": {},
  "mega_pack_inicial": { gems: 500, lives: 10, powerups: 3, noAdsDays: 1 },
  "pack_revancha": { gems: 50, lives: 5, powerups: 5 },
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
  "extra_moves": { powerups: 5 },
  "first_purchase": { gems: 500, lives: 20, noAdsDays: 1 },
  "extra_spin": { gems: 0 },
  "streak_protection": { gems: 0 },
  "lifesaver_pack": { lives: 1, powerups: 3 },
  "welcome_pack": { powerups: 5, lives: 3 },
  "pack_impulso": { powerups: 5, lives: 3 },
  "pack_experiencia": { lives: 2 },
  "pack_victoria_segura_pro": { powerups: 8, lives: 3 },
  "unlimited_lives_30min": { unlimitedLivesMinutes: 30 },
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
  extramoves: 'extra_moves',
  firstpurchase: 'first_purchase',
  flashoffer: 'flash_offer',
  buymoves: 'buy_moves',
  finishlevel: 'finish_level',
  starterpack: 'starter_pack',
  continuegame: 'continue_game',
  victorymultiplier: 'victory_multiplier',
  rewarddoubler: 'reward_doubler',
  chestsilver: 'chest_silver',
  chestgold: 'chest_gold',
  megapackinicial: 'mega_pack_inicial',
  packrevancha: 'pack_revancha',
  lifesaverpack: 'lifesaver_pack',
  streakprotection: 'streak_protection',
  extraspin: 'extra_spin',
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
  extramoves1: 'extra_moves',
  firstpurchase1: 'first_purchase',
  flashoffer1: 'flash_offer',
  buymoves1: 'buy_moves',
  finishlevel1: 'finish_level',
  starterpack1: 'starter_pack',
  continuegame1: 'continue_game',
  victorymultiplier1: 'victory_multiplier',
  rewarddoubler1: 'reward_doubler',
  chestsilver1: 'chest_silver',
  chestgold1: 'chest_gold',
  megapackinicial1: 'mega_pack_inicial',
  packrevancha1: 'pack_revancha',
  lifesaverpack1: 'lifesaver_pack',
  streakprotection1: 'streak_protection',
  extraspin1: 'extra_spin',
  unlimitedlives30min: 'unlimited_lives_30min',
  unlimitedlives30min1: 'unlimited_lives_30min',
};

const normalizeId = (id: string) => id.toLowerCase().replace(/[_-]/g, '');

const NORMALIZED_CANONICAL_PRODUCT_IDS: Record<string, string> = Object.keys(PRODUCT_REWARDS).reduce(
  (acc, canonicalId) => {
    acc[normalizeId(canonicalId)] = canonicalId;
    return acc;
  },
  {} as Record<string, string>
);

const normalizeGoogleProductId = (productId: string) => {
  if (PRODUCT_REWARDS[productId]) return productId;
  const directAlias = GOOGLE_PLAY_PRODUCT_ALIASES[productId];
  if (directAlias) return directAlias;
  const normalized = normalizeId(productId);
  return GOOGLE_PLAY_PRODUCT_ALIASES[normalized] ?? NORMALIZED_CANONICAL_PRODUCT_IDS[normalized] ?? productId;
};

async function verifyWithGooglePlay(
  packageName: string,
  productId: string,
  purchaseToken: string,
  serviceAccountKey: string | null
): Promise<{
  valid: boolean;
  consumptionState?: number;
  purchaseState?: number;
  error?: string;
  statusCode?: number;
  reason?: 'service_disabled' | 'permission_denied' | 'invalid_credentials' | 'server_not_configured' | 'other';
  activationUrl?: string;
  serviceAccountEmail?: string;
}> {
  if (!serviceAccountKey) {
    console.error('[ERROR] No GOOGLE_PLAY_SERVICE_ACCOUNT configured');
    return {
      valid: false,
      error: 'Server verification not configured. Configure GOOGLE_PLAY_SERVICE_ACCOUNT in Supabase.',
      reason: 'server_not_configured',
    };
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    const serviceAccountEmail = String(serviceAccount?.client_email ?? '');
    const tokenResponse = await getGoogleAccessToken(serviceAccount);
    if (!tokenResponse.access_token) {
      const tokenError = [tokenResponse.error, tokenResponse.error_description].filter(Boolean).join(' - ');
      return {
        valid: false,
        statusCode: 401,
        reason: 'invalid_credentials',
        error: tokenError ? `Google OAuth error: ${tokenError}` : 'No se pudo obtener token OAuth de Google Play.',
        serviceAccountEmail,
      };
    }

    const encodedPackageName = encodeURIComponent(packageName);
    const encodedToken = encodeURIComponent(purchaseToken);
    const encodedProductId = encodeURIComponent(productId);
    const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodedPackageName}/purchases/products/${encodedProductId}/tokens/${encodedToken}`;

    console.log(`[INFO] Google Play API request: package=${packageName}, product=${productId}, tokenPrefix=${purchaseToken.slice(0, 16)}..., tokenLength=${purchaseToken.length}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] Google Play API error:', response.status, errorText);
      let parsedError: any = null;
      try { parsedError = JSON.parse(errorText); } catch { parsedError = null; }

      const googleError = parsedError?.error;
      const reasonCodes = [
        googleError?.status,
        ...(googleError?.errors ?? []).map((entry: any) => entry?.reason),
        ...(googleError?.details ?? []).map((detail: any) => detail?.reason),
      ].filter(Boolean).map((value: string) => value.toLowerCase());

      const message = String(googleError?.message ?? errorText ?? '').toLowerCase();

      const isServiceDisabled = response.status === 403 && (
        reasonCodes.includes('service_disabled') ||
        reasonCodes.includes('accessnotconfigured') ||
        message.includes('api has not been used') ||
        message.includes('is disabled')
      );

      const isPermissionDenied =
        reasonCodes.includes('permissiondenied') ||
        reasonCodes.includes('permission_denied') ||
        message.includes('insufficient permissions');

      const activationUrl =
        googleError?.details?.find((detail: any) => detail?.metadata?.activationUrl)?.metadata?.activationUrl ??
        googleError?.details?.find((detail: any) => Array.isArray(detail?.links) && detail.links[0]?.url)?.links?.[0]?.url;

      if (isServiceDisabled) {
        return { valid: false, statusCode: 403, reason: 'service_disabled', activationUrl, error: 'Google Play API desactivada.', serviceAccountEmail };
      }

      if (response.status === 401) {
        return { valid: false, statusCode: 401, reason: 'permission_denied', error: 'Google Play API 401: permisos insuficientes.', serviceAccountEmail };
      }

      if (response.status === 403 || isPermissionDenied) {
        return { valid: false, statusCode: 403, reason: 'permission_denied', error: 'Google Play API 403: permisos insuficientes.', serviceAccountEmail };
      }

      return { valid: false, statusCode: response.status, reason: 'other', error: `Google Play API error: ${response.status}` };
    }

    const purchaseData = await response.json();
    console.log('[INFO] Google Play purchase data:', JSON.stringify(purchaseData));

    if (purchaseData.purchaseState !== 0) {
      return { valid: false, purchaseState: purchaseData.purchaseState, error: `Purchase state is ${purchaseData.purchaseState}, not purchased` };
    }

    return { valid: true, consumptionState: purchaseData.consumptionState, purchaseState: purchaseData.purchaseState };

  } catch (error) {
    console.error('[ERROR] Verification error:', error);
    return { valid: false, statusCode: 500, error: String(error) };
  }
}

async function getGoogleAccessToken(serviceAccount: any): Promise<{
  access_token?: string;
  error?: string;
  error_description?: string;
}> {
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    return { error: 'invalid_service_account', error_description: 'Faltan client_email o private_key.' };
  }

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

  const privateKey = String(serviceAccount.private_key).replace(/\\n/g, '\n');
  const pemContents = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsignedToken));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${unsignedToken}.${signatureB64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenPayload = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenPayload?.access_token) {
    return {
      error: tokenPayload?.error ?? 'oauth_token_error',
      error_description: tokenPayload?.error_description ?? `Token endpoint HTTP ${tokenResponse.status}`,
    };
  }

  return tokenPayload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ success: false, error: 'Server configuration error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAnonClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
      const { data: userData } = await supabaseAnonClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    const { purchaseToken, productId: rawProductId, orderId, packageName: purchasePackageName } = await req.json();

    if (!purchaseToken || !rawProductId) {
      return new Response(JSON.stringify({ success: false, error: "Missing purchaseToken or productId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const productId = normalizeGoogleProductId(rawProductId);
    const purchaseKey = orderId || purchaseToken;
    const purchaseRecordId = `gp_${purchaseKey}`;
    const isGuest = !userId;

    const defaultPackageName = "com.mysticgarden.game";
    const packageCandidates = Array.from(new Set([
      typeof purchasePackageName === "string" ? purchasePackageName.trim() : "",
      Deno.env.get("ANDROID_PACKAGE_NAME") ?? "",
      defaultPackageName,
    ].filter((pkg): pkg is string => Boolean(pkg))));

    console.log(`[INFO] Verifying purchase: rawProduct=${rawProductId}, normalizedProduct=${productId}, order=${orderId}, user=${userId || 'GUEST'}, isGuest=${isGuest}`);

    await supabaseClient.from('app_events').insert({
      event_name: 'gp_verify_started',
      event_data: { productId, rawProductId, orderId: orderId || null, purchaseTokenPrefix: purchaseToken.slice(0, 12), packageCandidates, isGuest, userId },
      platform: 'android',
      device_id: purchaseToken.slice(0, 24),
    });

    const serviceAccountKey = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT") || null;
    const [primaryPackageName, ...fallbackPackageNames] = packageCandidates;
    let resolvedPackageName = primaryPackageName;
    let verification = await verifyWithGooglePlay(primaryPackageName, rawProductId, purchaseToken, serviceAccountKey);

    const shouldRetryPackageFallback = (statusCode?: number) => statusCode === 401 || statusCode === 403 || statusCode === 404;

    if (!verification.valid && shouldRetryPackageFallback(verification.statusCode)) {
      for (const candidatePackageName of fallbackPackageNames) {
        const candidateResult = await verifyWithGooglePlay(candidatePackageName, rawProductId, purchaseToken, serviceAccountKey);
        resolvedPackageName = candidatePackageName;
        verification = candidateResult;
        if (candidateResult.valid || !shouldRetryPackageFallback(candidateResult.statusCode)) break;
      }
    }

    if (!verification.valid) {
      console.error('[ERROR] Purchase verification failed:', verification.error);
      await supabaseClient.from('app_events').insert({
        event_name: 'gp_verify_failed',
        event_data: { productId, rawProductId, orderId: orderId || null, packageName: resolvedPackageName, error: verification.error || 'Purchase verification failed', googleStatus: verification.statusCode ?? null, reason: verification.reason ?? null, isGuest, userId },
        platform: 'android',
        device_id: purchaseToken.slice(0, 24),
      });

      const status = verification.statusCode === 403 || verification.statusCode === 401 ? 503 : 400;
      const responsePayload: Record<string, unknown> = {
        success: false,
        error: verification.error || 'Purchase verification failed',
        code: verification.statusCode ?? null,
        reason: verification.reason ?? null,
        packageName: resolvedPackageName,
      };
      if (verification.reason === 'server_not_configured') {
        responsePayload.code = 'SERVER_VERIFICATION_NOT_CONFIGURED';
      }
      return new Response(JSON.stringify(responsePayload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      });
    }

    console.log('[INFO] Purchase verified successfully with Google Play');

    await supabaseClient.from('app_events').insert({
      event_name: 'gp_verify_ok',
      event_data: { productId, rawProductId, orderId: orderId || null, packageName: resolvedPackageName, purchaseState: verification.purchaseState ?? null, consumptionState: verification.consumptionState ?? null, isGuest, userId },
      platform: 'android',
      device_id: purchaseToken.slice(0, 24),
    });

    const rewards = PRODUCT_REWARDS[productId];
    if (!rewards) {
      throw new Error(`Unknown product: ${productId} (raw=${rawProductId})`);
    }

    if (userId) {
      const idempotencyId = `google_${purchaseKey}`;
      const { error: lockError } = await supabaseClient.from('processed_webhook_events').insert({
        id: idempotencyId,
        user_id: userId,
        product_id: productId,
        stripe_session_id: orderId || null,
      });

      if (lockError) {
        if (lockError.code === '23505') {
          console.log('[INFO] Google purchase already processed');
          return new Response(JSON.stringify({ success: true, message: 'Already processed', rewards }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        throw lockError;
      }

      try {
        const { data: progress, error: progressError } = await supabaseClient
          .from('game_progress')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (progressError && progressError.code !== 'PGRST116') throw progressError;

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
        if (rewards.noAdsForever) {
          updates.no_ads_until = '2099-12-31T23:59:59.000Z';
        }
        if (rewards.unlimitedLivesMinutes) {
          const now = new Date();
          const currentUL = progress?.unlimited_lives_until ? new Date(progress.unlimited_lives_until as string) : null;
          const base = (currentUL && currentUL > now) ? currentUL : now;
          updates.unlimited_lives_until = new Date(base.getTime() + rewards.unlimitedLivesMinutes * 60 * 1000).toISOString();
        }

        if (progress) {
          await supabaseClient.from('game_progress').update(updates).eq('user_id', userId);
        } else {
          updates.lives = updates.lives || 5;
          updates.gems = updates.gems || 0;
          await supabaseClient.from('game_progress').insert(updates);
        }

        const purchaseExpiresAt = rewards.noAdsForever
          ? null
          : rewards.noAdsDays
            ? new Date(Date.now() + rewards.noAdsDays * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const { error: insertPurchaseError } = await supabaseClient.from('user_purchases').insert({
          user_id: userId,
          product_id: productId,
          expires_at: purchaseExpiresAt,
        });

        if (insertPurchaseError) throw insertPurchaseError;
      } catch (grantError) {
        await supabaseClient.from('processed_webhook_events').delete().eq('id', idempotencyId);
        throw grantError;
      }

      if (rewards.noAdsForever && productId !== 'no_ads_forever') {
        await supabaseClient.from('user_purchases').insert({
          user_id: userId,
          product_id: 'no_ads_forever',
          expires_at: null,
        });
      }

      await supabaseClient.from('app_events').insert({
        event_name: 'gp_purchase_granted',
        event_data: { productId, orderId: orderId || null, isGuest: false, userId, rewards },
        platform: 'android',
        device_id: purchaseToken.slice(0, 24),
      });

      console.log(`[INFO] ✅ Purchase completed (authenticated): ${productId} for user ${userId}`);
    } else {
      await supabaseClient.from('app_events').insert({
        event_name: 'gp_purchase_guest_verified',
        event_data: { productId, orderId: orderId || null, isGuest: true },
        platform: 'android',
        device_id: purchaseToken.slice(0, 24),
      });

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
