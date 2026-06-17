/**
 * CAMBIO 6 — Precio creciente para +5 movimientos dentro del mismo nivel.
 * Base 150 gemas → 1x, 1.5x, 2x, 2.5x...
 * Reset al ganar o cambiar de nivel.
 */
const KEY = (lvl: number) => `rescue_count_l${lvl}_v1`;

export const getRescueCount = (lvl: number): number => {
  try { return parseInt(localStorage.getItem(KEY(lvl)) ?? '0', 10) || 0; } catch { return 0; }
};

export const incrementRescueCount = (lvl: number): number => {
  const next = getRescueCount(lvl) + 1;
  try { localStorage.setItem(KEY(lvl), String(next)); } catch {}
  return next;
};

export const resetRescueCount = (lvl: number) => {
  try { localStorage.removeItem(KEY(lvl)); } catch {}
};

export const gemPriceForRescue = (lvl: number): number => {
  const c = getRescueCount(lvl);
  const mult = [1, 1.5, 2, 2.5][Math.min(c, 3)];
  return Math.round(150 * mult);
};
