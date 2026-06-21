import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { trackEvent } from '@/lib/trackEvent';

const FLAG = 'combo_tip_intro_shown_v1';

interface Props {
  levelId: number;
  isScoreLevel: boolean;
}

/**
 * Tip 1 — Modal educativo mostrado UNA SOLA VEZ antes de entrar al
 * primer nivel de tipo "score" (objetivo de puntos). Enseña al jugador
 * el sistema de bonus por match grande y multiplicador de combos.
 */
export const ComboTipIntroModal = ({ levelId, isScoreLevel }: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isScoreLevel) return;
    try {
      if (localStorage.getItem(FLAG) === '1') return;
    } catch { return; }
    setOpen(true);
    try {
      trackEvent('combo_tip_intro_shown', { level: levelId });
    } catch {}
  }, [isScoreLevel, levelId]);

  if (!open) return null;

  const dismiss = () => {
    try { localStorage.setItem(FLAG, '1'); } catch {}
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="gradient-card shadow-card rounded-2xl p-6 max-w-sm w-full text-center border-2 border-accent/40">
        <div className="text-5xl mb-2">💡</div>
        <h2 className="text-2xl font-bold text-accent mb-3">
          {t('combo_tips.intro.title')}
        </h2>
        <p className="text-base text-foreground/90 mb-4 leading-relaxed">
          {t('combo_tips.intro.body')}
        </p>
        <div className="bg-black/30 rounded-xl p-3 mb-4 text-sm text-left space-y-1">
          <div>🟢 <b>3 fichas</b> → 30 pts</div>
          <div>🟡 <b>4 fichas</b> → 80 pts</div>
          <div>🟠 <b>5 fichas</b> → 150 pts</div>
          <div>🔴 <b>6+ fichas</b> → 300 pts</div>
          <div className="pt-1 border-t border-white/10 mt-1">
            ⚡ <b>{t('combo_tips.intro.cascade')}</b>
          </div>
        </div>
        <Button
          onClick={dismiss}
          className="gradient-gold shadow-gold text-lg py-4 px-8 w-full"
        >
          {t('combo_tips.intro.cta')}
        </Button>
      </div>
    </div>
  );
};
