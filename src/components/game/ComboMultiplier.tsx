import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface ComboMultiplierProps {
  /** Multiplicador actual de la cascada (1 = jugada inicial, 2-5 = combos) */
  combo: number;
  onComboEnd?: () => void;
}

/**
 * CAMBIO SCORING — feedback visual del multiplicador por cascada.
 * Banner lateral pequeño pero legible. Ciclo por combo:
 *   250ms pop-in → 900ms visible → 250ms fade-out. Total ≈ 1400ms.
 */
export const ComboMultiplier = ({ combo, onComboEnd }: ComboMultiplierProps) => {
  const { t } = useLanguage();
  const [visibleCombo, setVisibleCombo] = useState<number | null>(null);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef(onComboEnd);

  useEffect(() => {
    endRef.current = onComboEnd;
  }, [onComboEnd]);

  useEffect(() => {
    if (combo >= 2) {
      setVisibleCombo(combo);
      setPhase('in');
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      // Tras 1150ms empieza el fade-out; a los 1400ms se desmonta.
      hideTimer.current = setTimeout(() => setPhase('out'), 1150);
      clearTimer.current = setTimeout(() => {
        setVisibleCombo(null);
        endRef.current?.();
      }, 1400);
    }
  }, [combo]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  if (!visibleCombo || visibleCombo < 2) return null;

  const getGradient = () => {
    if (visibleCombo >= 5) return 'from-red-500 via-orange-500 to-yellow-400';
    if (visibleCombo >= 4) return 'from-orange-500 via-yellow-500 to-amber-400';
    if (visibleCombo >= 3) return 'from-yellow-500 via-amber-400 to-yellow-300';
    return 'from-amber-400 via-yellow-300 to-amber-200';
  };

  const label = t('combo.x') || 'COMBO';
  const anim = phase === 'in' ? 'animate-combo-pop' : 'animate-fade-out';

  return (
    <div
      key={visibleCombo}
      className={`fixed top-24 right-3 pointer-events-none z-40 ${anim}`}
    >
      <div
        className={`bg-gradient-to-br ${getGradient()} px-3 py-1.5 rounded-xl border border-white/70`}
        style={{ boxShadow: '0 0 12px rgba(255,200,60,0.55)' }}
      >
        <p
          className="text-base font-black text-white tracking-wide leading-none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.55)' }}
        >
          {label} x{visibleCombo}!
        </p>
      </div>
    </div>
  );
};
