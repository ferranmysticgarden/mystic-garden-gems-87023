import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface SuperComboBannerProps {
  /** Multiplicador máximo alcanzado en la cadena (>=3 dispara el banner) */
  maxMultiplier: number;
  onDone?: () => void;
}

/**
 * CAMBIO SCORING — banner "¡INCREÍBLE!" / "¡SUPER COMBO!" tras cadenas x3+.
 * Banner pequeño, lateral y sin bloquear. Cada super-combo vive su propio
 * ciclo de ~900 ms; no depende de que la cascada continúe.
 */
export const SuperComboBanner = ({ maxMultiplier, onDone }: SuperComboBannerProps) => {
  const { t } = useLanguage();
  const [visibleMult, setVisibleMult] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(onDone);

  // Mantener la callback actual sin reiniciar el timer en cada render.
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  // Cada vez que el multiplicador máximo sube a >=3, mostramos el banner y
  // forzamos su cierre tras 900 ms, independientemente de los matches posteriores.
  useEffect(() => {
    if (maxMultiplier >= 3) {
      setVisibleMult(maxMultiplier);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisibleMult(null);
        doneRef.current?.();
      }, 900);
    }
  }, [maxMultiplier]);

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visibleMult || visibleMult < 3) return null;

  const text =
    visibleMult >= 5
      ? t('combo.unbelievable') || '¡INCREÍBLE!'
      : visibleMult >= 4
      ? t('combo.super') || '¡SUPER COMBO!'
      : t('combo.amazing') || '¡INCREÍBLE!';

  return (
    <div key={visibleMult} className="fixed top-20 right-2 pointer-events-none z-40 animate-fade-in">
      <div
        className="px-1 py-0.5 rounded-lg border border-white/50"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.95) 0%, rgba(255,107,0,0.95) 100%)',
        }}
      >
        <p
          className="text-[10px] font-bold text-white tracking-wide"
          style={{ textShadow: '0 1px 1px rgba(0,0,0,0.6)' }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};
