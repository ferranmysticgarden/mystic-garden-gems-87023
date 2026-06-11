// T8 — Limited units mechanic for the Starter Pack.
// Starts with 10 "units available" per device. Decrements by 1 every 6h
// (simulated scarcity). Floor at 1 — never reaches 0 so the offer stays buyable.

import { LS_KEYS } from "@/constants/localStorageKeys";

const INITIAL_UNITS = 10;
const DECREMENT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MIN_UNITS = 1;

const readNum = (key: string, fallback: number): number => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

/**
 * Returns the current "units remaining" badge value.
 * Side-effect: rolls forward the counter based on elapsed time.
 */
export const getStarterPackUnitsRemaining = (): number => {
  const now = Date.now();
  let remaining = readNum(LS_KEYS.STARTER_PACK_UNITS_REMAINING, INITIAL_UNITS);
  const lastTick = readNum(LS_KEYS.STARTER_PACK_UNITS_LAST_TICK, now);

  const elapsed = now - lastTick;
  if (elapsed >= DECREMENT_INTERVAL_MS) {
    const ticks = Math.floor(elapsed / DECREMENT_INTERVAL_MS);
    remaining = Math.max(MIN_UNITS, remaining - ticks);
    write(LS_KEYS.STARTER_PACK_UNITS_REMAINING, String(remaining));
    write(
      LS_KEYS.STARTER_PACK_UNITS_LAST_TICK,
      String(lastTick + ticks * DECREMENT_INTERVAL_MS),
    );
  } else if (!localStorage.getItem(LS_KEYS.STARTER_PACK_UNITS_LAST_TICK)) {
    write(LS_KEYS.STARTER_PACK_UNITS_REMAINING, String(remaining));
    write(LS_KEYS.STARTER_PACK_UNITS_LAST_TICK, String(now));
  }

  return remaining;
};
