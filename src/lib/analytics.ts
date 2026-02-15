/**
 * Analytics events for monetization tracking
 * Android nativo → @capacitor-firebase/analytics (ÚNICO método)
 * Web → Firebase JS SDK (fallback)
 */
import { Capacitor } from "@capacitor/core";
import { ensureFirebase } from "./firebase";

type AnalyticsEventName = 
  | 'first_purchase_offer_shown'
  | 'first_purchase_completed'
  | 'defeat_offer_shown'
  | 'defeat_purchase_completed'
  | 'level10_popup_shown'
  | 'level10_purchase_success'
  | 'level10_popup_closed'
  | 'level6_popup_shown'
  | 'level6_purchase_success'
  | 'level6_popup_closed'
  | 'debug_level6_reached'
  | 'debug_level6_direct'
  | 'debug_level10_direct';

interface EventData {
  product?: string;
  price?: number;
  level?: number;
  progress?: number;
  movesShort?: number;
  countdown?: number;
}

/**
 * Emit an analytics event.
 * Android: SOLO usa @capacitor-firebase/analytics (plugin nativo).
 * Web: usa Firebase JS SDK (lazy loaded).
 */
export const emitAnalyticsEvent = (eventName: AnalyticsEventName, data?: EventData) => {
  console.log(`[ANALYTICS] Preparing: ${eventName}`, data || {});
  
  if (Capacitor.isNativePlatform()) {
    // ── ANDROID NATIVO ──
    console.log(`[ANALYTICS NATIVE] Sending: ${eventName}`, data || {});
    import("@capacitor-firebase/analytics").then(({ FirebaseAnalytics }) => {
      FirebaseAnalytics.logEvent({ name: eventName, params: data || {} })
        .then(() => console.log(`[ANALYTICS NATIVE] ✅ ${eventName} sent OK`))
        .catch((e: any) => console.warn(`[ANALYTICS NATIVE] ⚠️ ${eventName} failed`, e));
    }).catch((e) => console.warn("[ANALYTICS NATIVE] Plugin not available", e));
  } else {
    // ── WEB — Firebase JS SDK ──
    console.log(`[ANALYTICS WEB] Sending: ${eventName}`, data || {});
    ensureFirebase().then(async (analyticsInstance) => {
      if (analyticsInstance) {
        try {
          const { logEvent } = await import("firebase/analytics");
          logEvent(analyticsInstance, eventName, data || {});
          console.log(`[ANALYTICS WEB] ✅ ${eventName} sent OK`);
        } catch (e) {
          console.warn(`[ANALYTICS WEB] ⚠️ ${eventName} failed`, e);
        }
      }
    }).catch(() => {});
  }
  
  // localStorage for local debugging
  const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
  events.push({
    event: eventName,
    data,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100)));
};

/**
 * Check if an offer can be shown today (max 1 per session)
 */
export const canShowOfferToday = (): boolean => {
  const offerShownToday = localStorage.getItem('offer_shown_today');
  const lastOfferDate = localStorage.getItem('last_offer_date');
  const today = new Date().toDateString();
  
  if (lastOfferDate !== today) {
    localStorage.removeItem('offer_shown_today');
    localStorage.setItem('last_offer_date', today);
    return true;
  }
  
  return !offerShownToday;
};

/**
 * Mark that an offer was shown today
 */
export const markOfferShown = () => {
  const today = new Date().toDateString();
  localStorage.setItem('offer_shown_today', 'true');
  localStorage.setItem('last_offer_date', today);
};

/**
 * Check if welcome offer was already shown/claimed
 */
export const hasSeenWelcomeOffer = (): boolean => {
  if (localStorage.getItem('welcome_offer_claimed')) return true;
  const rejectedDate = localStorage.getItem('welcome_offer_rejected_date');
  const today = new Date().toDateString();
  return rejectedDate === today;
};

/**
 * Check if this is the player's first purchase ever
 */
export const hasCompletedFirstPurchase = (): boolean => {
  return localStorage.getItem('first_purchase_completed') === 'true';
};

/**
 * Emit Level 10 specific analytics event
 * Centralizado — usa emitAnalyticsEvent internamente
 */
export const emitLevel10Event = (
  eventName: 'level10_popup_shown' | 'level10_purchase_success' | 'level10_popup_closed',
  data?: { progress?: number; movesShort?: number; countdown?: number }
) => {
  console.log(`[Level10 Analytics] ${eventName}`, data || {});
  
  // localStorage for local debugging
  const events = JSON.parse(localStorage.getItem('level10_events') || '[]');
  events.push({
    event: eventName,
    data,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('level10_events', JSON.stringify(events.slice(-50)));
  
  // Emit via unified analytics (native or web)
  emitAnalyticsEvent(eventName, { level: 10, ...data });
};
