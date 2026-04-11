import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/trackEvent';

interface VersionConfig {
  minNativeVersionCode: number;
  latestWebVersion: string;
  latestNativeVersionCode: number;
  latestNativeVersionName: string;
  playStoreUrl: string;
  updateMessage: string | null;
}

interface AppUpdateState {
  /** True while checking version */
  checking: boolean;
  /** True if a native update from Google Play is required */
  nativeUpdateRequired: boolean;
  /** URL to the Play Store listing */
  playStoreUrl: string;
  /** Optional custom message from backend */
  updateMessage: string | null;
  /** Current native version code (0 on web) */
  currentVersionCode: number;
  /** Required minimum version code */
  requiredVersionCode: number;
}

/**
 * Checks on app startup whether the native app version is outdated.
 *
 * Web content updates are handled automatically via the Capacitor
 * server.url config (OTA from published URL).
 *
 * This hook only handles the case where a NEW AAB is required
 * (native changes like Java code, permissions, billing library).
 */
export const useAppUpdate = (): AppUpdateState => {
  const [state, setState] = useState<AppUpdateState>({
    checking: true,
    nativeUpdateRequired: false,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.mysticgarden.game',
    updateMessage: null,
    currentVersionCode: 0,
    requiredVersionCode: 0,
  });

  useEffect(() => {
    const checkVersion = async () => {
      // Only check on Android (web always loads latest)
      if (Capacitor.getPlatform() !== 'android') {
        setState(prev => ({ ...prev, checking: false }));
        return;
      }

      try {
        // Get current native version
        const appInfo = await App.getInfo();
        const currentVersionCode = parseInt(appInfo.build, 10) || 0;

        trackEvent('app_version_check_start', {
          currentVersionCode,
          currentVersionName: appInfo.version,
          platform: 'android',
        });

        // Fetch version config from backend
        const { data, error } = await supabase.functions.invoke('check-app-version');

        if (error) {
          console.warn('[APP_UPDATE] Failed to check version:', error);
          trackEvent('app_version_check_error', { error: error.message });
          // On error, don't block the app - let them play
          setState(prev => ({ ...prev, checking: false }));
          return;
        }

        const config = data as VersionConfig;

        const nativeUpdateRequired = currentVersionCode < config.minNativeVersionCode;

        trackEvent('app_version_check_result', {
          currentVersionCode,
          minRequired: config.minNativeVersionCode,
          latestAvailable: config.latestNativeVersionCode,
          nativeUpdateRequired,
        });

        if (nativeUpdateRequired) {
          console.log(
            `[APP_UPDATE] Native update required: current=${currentVersionCode}, min=${config.minNativeVersionCode}`
          );
        }

        setState({
          checking: false,
          nativeUpdateRequired,
          playStoreUrl: config.playStoreUrl,
          updateMessage: config.updateMessage,
          currentVersionCode,
          requiredVersionCode: config.minNativeVersionCode,
        });
      } catch (err) {
        console.warn('[APP_UPDATE] Unexpected error:', err);
        // Don't block the app on errors
        setState(prev => ({ ...prev, checking: false }));
      }
    };

    checkVersion();
  }, []);

  return state;
};
