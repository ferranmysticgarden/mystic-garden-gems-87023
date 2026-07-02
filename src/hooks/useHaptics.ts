import { useCallback } from 'react';
import { FEATURE_FLAGS } from '@/config/featureFlags';

/**
 * Haptics con guard silencioso.
 * En AAB 2091 no está el plugin @capacitor/haptics, así que solo usamos
 * navigator.vibrate como fallback. Nunca lanza. En AAB 2092+ se podrá
 * añadir el plugin sin tocar este hook si se hace via window global.
 */
type Style = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const webVibrate = (ms: number) => {
  try {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }) : null;
    if (nav && typeof nav.vibrate === 'function') nav.vibrate(ms);
  } catch {}
};

export const useHaptics = () => {
  const impact = useCallback(async (style: Style = 'light') => {
    if (!FEATURE_FLAGS.haptics) return;
    // Bridge nativo opcional inyectado por wrapper Capacitor si existe
    try {
      const w = window as unknown as { Capacitor?: { Plugins?: { Haptics?: { impact?: (o: unknown) => Promise<void>; notification?: (o: unknown) => Promise<void> } } } };
      const H = w?.Capacitor?.Plugins?.Haptics;
      if (H) {
        if (['success', 'warning', 'error'].includes(style) && H.notification) {
          await H.notification({ type: style }).catch(() => {});
          return;
        }
        if (H.impact) {
          const styleMap: Record<string, string> = { light: 'LIGHT', medium: 'MEDIUM', heavy: 'HEAVY' };
          await H.impact({ style: styleMap[style] ?? 'LIGHT' }).catch(() => {});
          return;
        }
      }
    } catch {}
    const dur = style === 'heavy' || style === 'error' ? 30 : style === 'medium' ? 15 : 8;
    webVibrate(dur);
  }, []);

  return { impact };
};
