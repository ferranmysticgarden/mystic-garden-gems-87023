import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LS_KEYS } from "@/constants/localStorageKeys";

const PIGGY_CAP = 300;
const DEPOSIT_PER_WIN = 5;

interface PiggyState {
  amount: number;
  isUnlocked: boolean;
  loading: boolean;
}

const readGuestState = (): { amount: number; isUnlocked: boolean } => {
  try {
    const raw = localStorage.getItem(LS_KEYS.PIGGY_BANK_GUEST_STATE);
    if (!raw) return { amount: 0, isUnlocked: false };
    return JSON.parse(raw);
  } catch {
    return { amount: 0, isUnlocked: false };
  }
};

const writeGuestState = (s: { amount: number; isUnlocked: boolean }) => {
  try {
    localStorage.setItem(LS_KEYS.PIGGY_BANK_GUEST_STATE, JSON.stringify(s));
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

export const usePiggyBank = (userId: string | null) => {
  const [state, setState] = useState<PiggyState>({
    amount: 0,
    isUnlocked: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      const g = readGuestState();
      setState({ amount: g.amount, isUnlocked: g.isUnlocked, loading: false });
      return;
    }

    const { data } = await supabase
      .from("piggy_bank")
      .select("current_amount, is_unlocked")
      .eq("user_id", userId)
      .maybeSingle();

    setState({
      amount: data?.current_amount ?? 0,
      isUnlocked: !!data?.is_unlocked,
      loading: false,
    });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deposit = useCallback(
    async (gems = DEPOSIT_PER_WIN) => {
      const newAmount = Math.min(PIGGY_CAP, state.amount + gems);
      if (newAmount === state.amount) return;

      setState((s) => ({ ...s, amount: newAmount }));

      if (!userId) {
        writeGuestState({ amount: newAmount, isUnlocked: false });
        return;
      }

      // Upsert row if missing
      const { data: existing } = await supabase
        .from("piggy_bank")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("piggy_bank")
          .update({
            current_amount: newAmount,
            last_deposit_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("piggy_bank").insert({
          user_id: userId,
          current_amount: newAmount,
          last_deposit_at: new Date().toISOString(),
        });
      }
    },
    [state.amount, userId],
  );

  const unlock = useCallback(
    async (purchaseRef?: string) => {
      const guestSessionId = !userId ? getGuestId() ?? undefined : undefined;
      const { data, error } = await supabase.functions.invoke("unlock-piggy-bank", {
        body: { purchaseRef, guestSessionId },
      });
      if (error) throw error;

      // Reset client state
      if (!userId) {
        writeGuestState({ amount: 0, isUnlocked: true });
      }
      setState({ amount: 0, isUnlocked: true, loading: false });
      return data as { success: boolean; gemsGranted: number };
    },
    [userId],
  );

  return {
    amount: state.amount,
    cap: PIGGY_CAP,
    isUnlocked: state.isUnlocked,
    loading: state.loading,
    progress: state.amount / PIGGY_CAP,
    isFull: state.amount >= PIGGY_CAP,
    deposit,
    unlock,
    refresh,
  };
};
