/**
 * Rewarded Ads (AdMob) — servicio central.
 *
 * - Solo funciona en el AAB que incluya el plugin nativo AdMob (2102+).
 *   En AABs antiguos (OTA) `isRewardedAdAvailable()` devuelve false y el
 *   juego sigue igual que antes.
 * - El premio SOLO se entrega si Google emite el evento "Rewarded"
 *   (vídeo visto entero). Si se cierra antes → 'dismissed', sin premio.
 * - Modo prueba por dispositivo: si localStorage `mg_ads_test_mode` = '1'
 *   (se activa desde el panel admin en ESE móvil) se usa el bloque de prueba
 *   oficial de Google. El resto del mundo usa el bloque real.
 */
import { Capacitor } from '@capacitor/core';
import { trackEvent } from '@/lib/trackEvent';

export const ADMOB_APP_ID = 'ca-app-pub-7198650429290924~9625844937';
const REAL_REWARDED_UNIT = 'ca-app-pub-7198650429290924/4935553828';
// Bloque de prueba oficial de Google para Rewarded (Android).
const GOOGLE_TEST_REWARDED_UNIT = 'ca-app-pub-3940256099942544/5224354917';

const TEST_MODE_KEY = 'mg_ads_test_mode';
const LOAD_TIMEOUT_MS = 12000;
const SHOW_GUARD_MS = 180000;

export type AdPlacement = 'level_failed' | 'no_lives' | 'menu_gems';
export type AdResult = 'rewarded' | 'dismissed' | 'unavailable';

export const isAdsTestMode = (): boolean => {
  try { return localStorage.getItem(TEST_MODE_KEY) === '1'; } catch { return false; }
};
export const setAdsTestMode = (on: boolean) => {
  try {
    if (on) localStorage.setItem(TEST_MODE_KEY, '1');
    else localStorage.removeItem(TEST_MODE_KEY);
  } catch {}
};

export const isRewardedAdAvailable = (): boolean => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AdMob');
  } catch {
    return false;
  }
};

let initPromise: Promise<boolean> | null = null;
let inFlight = false;

/** Inicializa AdMob + aviso de privacidad (GDPR/UMP). Idempotente, nunca lanza. */
export const initRewardedAds = (): Promise<boolean> => {
  if (!isRewardedAdAvailable()) return Promise.resolve(false);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
      const testMode = isAdsTestMode();
      await AdMob.initialize({ initializeForTesting: testMode });
      try {
        const info = await AdMob.requestConsentInfo();
        trackEvent('ad_consent_status', { status: info.status, form: info.isConsentFormAvailable });
        if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
          const after = await AdMob.showConsentForm();
          trackEvent('ad_consent_result', { status: after.status });
        }
      } catch (e) {
        trackEvent('ad_consent_error', { message: String((e as Error)?.message ?? e) });
      }
      trackEvent('ad_init_ok', { test_mode: testMode });
      return true;
    } catch (e) {
      trackEvent('ad_init_fail', { message: String((e as Error)?.message ?? e) });
      initPromise = null;
      return false;
    }
  })();
  return initPromise;
};

/** Carga y muestra un vídeo bonificado. Nunca lanza, nunca se queda colgado. */
export const showRewardedAd = async (placement: AdPlacement): Promise<AdResult> => {
  const testMode = isAdsTestMode();
  const base = { placement, test_mode: testMode };
  if (!isRewardedAdAvailable()) {
    trackEvent('ad_unavailable', { ...base, reason: 'plugin_missing' });
    return 'unavailable';
  }
  if (inFlight) return 'unavailable';
  inFlight = true;
  trackEvent('ad_requested', base);

  const handles: { remove: () => Promise<void> }[] = [];
  try {
    const ok = await initRewardedAds();
    if (!ok) {
      trackEvent('ad_failed', { ...base, stage: 'init' });
      return 'unavailable';
    }
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');

    let rewarded = false;
    const result = await new Promise<AdResult>(async (resolve) => {
      let settled = false;
      const done = (r: AdResult) => { if (!settled) { settled = true; resolve(r); } };

      handles.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        rewarded = true;
        trackEvent('ad_rewarded', base);
      }));
      handles.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        done(rewarded ? 'rewarded' : 'dismissed');
      }));
      handles.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err: any) => {
        trackEvent('ad_failed', { ...base, stage: 'show', code: err?.code ?? null, message: err?.message ?? null });
        done('unavailable');
      }));
      handles.push(await AdMob.addListener(RewardAdPluginEvents.Showed, () => {
        trackEvent('ad_shown', base);
      }));

      try {
        await Promise.race([
          AdMob.prepareRewardVideoAd({
            adId: testMode ? GOOGLE_TEST_REWARDED_UNIT : REAL_REWARDED_UNIT,
            isTesting: testMode,
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('load_timeout')), LOAD_TIMEOUT_MS)),
        ]);
        trackEvent('ad_loaded', base);
      } catch (e: any) {
        trackEvent('ad_failed', { ...base, stage: 'load', code: e?.code ?? null, message: String(e?.message ?? e) });
        done('unavailable');
        return;
      }

      // Guardia: si el SDK nunca emite Dismissed, no dejamos al jugador bloqueado.
      setTimeout(() => done(rewarded ? 'rewarded' : 'unavailable'), SHOW_GUARD_MS);

      try {
        const item = await AdMob.showRewardVideoAd();
        if (item && typeof (item as any).amount === 'number' && (item as any).amount > 0) {
          rewarded = true;
        }
      } catch (e: any) {
        trackEvent('ad_failed', { ...base, stage: 'show_call', message: String(e?.message ?? e) });
        done(rewarded ? 'rewarded' : 'unavailable');
      }
    });

    if (result === 'dismissed') trackEvent('ad_dismissed_early', base);
    return result;
  } catch (e) {
    trackEvent('ad_failed', { ...base, stage: 'unexpected', message: String((e as Error)?.message ?? e) });
    return 'unavailable';
  } finally {
    for (const h of handles) { try { await h.remove(); } catch {} }
    inFlight = false;
  }
};

// ── Límite diario de vidas por vídeo ──
export const MAX_AD_LIVES_PER_DAY = 5;
const lifeKey = () => `ad_lives_${new Date().toISOString().slice(0, 10)}`;
export const getAdLivesUsedToday = (): number => {
  try { return parseInt(localStorage.getItem(lifeKey()) || '0', 10) || 0; } catch { return 0; }
};
export const recordAdLife = () => {
  try { localStorage.setItem(lifeKey(), String(getAdLivesUsedToday() + 1)); } catch {}
};
export const canWatchAdForLife = () => getAdLivesUsedToday() < MAX_AD_LIVES_PER_DAY;
