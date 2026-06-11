import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LS_KEYS } from "@/constants/localStorageKeys";
import { CURRENT_SEASON_ID, SEASON_TIERS, type TierReward } from "@/data/seasonPassTiers";

interface SeasonState {
  progressPoints: number;
  isPremium: boolean;
  claimedTiers: number[];
  loading: boolean;
}

const readGuest = (): Omit<SeasonState, "loading"> => {
  try {
    const raw = localStorage.getItem(LS_KEYS.SEASON_PASS_GUEST_STATE);
    if (!raw) return { progressPoints: 0, isPremium: false, claimedTiers: [] };
    return JSON.parse(raw);
  } catch {
    return { progressPoints: 0, isPremium: false, claimedTiers: [] };
  }
};

const writeGuest = (s: Omit<SeasonState, "loading">) => {
  try {
    localStorage.setItem(LS_KEYS.SEASON_PASS_GUEST_STATE, JSON.stringify(s));
  } catch {
    /* ignore */
  }
};

const getGuestId = (): string | null => {
  try {
    return localStorage.getItem(LS_KEYS.GUEST_SESSION_ID);
  } catch {
    return null;
  }
};

export const useSeasonPass = (userId: string | null) => {
  const [state, setState] = useState<SeasonState>({
    progressPoints: 0,
    isPremium: false,
    claimedTiers: [],
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      const g = readGuest();
      setState({ ...g, loading: false });
      return;
    }

    const { data } = await supabase
      .from("season_passes")
      .select("progress_points, is_premium, claimed_tiers")
      .eq("user_id", userId)
      .eq("season_id", CURRENT_SEASON_ID)
      .maybeSingle();

    setState({
      progressPoints: data?.progress_points ?? 0,
      isPremium: !!data?.is_premium,
      claimedTiers: Array.isArray(data?.claimed_tiers) ? (data!.claimed_tiers as number[]) : [],
      loading: false,
    });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Add progress points (e.g. after a level win). Auth users go to DB; guests to localStorage. */
  const addProgress = useCallback(
    async (points: number) => {
      if (points <= 0) return;
      const newPoints = state.progressPoints + points;
      setState((s) => ({ ...s, progressPoints: newPoints }));

      if (!userId) {
        const g = readGuest();
        writeGuest({ ...g, progressPoints: newPoints });
        return;
      }

      const { data: existing } = await supabase
        .from("season_passes")
        .select("id, progress_points")
        .eq("user_id", userId)
        .eq("season_id", CURRENT_SEASON_ID)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("season_passes")
          .update({ progress_points: (existing.progress_points ?? 0) + points })
          .eq("id", existing.id);
      } else {
        await supabase.from("season_passes").insert({
          user_id: userId,
          season_id: CURRENT_SEASON_ID,
          progress_points: points,
          claimed_tiers: [],
        });
      }
    },
    [state.progressPoints, userId],
  );

  const claimTier = useCallback(
    async (tierId: number): Promise<{ success: boolean; reward?: TierReward; error?: string }> => {
      const guestSessionId = !userId ? getGuestId() ?? undefined : undefined;
      const { data, error } = await supabase.functions.invoke("claim-season-tier", {
        body: { seasonId: CURRENT_SEASON_ID, tierId, guestSessionId },
      });
      if (error) return { success: false, error: error.message };
      const result = data as { success: boolean; reward?: TierReward; error?: string };
      if (result.success) {
        setState((s) => ({ ...s, claimedTiers: [...s.claimedTiers, tierId] }));
        if (!userId) {
          const g = readGuest();
          writeGuest({ ...g, claimedTiers: [...g.claimedTiers, tierId] });
        }
      }
      return result;
    },
    [userId],
  );

  const unlockPremium = useCallback(
    async (purchaseRef?: string) => {
      const guestSessionId = !userId ? getGuestId() ?? undefined : undefined;
      const { data, error } = await supabase.functions.invoke("unlock-season-pass", {
        body: { seasonId: CURRENT_SEASON_ID, guestSessionId, purchaseRef },
      });
      if (error) throw error;
      setState((s) => ({ ...s, isPremium: true }));
      if (!userId) {
        const g = readGuest();
        writeGuest({ ...g, isPremium: true });
      }
      return data;
    },
    [userId],
  );

  return {
    progressPoints: state.progressPoints,
    isPremium: state.isPremium,
    claimedTiers: state.claimedTiers,
    loading: state.loading,
    tiers: SEASON_TIERS,
    currentSeasonId: CURRENT_SEASON_ID,
    addProgress,
    claimTier,
    unlockPremium,
    refresh,
  };
};
