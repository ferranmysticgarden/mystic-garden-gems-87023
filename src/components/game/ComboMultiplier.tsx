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
      className="fixed top-20 right-3 pointer-events-none z-[40] animate-fade-in"
    >
      <div
        className={`bg-gradient-to-br ${getGradient()} px-2.5 py-1 rounded-xl`}
        style={{
          boxShadow: '0 2px 12px rgba(251, 191, 36, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <p
          className="text-sm font-black text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        >
          {label} x{visibleCombo}!
        </p>
      </div>
    </div>
  );
};
