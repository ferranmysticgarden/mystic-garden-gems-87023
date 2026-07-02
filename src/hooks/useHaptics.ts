import { useCallback } from 'react';
import { FEATURE_FLAGS } from '@/config/featureFlags';

/**
 * Haptics con guard silencioso. Si el plugin nativo no está presente
 * (AAB 2091 o web), usa navigator.vibrate como fallback y nunca lanza.
 */
type Style = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const webVibrate = (ms: number) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      (navigator as Navigator & { vibrate: (p: number | number[]) => boolean }).vibrate(ms);
    }
  } catch {}
};

export const useHaptics = () => {
  const impact = useCallback(async (style: Style = 'light') => {
    if (!FEATURE_FLAGS.haptics) return;
    try {
      const mod = await import('@capacitor/haptics').catch(() => null);
      if (mod && (mod as any).Haptics) {
        const H = (mod as any).Haptics;
        const S = (mod as any).ImpactStyle ?? {};
        if (['success', 'warning', 'error'].includes(style)) {
          await H.notification({ type: style }).catch(() => {});
        } else {
          const map: Record<string, unknown> = { light: S.Light, medium: S.Medium, heavy: S.Heavy };
          await H.impact({ style: map[style] ?? S.Light }).catch(() => {});
        }
        return;
      }
    } catch {}
    // Fallback web silencioso
    const dur = style === 'heavy' || style === 'error' ? 30 : style === 'medium' ? 15 : 8;
    webVibrate(dur);
  }, []);

  return { impact };
};
