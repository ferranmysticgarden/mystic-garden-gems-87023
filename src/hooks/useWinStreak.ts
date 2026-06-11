// T9 — Track consecutive wins. Resets after a loss or after 24h of inactivity.

import { useCallback, useEffect, useState } from "react";
import { LS_KEYS } from "@/constants/localStorageKeys";

const STREAK_TIMEOUT_MS = 24 * 60 * 60 * 1000;

const readState = (): { count: number; lastWinAt: number } => {
  try {
    const count = parseInt(localStorage.getItem(LS_KEYS.WIN_STREAK_COUNT) ?? "0", 10);
    const lastWinAt = parseInt(
      localStorage.getItem(LS_KEYS.WIN_STREAK_LAST_WIN_AT) ?? "0",
      10,
    );
    return {
      count: Number.isFinite(count) ? count : 0,
      lastWinAt: Number.isFinite(lastWinAt) ? lastWinAt : 0,
    };
  } catch {
    return { count: 0, lastWinAt: 0 };
  }
};

const write = (count: number, lastWinAt: number) => {
  try {
    localStorage.setItem(LS_KEYS.WIN_STREAK_COUNT, String(count));
    localStorage.setItem(LS_KEYS.WIN_STREAK_LAST_WIN_AT, String(lastWinAt));
  } catch {
    /* ignore */
  }
};

export const useWinStreak = () => {
  const [count, setCount] = useState(() => {
    const s = readState();
    if (s.lastWinAt && Date.now() - s.lastWinAt > STREAK_TIMEOUT_MS) {
      write(0, 0);
      return 0;
    }
    return s.count;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const s = readState();
      if (s.count > 0 && s.lastWinAt && Date.now() - s.lastWinAt > STREAK_TIMEOUT_MS) {
        write(0, 0);
        setCount(0);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const registerWin = useCallback(() => {
    const next = readState().count + 1;
    write(next, Date.now());
    setCount(next);
    return next;
  }, []);

  const registerLoss = useCallback(() => {
    write(0, 0);
    setCount(0);
  }, []);

  return { count, registerWin, registerLoss };
};
