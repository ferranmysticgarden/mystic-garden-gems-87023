import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '@/hooks/useLanguage';
import { trackEvent } from '@/lib/trackEvent';

const FLAG_KEY = 'review_prompt_shown_v1';
const PACKAGE = 'com.mysticgarden.game';

const COPY = {
  es: {
    title: '¿Te está gustando Mystic Garden?',
    body: '¡Déjanos 5 estrellas y nos ayudas un montón! 🌟',
    yes: '¡Sí, claro!',
    later: 'Más tarde',
  },
  en: {
    title: 'Are you enjoying Mystic Garden?',
    body: 'Leave us 5 stars — it helps us a ton! 🌟',
    yes: 'Sure!',
    later: 'Later',
  },
  pt: {
    title: 'Está curtindo Mystic Garden?',
    body: 'Deixe 5 estrelas e nos ajude muito! 🌟',
    yes: 'Claro!',
    later: 'Mais tarde',
  },
} as const;

interface ReviewPromptProps {
  /** The level the user just finished. Only level 10 triggers this prompt. */
  level: number;
}

/**
 * Review prompt shown ONCE per device after completing level 10.
 *
 * - Persists "already shown" flag in localStorage (`review_prompt_shown_v1`).
 * - On Android, opens the Play Store via `market://details?id=...` intent,
 *   falling back to the https URL if not available.
 * - On web, opens the Play Store https URL in a new tab.
 *
 * TODO (future): integrate `@capacitor-community/in-app-review` for the
 * native overlay UX (no app switch). Requires a new dependency + AAB rebuild,
 * out of scope for this iteration.
 */
export const ReviewPrompt = ({ level }: ReviewPromptProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (level !== 10) return;
    try {
      if (localStorage.getItem(FLAG_KEY) === '1') return;
      localStorage.setItem(FLAG_KEY, '1');
    } catch {
      /* private mode: prompt may show again, acceptable */
    }
    setOpen(true);
    trackEvent('review_prompt_shown', { level });
  }, [level]);

  const lang = (language === 'en' || language === 'pt' ? language : 'es') as keyof typeof COPY;
  const t = COPY[lang];

  const handleYes = () => {
    trackEvent('review_prompt_clicked');
    const httpsUrl = `https://play.google.com/store/apps/details?id=${PACKAGE}`;
    if (Capacitor.getPlatform() === 'android') {
      const intent = `market://details?id=${PACKAGE}`;
      try {
        window.location.href = intent;
      } catch {
        window.open(httpsUrl, '_blank');
      }
      // Fallback after a short delay if the intent didn't resolve
      setTimeout(() => {
        try { window.open(httpsUrl, '_blank'); } catch { /* noop */ }
      }, 800);
    } else {
      window.open(httpsUrl, '_blank');
    }
    setOpen(false);
  };

  const handleLater = () => {
    trackEvent('review_prompt_dismissed');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4">
      <div className="relative max-w-sm w-full gradient-card rounded-3xl p-6 border-2 border-yellow-400/60 shadow-2xl animate-scale-in">
        <button
          onClick={handleLater}
          className="absolute top-3 right-3 text-muted-foreground/50 hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex justify-center gap-1 mb-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className="w-7 h-7 text-yellow-400 fill-yellow-400 drop-shadow"
              style={{ animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }}
            />
          ))}
        </div>
        <h2 className="text-xl font-bold text-center text-foreground mb-1">{t.title}</h2>
        <p className="text-sm text-center text-muted-foreground mb-5">{t.body}</p>
        <div className="space-y-2">
          <Button
            onClick={handleYes}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-5 rounded-xl text-lg"
          >
            ⭐ {t.yes}
          </Button>
          <Button
            onClick={handleLater}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {t.later}
          </Button>
        </div>
      </div>
    </div>
  );
};
