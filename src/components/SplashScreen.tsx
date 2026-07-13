import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trackEvent } from "@/lib/trackEvent";

const SPLASH_KEY = "mg_splash_shown_session";

interface SplashScreenProps {
  onDone?: () => void;
}

export const SplashScreen = ({ onDone }: SplashScreenProps) => {
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

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {}
    shownAtRef.current = performance.now();
    trackEvent('splash_shown', { ts: Date.now() });
    const fadeTimer = setTimeout(() => setFading(true), 1700);
    const hideTimer = setTimeout(() => {
      const durationMs = Math.round(performance.now() - shownAtRef.current);
      trackEvent('splash_dismissed', { durationMs });
      setVisible(false);
      onDone?.();
    }, 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
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
