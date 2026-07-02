import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface ComboMultiplierProps {
  /** Multiplicador actual de la cascada (1 = jugada inicial, 2-5 = combos) */
  combo: number;
  onComboEnd?: () => void;
}

/**
 * CAMBIO SCORING — feedback visual del multiplicador por cascada.
 * Banner pequeño, lateral y sin bloquear. Cada combo vive su propio
 * ciclo de ~900 ms; no depende de que la cascada continúe.
 */
export const ComboMultiplier = ({ combo, onComboEnd }: ComboMultiplierProps) => {
  const { t } = useLanguage();
  const [visibleCombo, setVisibleCombo] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef(onComboEnd);

  // Mantener la callback actual sin reiniciar el timer en cada render.
  useEffect(() => {
    endRef.current = onComboEnd;
  }, [onComboEnd]);

  // Cada vez que el multiplicador sube a >=2, mostramos el banner y
  // forzamos su cierre tras 900 ms, independientemente de los matches
  // posteriores. Si el combo sube más, reiniciamos el ciclo con el valor mayor.
  useEffect(() => {
    if (combo >= 2) {
      setVisibleCombo(combo);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisibleCombo(null);
        endRef.current?.();
      }, 900);
    }
  }, [combo]);

  // Limpieza al desmontar para no dejar timers huérfanos.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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

  return (
    <div
      key={visibleCombo}
      className="fixed top-12 right-2 pointer-events-none z-40 animate-fade-in"
    >
      <div
        className={`bg-gradient-to-br ${getGradient()} px-1 py-0.5 rounded-lg border border-white/50`}
      >
        <p
          className="text-[10px] font-bold text-white tracking-wide"
          style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}
        >
          {label} x{visibleCombo}!
        </p>
      </div>
    </div>
  );
};
