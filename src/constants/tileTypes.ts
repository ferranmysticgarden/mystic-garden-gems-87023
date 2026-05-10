/**
 * IDs canónicos de los 6 tipos de fichas del match-3.
 * Se usan como CLAVE de comparación en findMatches/swap, y como
 * clave en el store de skins (foto del usuario por tipo).
 *
 * NUNCA renombrar: cualquier ID guardado en levels.ts y persistencia
 * (FASE E) depende de estos strings exactos.
 */
export const TILE_TYPES = ["t1", "t2", "t3", "t4", "t5", "t6"] as const;
export type TileType = (typeof TILE_TYPES)[number];

/** Mapping default emoji por tipo (fallback cuando el slot no tiene foto). */
export const TILE_DEFAULT_EMOJIS: Record<TileType, string> = {
  t1: "🌸",
  t2: "🌺",
  t3: "🌼",
  t4: "🍃",
  t5: "🌻",
  t6: "🌷",
};

/** Borde de color por tipo (mismo orden que TILE_TYPES y SLOT_BORDERS). */
export const TILE_RING_COLORS: Record<TileType, string> = {
  t1: "ring-rose-500",
  t2: "ring-sky-500",
  t3: "ring-emerald-500",
  t4: "ring-amber-400",
  t5: "ring-violet-500",
  t6: "ring-orange-500",
};
