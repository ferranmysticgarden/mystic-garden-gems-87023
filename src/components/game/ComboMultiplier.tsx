import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface ComboMultiplierProps {
  /** Multiplicador actual de la cascada (1 = jugada inicial, 2-5 = combos) */
  combo: number;
  onComboEnd?: () => void;
}

/**
 * CAMBIO SCORING — feedback visual del multiplicador por cascada.
 * Se muestra centrado, con bounce + glow dorado, sólo cuando combo >= 2.
 */
export const ComboMultiplier = ({ combo, onComboEnd }: ComboMultiplierProps) => {
  const { t } = useLanguage();
  const [visibleCombo, setVisibleCombo] = useState(0);

  useEffect(() => {
    if (combo >= 2) {
      setVisibleCombo(combo);
      const timer = setTimeout(() => {
        setVisibleCombo(0);
        onComboEnd?.();
      }, 850);
      return () => clearTimeout(timer);
    }
    // BUGFIX: si el padre resetea combo<2 antes del timeout interno,
    // ocultar el banner para que no quede permanente en pantalla.
    setVisibleCombo(0);
  }, [combo, onComboEnd]);

  if (visibleCombo < 2) return null;

  const getGradient = () => {
    if (visibleCombo >= 5) return 'from-red-500 via-orange-500 to-yellow-400';
    if (visibleCombo >= 4) return 'from-orange-500 via-yellow-500 to-amber-400';
    if (visibleCombo >= 3) return 'from-yellow-500 via-amber-400 to-yellow-300';
    return 'from-amber-400 via-yellow-300 to-amber-200';
  };

  const label = t('combo.x') || 'COMBO';

  return (
    <div
      key={visibleCombo}
      className="fixed inset-0 pointer-events-none z-[55] flex items-center justify-center"
    >
      <div
        className={`bg-gradient-to-br ${getGradient()} px-8 py-4 rounded-3xl animate-scale-in`}
        style={{
          boxShadow:
            '0 0 60px rgba(251, 191, 36, 0.9), 0 0 120px rgba(251, 191, 36, 0.5), inset 0 2px 0 rgba(255,255,255,0.4)',
          border: '3px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        <p
          className="text-5xl font-black text-white tracking-wider drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
          style={{ textShadow: '0 0 20px rgba(255,255,255,0.8)' }}
        >
          {label} x{visibleCombo}!
        </p>
      </div>
    </div>
  );
};
