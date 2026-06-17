/**
 * Gate for the `starter_gems` (StarterPack) auto-popup.
 *
 * Rule (set after analytics: 88 attempts / 0 sales in 14 days):
 *  - At most 2 total shows per user (lifetime, in this device).
 *  - 48h cooldown after the user dismisses without buying.
 *
 * Everything is best-effort localStorage; never blocks UI on errors.
 * Once the user actually purchases starter_gems, the "first_purchase_completed"
 * flag and server sync already prevent it from re-appearing, so we only need
 * to handle the dismissal path here.
 */

const COUNT_KEY = "starter_gems_show_count_v1";
const LAST_DISMISS_KEY = "starter_gems_last_dismiss_v1";
const MAX_SHOWS = 2;
const COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48h

const safeGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string): void => {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
};

export const getStarterGemsShowCount = (): number => {
  const raw = safeGet(COUNT_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
};

export const canShowStarterGems = (): boolean => {
  // Already purchased? Other code paths gate on this, but double-check.
  if (safeGet("first_purchase_completed") === "true") return false;

  if (getStarterGemsShowCount() >= MAX_SHOWS) return false;

  const lastDismiss = safeGet(LAST_DISMISS_KEY);
  if (lastDismiss) {
    const ts = parseInt(lastDismiss, 10);
    if (Number.isFinite(ts) && Date.now() - ts < COOLDOWN_MS) return false;
  }
  return true;
};

export const markStarterGemsShown = (): void => {
  safeSet(COUNT_KEY, String(getStarterGemsShowCount() + 1));
};

export const markStarterGemsDismissed = (): void => {
  safeSet(LAST_DISMISS_KEY, String(Date.now()));
};
