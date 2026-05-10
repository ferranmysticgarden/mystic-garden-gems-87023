/**
 * tileSkinStore.ts
 *
 * Store global mínimo (sin dependencias) para mantener el mapping
 * { tileId -> dataUrl | null } de fotos personalizadas del usuario.
 *
 * - Listeners pattern compatible con React.useSyncExternalStore.
 * - Persistencia REAL llegará en FASE E. Por ahora sólo memoria.
 * - El snapshot devuelto es referencialmente estable hasta que cambie
 *   algún slot, evitando re-renders innecesarios en cada Tile.
 */

import { TILE_TYPES, type TileType } from "@/constants/tileTypes";

export type TileSkinMap = Record<TileType, string | null>;

const createEmpty = (): TileSkinMap =>
  TILE_TYPES.reduce((acc, id) => {
    acc[id] = null;
    return acc;
  }, {} as TileSkinMap);

let snapshot: TileSkinMap = createEmpty();
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

export const tileSkinStore = {
  getSnapshot(): TileSkinMap {
    return snapshot;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Define / limpia (null) la foto de un tipo. Crea nuevo snapshot. */
  setSkin(type: TileType, dataUrl: string | null) {
    if (snapshot[type] === dataUrl) return;
    snapshot = { ...snapshot, [type]: dataUrl };
    emit();
  },
  /** Reemplaza el mapping completo (útil para FASE E al hidratar). */
  setAll(next: TileSkinMap) {
    snapshot = { ...next };
    emit();
  },
  reset() {
    snapshot = createEmpty();
    emit();
  },
};
