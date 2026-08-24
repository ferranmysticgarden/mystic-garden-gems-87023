/**
 * Anchoring / "before-price" map used by the DiscountPrice component.
 *
 * These prices are the perceived "regular" price shown crossed-out to create
 * a reference anchor next to the actual checkout price. They MUST be coherent
 * with the bundle the user is actually receiving (gems / lives / boosters)
 * — not arbitrary inflation. Treat this as marketing copy for first-time
 * offers (psychological anchoring), reviewable by the product owner.
 */

export interface OfferAnchor {
  /** "Original" reference price shown crossed-out (locale-formatted string). */
  originalPrice: string;
  /** Discount badge text (e.g. "-80%"). */
  discountLabel: string;
}

export const OFFER_ANCHORS: Record<string, OfferAnchor> = {
  starter_gems: { originalPrice: '€9,99', discountLabel: '-75% DTO' },
  gems_100: { originalPrice: '€12,99', discountLabel: '-77% DTO' },
  gems_300: { originalPrice: '€19,99', discountLabel: '-75% DTO' },
  flash_offer: { originalPrice: '€4,99', discountLabel: '-80% DTO' },
  continue_game: { originalPrice: '€2,99', discountLabel: '-83% DTO' },
  pack_victoria_segura: { originalPrice: '€7,99', discountLabel: '-60% DTO' },
  pack_impulso: { originalPrice: '€4,99', discountLabel: '-60% DTO' },
  pack_experiencia: { originalPrice: '€14,99', discountLabel: '-66% DTO' },
};

export const getOfferAnchor = (productId: string): OfferAnchor | null =>
  OFFER_ANCHORS[productId] ?? null;
