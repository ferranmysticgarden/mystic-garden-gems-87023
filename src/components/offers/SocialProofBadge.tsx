import { Flame } from 'lucide-react';

interface SocialProofBadgeProps {
  /** Credible weekly buyers count. Keep it modest (10-60). */
  count?: number;
  /** Optional label override, e.g. "Oferta más popular". */
  label?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Small trust chip shown on high-intent offers.
 * Numbers are intentionally modest and stable per device/day
 * so users don't see them jumping around.
 */
export const SocialProofBadge = ({
  count,
  label,
  variant = 'default',
  className = '',
}: SocialProofBadgeProps) => {
  const text = label
    ? label
    : count != null
      ? `🔥 ${count} jugadores lo compraron esta semana`
      : '⭐ Oferta más popular';

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-semibold text-orange-100 bg-orange-500/30 border border-orange-300/40 rounded-full px-2 py-0.5 ${className}`}
      >
        <Flame className="w-3 h-3" />
        {text}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-orange-100 bg-orange-500/20 border border-orange-300/40 rounded-full px-3 py-1 ${className}`}
    >
      <Flame className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  );
};

/**
 * Deterministic modest "buyers this week" number per offer id.
 * Same offer id → same number for ~24h on the same device,
 * so users don't see it flicker. Range: 12-47.
 */
export const getStableBuyersCount = (offerId: string): number => {
  const dayBucket = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  let hash = 0;
  const seed = `${offerId}:${dayBucket}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return 12 + (Math.abs(hash) % 36); // 12..47
};
