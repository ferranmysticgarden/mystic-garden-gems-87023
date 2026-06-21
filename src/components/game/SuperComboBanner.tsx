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
    <div className="fixed inset-0 pointer-events-none z-[58] flex items-center justify-center">
      <div className="animate-scale-in">
        <h1
          className="text-7xl md:text-8xl font-black tracking-wider text-center"
          style={{
            background:
              'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter:
              'drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 60px rgba(255, 165, 0, 0.5))',
            textShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {text}
        </h1>
      </div>
    </div>
  );
};
