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
import { Device } from '@capacitor/device';

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
let cachedDeviceInfoPromise: Promise<{ country: string | null; locale: string | null } | null> | null = null;
let cachedCountryIpPromise: Promise<string | null> | null = null;

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

const getDeviceInfo = async (): Promise<{ country: string | null; locale: string | null } | null> => {
  if (!cachedDeviceInfoPromise) {
    cachedDeviceInfoPromise = Device.getLanguageTag()
      .then((res) => {
        const langTag = res.value; // e.g. "es-ES"
        const country = langTag.split('-')[1] || langTag;
        return {
          country,
          locale: langTag,
        };
      })
      .catch(() => null);
  }

  return cachedDeviceInfoPromise;
};

/**
 * Resolve the caller's REAL country via server-side IP geolocation.
 * Cached for the lifetime of the session. Fully defensive: returns null on
 * any failure (network, timeout, edge function error) so it can never block
 * an event from being tracked. Lives alongside `country` (from OS locale),
 * which we keep unchanged for backwards compatibility.
 */
const getCountryIp = async (): Promise<string | null> => {
  if (!cachedCountryIpPromise) {
    cachedCountryIpPromise = (async () => {
      try {
        const { data, error } = await (supabase.functions as any).invoke('geo-lookup', {
          method: 'GET',
        });
        if (error) return null;
        const country = (data as any)?.country;
        return typeof country === 'string' && /^[A-Z]{2}$/.test(country) ? country : null;
      } catch {
        return null;
      }
    })();
  }
  return cachedCountryIpPromise;
};

export const trackEvent = async (
  eventName: string,
  eventData?: Record<string, unknown>
) => {
  try {
    const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
    const deviceId = getDeviceId();
    const appInfo = await getAppInfo();
    const deviceInfo = await getDeviceInfo();
    // Country-by-IP is best-effort; the helper swallows its own failures.
    const countryIp = await getCountryIp().catch(() => null);

    const enrichedEventData = {
      ...(eventData || {}),
      app_version: appInfo?.version ?? null,
      app_build: appInfo?.build ?? null,
      country: deviceInfo?.country ?? null,
      locale: deviceInfo?.locale ?? null,
      country_ip: countryIp,
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
