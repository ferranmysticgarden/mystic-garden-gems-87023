import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/trackEvent";

const SPLASH_KEY = "mg_splash_shown_session";
const MAX_DURATION_MS = 800;
const MIN_VISIBLE_MS = 400;
const FADE_MS = 300;

interface SplashScreenProps {
  onDone?: () => void;
  /** External readiness signal (auth+state loaded). Splash dismisses on ready OR MAX_DURATION_MS. */
  ready?: boolean;
}

export const SplashScreen = ({ onDone, ready = false }: SplashScreenProps) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SPLASH_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [fading, setFading] = useState(false);
  const shownAtRef = useRef<number>(0);
  const dismissedRef = useRef(false);

  const dismiss = (reason: 'timeout' | 'ready') => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    const durationMs = Math.round(performance.now() - shownAtRef.current);
    setFading(true);
    trackEvent('splash_dismissed', { durationMs, reason });
    setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, FADE_MS);
  };

  // Mount: mark session, emit shown, schedule hard timeout
  useEffect(() => {
    if (!visible) return;
    try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch {}
    shownAtRef.current = performance.now();
    trackEvent('splash_shown', { ts: Date.now() });
    const hardTimer = setTimeout(() => dismiss('timeout'), MAX_DURATION_MS);
    return () => clearTimeout(hardTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to readiness (with MIN_VISIBLE_MS floor to avoid flash)
  useEffect(() => {
    if (!visible || !ready || dismissedRef.current) return;
    const elapsed = performance.now() - shownAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const t = setTimeout(() => dismiss('ready'), wait);
    return () => clearTimeout(t);
  }, [ready, visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{ pointerEvents: fading ? "none" : "auto" }}
      aria-hidden={fading}
    >
      <div className="flex flex-col items-center animate-fade-in">
        <div className="text-7xl mb-4 animate-scale-in">🌸🌺🌼</div>
        <h1 className="text-5xl font-bold text-gold drop-shadow-lg text-center px-6">
          {t("game.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground tracking-wide uppercase">
          {t("splash.tagline")}
        </p>
      </div>
    </div>
  );
};
