/**
 * CAMBIO 9 — Detectar si el jugador ya jugó este nivel en la sesión actual.
 * Usado para saltar animaciones de intro en reintentos sucesivos.
 */
const KEY = 'last_entered_level_session_v1';

export const markLevelEntered = (lvl: number) => {
  try { sessionStorage.setItem(KEY, String(lvl)); } catch {}
};

export const isRetryOfLevel = (lvl: number): boolean => {
  try { return sessionStorage.getItem(KEY) === String(lvl); } catch { return false; }
};
