import { getOfferAnchor } from '@/data/offerAnchors';

interface DiscountPriceProps {
  productId: string;
  /** Real checkout price (already locale-formatted, e.g. "€1,99"). */
  currentPrice: string;
  /** Optional override for the strikethrough price. */
  originalPrice?: string;
  /** Optional override for the discount badge. */
  discountLabel?: string;
  className?: string;
}

/**
 * Discount-framing price block used in every offer modal.
 *
 * Renders:  ~~original~~   CURRENT   [-80% DTO]
 *
 * If no anchor is configured for the given productId AND no override is
 * passed, falls back to showing only the current price (no fake markdown).
 */
export const DiscountPrice = ({
  productId,
  currentPrice,
  originalPrice,
  discountLabel,
  className = '',
}: DiscountPriceProps) => {
  const anchor = getOfferAnchor(productId);
  const original = originalPrice ?? anchor?.originalPrice ?? null;
  const badge = discountLabel ?? anchor?.discountLabel ?? null;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="flex items-baseline justify-center gap-3">
        {original && (
          <span className="text-gray-300 line-through text-xl font-semibold decoration-red-500 decoration-2">
            {original}
          </span>
        )}
        <span className="text-4xl font-extrabold text-green-400 drop-shadow-lg animate-pulse">
          {currentPrice}
        </span>
      </div>
      {badge && (
        <span className="inline-block bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          ¡{badge}!
        </span>
      )}
    </div>
  );
};
