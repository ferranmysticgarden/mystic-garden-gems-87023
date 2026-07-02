/**
 * powerupTutorial.ts
 *
 * Flags locales para la UX educativa de los 3 power-ups.
 * NO altera la lógica de coste ni el tracking (GameScreen mantiene
 * `trackEvent('powerup_used')` y consumo de gemas/stock intactos).
 *
 * - `intro_shown`: primera vez que el user pulsa el power-up → modal
 *   explicativo (qué hace + coste). Se marca al confirmar Y al cancelar,
 *   para no repetirlo si el user solo miró y cerró.
 * - `confirm_count`: 3 primeras veces que va a GASTAR gemas → modal
 *   de confirmación. A partir de 3 usos con gemas → uso directo.
 *   Los usos con stock (gratis) no cuentan.
 */

export type PowerupType = 'hammer' | 'shuffle' | 'undo';

const INTRO_KEY = (t: PowerupType) => `pu_intro_shown_v1_${t}`;
const CONFIRM_KEY = (t: PowerupType) => `pu_confirm_count_v1_${t}`;
const CONFIRM_THRESHOLD = 3;

const safeGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const safeSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* best effort */ }
};

export const shouldShowIntro = (type: PowerupType): boolean =>
  safeGet(INTRO_KEY(type)) !== '1';

export const markIntroShown = (type: PowerupType): void => {
  safeSet(INTRO_KEY(type), '1');
};

export const shouldConfirmSpend = (type: PowerupType): boolean => {
  const raw = safeGet(CONFIRM_KEY(type));
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n < CONFIRM_THRESHOLD : true;
};

export const incrementConfirmCount = (type: PowerupType): void => {
  const raw = safeGet(CONFIRM_KEY(type));
  const n = raw ? parseInt(raw, 10) : 0;
  const next = (Number.isFinite(n) ? n : 0) + 1;
  safeSet(CONFIRM_KEY(type), String(next));
};

export const POWERUP_COST: Record<PowerupType, number> = {
  hammer: 40,
  shuffle: 60,
  undo: 25,
};

export const POWERUP_EMOJI: Record<PowerupType, string> = {
  hammer: '🔨',
  shuffle: '🔀',
  undo: '↩️',
};
