import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface SuperComboBannerProps {
  /** Multiplicador máximo alcanzado en la cadena (>=3 dispara el banner) */
  maxMultiplier: number;
  onDone?: () => void;
}

/**
 * CAMBIO SCORING — banner "¡INCREÍBLE!" / "¡SUPER COMBO!" tras cadenas x3+.
 */
export const SuperComboBanner = ({ maxMultiplier, onDone }: SuperComboBannerProps) => {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (maxMultiplier >= 3) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onDone?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [maxMultiplier, onDone]);

  if (!show || maxMultiplier < 3) return null;

  const text =
    maxMultiplier >= 5
      ? t('combo.unbelievable') || '¡INCREÍBLE!'
      : maxMultiplier >= 4
      ? t('combo.super') || '¡SUPER COMBO!'
      : t('combo.amazing') || '¡INCREÍBLE!';

  return (
    <div className="fixed top-32 right-3 pointer-events-none z-[41] animate-fade-in">
      <div
        className="px-2.5 py-1 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.95) 0%, rgba(255,107,0,0.95) 100%)',
          boxShadow: '0 2px 12px rgba(255, 165, 0, 0.5)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
      >
        <p
          className="text-xs font-black text-white tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        >
          {text}
        </p>
      </div>
    </div>
  );
};
