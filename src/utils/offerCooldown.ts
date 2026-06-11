/**
 * Generic per-offer cooldown helper backed by localStorage.
 *
 * Used by all monetization modals to avoid re-showing the SAME offer
 * to the SAME user within a window (default 24h) after they dismiss it.
 *
 * Defensive: every operation swallows errors (private mode, SSR, etc.)
 * and returns the safest fallback so it can never block UI flow.
 */

const PREFIX = 'offer_cooldown_v1::';
const DEFAULT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h

const key = (offerId: string) => `${PREFIX}${offerId}`;

export const markOfferDismissed = (offerId: string): void => {
  try {
    localStorage.setItem(key(offerId), String(Date.now()));
  } catch {
    /* best effort */
  }
};

export const isOfferOnCooldown = (
  offerId: string,
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): boolean => {
  try {
    const raw = localStorage.getItem(key(offerId));
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < cooldownMs;
  } catch {
    return false;
  }
};

export const clearOfferCooldown = (offerId: string): void => {
  try {
    localStorage.removeItem(key(offerId));
  } catch {
    /* best effort */
  }
};
