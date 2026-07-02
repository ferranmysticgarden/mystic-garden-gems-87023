import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface ComboMultiplierProps {
  /** Multiplicador actual de la cascada (1 = jugada inicial, 2-5+ = combos) */
  combo: number;
  onComboEnd?: () => void;
}

/**
 * CAMBIO SCORING — sello estilo Candy Crush centrado en el tablero.
 * Ciclo por combo: 250ms stamp-in → 500ms hold → 300ms stamp-out. Total ≈ 1050ms.
 * Debe renderizarse dentro de un contenedor `relative` (área del Board).
 */
export const ComboMultiplier = ({ combo, onComboEnd }: ComboMultiplierProps) => {
  const { t } = useLanguage();
  const [visibleCombo, setVisibleCombo] = useState<number | null>(null);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef(onComboEnd);

  useEffect(() => {
    endRef.current = onComboEnd;
  }, [onComboEnd]);

  useEffect(() => {
    if (combo >= 2) {
      setVisibleCombo(combo);
      setPhase('in');
      if (outTimer.current) clearTimeout(outTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      // 250ms in + 500ms hold → arranca fade-out a los 750ms
      outTimer.current = setTimeout(() => setPhase('out'), 750);
      // 750ms + 300ms out → desmontar a los 1050ms
      clearTimer.current = setTimeout(() => {
        setVisibleCombo(null);
        endRef.current?.();
      }, 1050);
    }
  }, [combo]);

  useEffect(() => {
    return () => {
      if (outTimer.current) clearTimeout(outTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  if (!visibleCombo || visibleCombo < 2) return null;

  const getLabel = () => {
    if (visibleCombo >= 5) return t('combo.magic') || '¡MÁGICO!';
    if (visibleCombo >= 4) return t('combo.spectacular') || '¡ESPECTACULAR!';
    if (visibleCombo >= 3) return t('combo.incredible') || '¡INCREÍBLE!';
    return t('combo.genial') || '¡GENIAL!';
  };

  const anim = phase === 'in' ? 'animate-combo-stamp-in' : 'animate-combo-stamp-out';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
      aria-hidden="true"
    >
      <div
        key={visibleCombo}
        className={anim}
        style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.55))' }}
      >
        <p
          className="text-5xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text uppercase"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #FFF3B0 0%, #FFD24C 45%, #E0A020 100%)',
            WebkitTextStroke: '1.5px rgba(60,30,0,0.65)',
            textShadow: '0 2px 4px rgba(0,0,0,0.55)',
          }}
        >
          {getLabel()}
        </p>
      </div>
    </div>
  );
};
