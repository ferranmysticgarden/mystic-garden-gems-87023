import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";
import {
  getPendingReferralCode,
  markReferralRedeemed,
  wasReferralRedeemed,
} from "@/utils/referralDeepLink";

interface ReferralStats {
  code: string | null;
  invitedCount: number;
  qualifiedCount: number;
  totalGemsEarned: number;
  loading: boolean;
}

const QUALIFICATION_CHECK_KEY = "mg_referral_last_qual_check_lvl";

export const useReferral = (userId: string | null) => {
  const [stats, setStats] = useState<ReferralStats>({
    code: null,
    invitedCount: 0,
    qualifiedCount: 0,
    totalGemsEarned: 0,
    loading: false,
  });

  const loadOrCreateCode = useCallback(async () => {
    if (!userId) return null;
    setStats((s) => ({ ...s, loading: true }));
    try {
      const { data, error } = await supabase.functions.invoke("create-referral-code");
      if (error) throw error;
      if (data?.success && data.code) {
        // Also load stats
        const { data: rows } = await supabase
          .from("referrals")
          .select("status, referrer_gems_granted")
          .eq("referrer_user_id", userId);
        const list = rows || [];
        const qualified = list.filter((r: any) => r.status === "rewarded").length;
        const total = list.reduce((acc: number, r: any) => acc + (r.referrer_gems_granted || 0), 0);
        setStats({
          code: data.code,
          invitedCount: list.length,
          qualifiedCount: qualified,
          totalGemsEarned: total,
          loading: false,
        });
        return data.code as string;
      }
      setStats((s) => ({ ...s, loading: false }));
      return null;
    } catch (e) {
      console.error("[useReferral] loadOrCreateCode", e);
      setStats((s) => ({ ...s, loading: false }));
      return null;
    }
  }, [userId]);

  const redeemCode = useCallback(
    async (code: string): Promise<{ ok: boolean; gems?: number; error?: string }> => {
      if (!userId) return { ok: false, error: "not_authenticated" };
      const clean = code.trim().toUpperCase();
      trackEvent("referral_code_redeemed_attempt", { code: clean });
      try {
        const { data, error } = await supabase.functions.invoke("redeem-referral-code", {
          body: { action: "redeem", code: clean },
        });
        if (error) throw error;
        if (data?.success) {
          markReferralRedeemed();
          trackEvent("referral_code_redeemed", { code: clean, gems: data.gems_granted });
          return { ok: true, gems: data.gems_granted };
        }
        trackEvent("referral_code_redeemed_fail", { code: clean, reason: data?.error });
        return { ok: false, error: data?.error || "unknown" };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        trackEvent("referral_code_redeemed_fail", { code: clean, reason: msg });
        return { ok: false, error: msg };
      }
    },
    [userId],
  );

  // Auto-redeem pending code once user is authenticated
  useEffect(() => {
    if (!userId) return;
    if (wasReferralRedeemed()) return;
    const pending = getPendingReferralCode();
    if (!pending) return;
    redeemCode(pending);
  }, [userId, redeemCode]);

  const checkQualification = useCallback(
    async (currentLevel: number) => {
      if (!userId) return;
      if (currentLevel < 5) return;
      // avoid spamming — only once per level increment
      try {
        const last = Number(localStorage.getItem(QUALIFICATION_CHECK_KEY) || "0");
        if (last >= currentLevel) return;
        localStorage.setItem(QUALIFICATION_CHECK_KEY, String(currentLevel));
      } catch { /* ignore */ }
      try {
        const { data } = await supabase.functions.invoke("redeem-referral-code", {
          body: { action: "check_qualification" },
        });
        if (data?.granted) {
          trackEvent("referral_qualified", { gems_to_referrer: data.gems_to_referrer });
        }
      } catch (e) {
        console.warn("[useReferral] checkQualification", e);
      }
    },
    [userId],
  );

  return { stats, loadOrCreateCode, redeemCode, checkQualification };
};
