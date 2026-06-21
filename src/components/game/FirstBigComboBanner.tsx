import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trackEvent } from '@/lib/trackEvent';

const FLAG = 'combo_tip_first_big_shown_v1';

interface Props {
  /** Se incrementa cada vez que el jugador hace match-5+, cascada x3+, o match-6+ */
  trigger: number;
  levelId: number;
}

/**
 * Tip 3 — Banner celebratorio "¡INCREÍBLE!" la PRIMERA vez en la vida
 * del jugador que consigue un match-5+ o un combo x3+. Refuerza el
 * descubrimiento del sistema. Una sola vez.
 */
export const FirstBigComboBanner = ({ trigger, levelId }: Props) => {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    try {
      if (localStorage.getItem(FLAG) === '1') return;
      localStorage.setItem(FLAG, '1');
    } catch { return; }
    setShow(true);
    try {
      trackEvent('combo_tip_first_big_shown', { level: levelId });
    } catch {}
    const timer = setTimeout(() => setShow(false), 3200);
    return () => clearTimeout(timer);
  }, [trigger, levelId]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center pointer-events-none p-4">
      <div className="gradient-card border-2 border-accent shadow-gold rounded-2xl p-5 max-w-xs text-center animate-scale-in">
        <div className="text-5xl mb-1">🎉</div>
        <h3 className="text-2xl font-bold text-accent mb-1">
          {t('combo_tips.first_big.title')}
        </h3>
        <p className="text-sm text-foreground/90">
          {t('combo_tips.first_big.body')}
        </p>
      </div>
    </div>
  );
};
