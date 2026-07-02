import { useEffect, useState } from 'react';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useLanguage } from '@/hooks/useLanguage';

interface Props {
  /** Activar cuando se completa el nivel con movimientos restantes */
  movesLeft: number;
  onComplete?: () => void;
}

/**
 * Sugar Crush: al ganar con movimientos sobrantes, cada movimiento se
 * "explota" añadiendo puntos con confetti. Feature flag: sugarCrush.
 */
export const SugarCrushSequence = ({ movesLeft, onComplete }: Props) => {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);
  const active = FEATURE_FLAGS.sugarCrush && movesLeft > 0;

  useEffect(() => {
    if (!active) { onComplete?.(); return; }
    if (idx >= movesLeft) { onComplete?.(); return; }
    const to = setTimeout(() => setIdx((i) => i + 1), 220);
    return () => clearTimeout(to);
  }, [idx, movesLeft, active, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[70] flex flex-col items-center justify-center">
      <div className="text-6xl font-black text-yellow-300 drop-shadow-lg animate-scale-in">
        {t('sugar_crush.title') || '¡SUGAR CRUSH!'}
      </div>
      <div className="mt-2 text-2xl text-white font-bold drop-shadow">
        +{idx * 500}
      </div>
      <div className="mt-1 text-sm text-white/80">
        {idx}/{movesLeft}
      </div>
    </div>
  );
};
