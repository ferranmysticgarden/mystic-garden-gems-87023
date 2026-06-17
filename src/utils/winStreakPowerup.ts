/**
 * CAMBIO 7 — Win-streak power-up grant.
 * Tras 3 victorias seguidas (sin derrotas), se concede 1 power-up gratis
 * en el siguiente nivel. Persistencia simple via localStorage.
 */
const FLAG = 'win_streak_powerup_pending_v1';
const COUNT = 'win_streak_powerup_count_v1';

export const markWinStreakPowerupPending = () => {
  try {
    localStorage.setItem(FLAG, 'true');
    const c = parseInt(localStorage.getItem(COUNT) ?? '0', 10) + 1;
    localStorage.setItem(COUNT, String(c));
  } catch {}
};

export const consumeWinStreakPowerup = (): boolean => {
  try {
    if (localStorage.getItem(FLAG) === 'true') {
      localStorage.removeItem(FLAG);
      return true;
    }
  } catch {}
  return false;
};

export const hasPendingWinStreakPowerup = (): boolean => {
  try { return localStorage.getItem(FLAG) === 'true'; } catch { return false; }
};
