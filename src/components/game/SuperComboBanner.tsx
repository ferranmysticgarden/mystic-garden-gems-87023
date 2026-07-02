import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface SuperComboBannerProps {
  /** Multiplicador máximo alcanzado en la cadena (>=3 dispara el banner) */
  maxMultiplier: number;
  onDone?: () => void;
}

/**
 * CAMBIO SCORING — banner "¡INCREÍBLE!" / "¡SUPER COMBO!" tras cadenas x3+.
 * Banner lateral pequeño pero legible. Ciclo por evento:
 *   250ms pop-in → 900ms visible → 250ms fade-out. Total ≈ 1400ms.
 */
export const SuperComboBanner = ({ maxMultiplier, onDone }: SuperComboBannerProps) => {
  const { t } = useLanguage();
  const [visibleMult, setVisibleMult] = useState<number | null>(null);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (maxMultiplier >= 3) {
      setVisibleMult(maxMultiplier);
      setPhase('in');
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      hideTimer.current = setTimeout(() => setPhase('out'), 1150);
      clearTimer.current = setTimeout(() => {
        setVisibleMult(null);
        doneRef.current?.();
      }, 1400);
    }
  }, [maxMultiplier]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  if (!visibleMult || visibleMult < 3) return null;

  const text =
    visibleMult >= 5
      ? t('combo.unbelievable') || '¡INCREÍBLE!'
      : visibleMult >= 4
      ? t('combo.super') || '¡SUPER COMBO!'
      : t('combo.amazing') || '¡INCREÍBLE!';

  const anim = phase === 'in' ? 'animate-combo-pop' : 'animate-fade-out';

  return (
    <div
      key={visibleMult}
      className={`fixed top-36 right-3 pointer-events-none z-40 ${anim}`}
    >
      <div
        className="px-3 py-1.5 rounded-xl border border-white/70"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.97) 0%, rgba(255,107,0,0.97) 100%)',
          boxShadow: '0 0 14px rgba(255,165,0,0.6)',
        }}
      >
        <p
          className="text-base font-black text-white tracking-wide leading-none"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};
