import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { trackEvent } from '@/lib/trackEvent';

const FLAG = 'combo_tip_defeat_last_shown_v1';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h

interface Props {
  levelId: number;
  /** True si el nivel es score y el jugador NO hizo ningún combo x2+ ni match-4+ */
  shouldShow: boolean;
}

/**
 * Tip 2 — Banner sutil dentro del overlay de derrota cuando el jugador
 * pierde un nivel "score" sin haber hecho combos ni matches grandes.
 * Anti-spam: máximo 1 vez cada 24h (localStorage).
 */
export const ComboTipDefeatBanner = ({ levelId, shouldShow }: Props) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldShow) return;
    try {
      const last = localStorage.getItem(FLAG);
      if (last) {
        const lastTs = parseInt(last, 10);
        if (!Number.isNaN(lastTs) && Date.now() - lastTs < COOLDOWN_MS) return;
      }
      localStorage.setItem(FLAG, String(Date.now()));
    } catch { return; }
    setVisible(true);
    try {
      trackEvent('combo_tip_defeat_shown', { level: levelId });
    } catch {}
  }, [shouldShow, levelId]);

  if (!visible) return null;

  return (
    <div className="mt-4 bg-accent/15 border border-accent/40 rounded-xl p-3 text-sm text-left">
      <div className="font-bold text-accent mb-1">💡 {t('combo_tips.defeat.title')}</div>
      <div className="text-foreground/85 leading-snug">
        {t('combo_tips.defeat.body')}
      </div>
    </div>
  );
};
