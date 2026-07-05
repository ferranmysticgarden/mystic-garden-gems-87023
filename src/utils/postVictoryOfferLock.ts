/**
 * Post-victory offer mutual exclusion lock.
 *
 * Same pattern as postDefeatOfferLock. Rule: only ONE monetisation
 * offer per victory moment. If a "first-time" offer (FirstDayOffer,
 * StarterPack-first) is shown after a win, suppress recurring offers
 * (WinStreakOffer, PostVictoryOffer, StreakBonusOffer) until the user
 * starts the next level.
 *
 * Session-scoped (sessionStorage), cleared on level start.
 */

const KEY = "post_victory_offer_lock_v1";

const safeGet = (): string | null => {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
};
const safeSet = (v: string): void => {
  try { sessionStorage.setItem(KEY, v); } catch { /* ignore */ }
};
const safeRemove = (): void => {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
};

export const lockPostVictoryOffers = (source: string): void => {
  safeSet(`${source}:${Date.now()}`);
};

export const isPostVictoryOfferLocked = (): boolean => {
  return safeGet() !== null;
};

export const getPostVictoryOfferLockSource = (): string | null => {
  const raw = safeGet();
  if (!raw) return null;
  const idx = raw.indexOf(":");
  return idx > 0 ? raw.slice(0, idx) : raw;
};

export const clearPostVictoryOfferLock = (): void => {
  safeRemove();
};
