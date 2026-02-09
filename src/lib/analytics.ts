/**
 * Analytics events for monetization tracking
 * Firebase Analytics integration — real logEvent() calls
 */
import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";

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
   | 'level6_popup_closed';

interface EventData {
  product?: string;
  price?: number;
  level?: number;
  progress?: number;
   movesShort?: number;
   countdown?: number;
}

/**
 * Emit an analytics event to Firebase Analytics
 */
export const emitAnalyticsEvent = (eventName: AnalyticsEventName, data?: EventData) => {
  console.log(`[Analytics] ${eventName}`, data || {});
  
  // Send to Firebase Analytics
  if (analytics) {
    try {
      logEvent(analytics, eventName, data || {});
    } catch (e) {
      console.warn("[Analytics] Failed to send event", e);
    }
  }
  
  // Keep localStorage for local debugging
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
  
  // Reset if it's a new day
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
  // If claimed, never show again
  if (localStorage.getItem('welcome_offer_claimed')) return true;
  
  // If rejected today, don't show again today
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
  * Critical for tracking conversion funnel
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
    
    // Emitir al analytics general (que ahora envía a Firebase)
    emitAnalyticsEvent(eventName, { level: 10, ...data });
  };
