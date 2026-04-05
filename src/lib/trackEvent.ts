/**
 * Direct event tracking to Supabase — bypasses Firebase native plugin
 * which may not be working on Android.
 * 
 * Use this for CRITICAL funnel events only (offer shown, purchase attempt, billing status).
 * Non-critical events should still use emitAnalyticsEvent (Firebase).
 */
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Simple device fingerprint for grouping events (NOT PII)
const getDeviceId = (): string => {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
  }
  return id;
};

let cachedAppInfoPromise: Promise<{ version: string | null; build: string | null } | null> | null = null;

const getAppInfo = async (): Promise<{ version: string | null; build: string | null } | null> => {
  if (!cachedAppInfoPromise) {
    cachedAppInfoPromise = App.getInfo()
      .then((info) => ({
        version: info.version ?? null,
        build: info.build ?? null,
      }))
      .catch(() => null);
  }

  return cachedAppInfoPromise;
};

export const trackEvent = async (
  eventName: string,
  eventData?: Record<string, unknown>
) => {
  try {
    const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
    const deviceId = getDeviceId();
    const appInfo = await getAppInfo();
    const enrichedEventData = {
      ...(eventData || {}),
      app_version: appInfo?.version ?? null,
      app_build: appInfo?.build ?? null,
    };

    console.log(`[TRACK] ${eventName}`, { platform, ...enrichedEventData });

    await (supabase.from('app_events' as any) as any).insert({
      event_name: eventName,
      event_data: enrichedEventData,
      platform,
      device_id: deviceId,
    });
  } catch (e) {
    // Never block the app for tracking failures
    console.warn('[TRACK] Failed to send event:', e);
  }
};
