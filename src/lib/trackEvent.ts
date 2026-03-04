/**
 * Direct event tracking to Supabase — bypasses Firebase native plugin
 * which may not be working on Android.
 * 
 * Use this for CRITICAL funnel events only (offer shown, purchase attempt, billing status).
 * Non-critical events should still use emitAnalyticsEvent (Firebase).
 */
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Simple device fingerprint for grouping events (NOT PII)
const getDeviceId = (): string => {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
  }
  return id;
};

export const trackEvent = async (
  eventName: string,
  eventData?: Record<string, unknown>
) => {
  try {
    const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
    const deviceId = getDeviceId();

    console.log(`[TRACK] ${eventName}`, { platform, ...eventData });

    await (supabase.from('app_events' as any) as any).insert({
      event_name: eventName,
      event_data: eventData || {},
      platform,
      device_id: deviceId,
    });
  } catch (e) {
    // Never block the app for tracking failures
    console.warn('[TRACK] Failed to send event:', e);
  }
};
