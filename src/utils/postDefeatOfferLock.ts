/**
 * Post-defeat offer mutual exclusion lock.
 *
 * Rule: only ONE monetisation offer per defeat moment.
 * If a "small" offer (FlashOffer, LifesaverPack, ContinueGameOffer,
 * StreakProtectionOffer) is shown after a level loss, suppress the
 * "big" follow-up modals (StarterPack / NoLivesModal) until the user
 * starts a new level.
 *
 * Session-scoped (sessionStorage), cleared on level start.
 */

const KEY = "post_defeat_offer_lock_v1";

const safeGet = (): string | null => {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
};
const safeSet = (v: string): void => {
  try { sessionStorage.setItem(KEY, v); } catch { /* ignore */ }
};
const safeRemove = (): void => {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
};

export const lockPostDefeatOffers = (source: string): void => {
  safeSet(`${source}:${Date.now()}`);
};

export const isPostDefeatOfferLocked = (): boolean => {
  return safeGet() !== null;
};

export const clearPostDefeatOfferLock = (): void => {
  safeRemove();
};
