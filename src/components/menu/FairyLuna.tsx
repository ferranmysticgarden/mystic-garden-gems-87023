import { FEATURE_FLAGS } from '@/config/featureFlags';

interface Props {
  variant?: 'hero' | 'greeting' | 'sad' | 'pointing' | 'flying';
  size?: number;
  className?: string;
  alt?: string;
}

const SRC: Record<NonNullable<Props['variant']>, string> = {
  hero: '/luna/fairy_luna_hero.png',
  greeting: '/luna/fairy_luna_greeting.png',
  sad: '/luna/fairy_luna_sad.png',
  pointing: '/luna/fairy_luna_pointing.png',
  flying: '/luna/fairy_luna_flying.png',
};

export const FairyLuna = ({ variant = 'flying', size = 80, className = '', alt = 'Luna' }: Props) => {
  if (!FEATURE_FLAGS.fairyLuna) return null;
  return (
    <img
      src={SRC[variant]}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={`pointer-events-none select-none drop-shadow-lg ${className}`}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
};
