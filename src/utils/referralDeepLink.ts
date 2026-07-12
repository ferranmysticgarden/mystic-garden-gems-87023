// Parse and persist a pending referral code from the URL (?ref=CODE)
// so it can be redeemed once the user signs in.

const PENDING_KEY = "mg_pending_referral_code";
const REDEEMED_KEY = "mg_referral_redeemed";

export const capturePendingReferralFromUrl = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("ref");
    if (!raw) return null;
    const code = raw.trim().toUpperCase();
    if (!/^MG-[A-Z0-9]{4,10}$/.test(code)) return null;
    // Only store if not already redeemed
    if (localStorage.getItem(REDEEMED_KEY) === "true") return null;
    if (!localStorage.getItem(PENDING_KEY)) {
      localStorage.setItem(PENDING_KEY, code);
    }
    // Clean URL so it's not re-processed
    try {
      params.delete("ref");
      const q = params.toString();
      const clean = window.location.pathname + (q ? `?${q}` : "");
      window.history.replaceState({}, "", clean);
    } catch { /* ignore */ }
    return code;
  } catch {
    return null;
  }
};

export const getPendingReferralCode = (): string | null => {
  try { return localStorage.getItem(PENDING_KEY); } catch { return null; }
};

export const clearPendingReferralCode = () => {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
};

export const markReferralRedeemed = () => {
  try {
    localStorage.setItem(REDEEMED_KEY, "true");
    localStorage.removeItem(PENDING_KEY);
  } catch { /* ignore */ }
};

export const wasReferralRedeemed = (): boolean => {
  try { return localStorage.getItem(REDEEMED_KEY) === "true"; } catch { return false; }
};
