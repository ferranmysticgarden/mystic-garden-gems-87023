/**
 * tileSkinStore.ts
 *
 * Store global mínimo (sin dependencias) para mantener el mapping
 * { tileId -> dataUrl | null } de fotos personalizadas del usuario.
 *
 * - Listeners pattern compatible con React.useSyncExternalStore.
 * - FASE E: la persistencia se delega en tileSkinStorage. La memoria
 *   sigue siendo la "fuente para el render" — la persistencia es
 *   best-effort y se hace en background tras cada setSkin.
 * - El snapshot devuelto es referencialmente estable hasta que cambie
 *   algún slot, evitando re-renders innecesarios en cada Tile.
 */

import { TILE_TYPES, type TileType } from "@/constants/tileTypes";
import { tileSkinStorage } from "@/utils/tileSkinStore-storage-bridge";

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

let hydrated = false;
let hydratingPromise: Promise<void> | null = null;

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
    // Persistencia best-effort, no bloquea UI.
    const op = dataUrl === null
      ? tileSkinStorage.remove(type)
      : tileSkinStorage.save(type, dataUrl);
    op.catch((err) => {
      // No revertimos: la memoria es coherente con lo que el user ve.
      console.warn("[tileSkinStore] persist failed for", type, err);
    });
  },
  /** Reemplaza el mapping completo (útil al hidratar). */
  setAll(next: TileSkinMap) {
    snapshot = { ...next };
    emit();
  },
  reset() {
    snapshot = createEmpty();
    emit();
    tileSkinStorage.clear().catch(() => {/* best effort */});
  },
  /** Hidrata desde el almacenamiento persistente. Idempotente. */
  async hydrate(): Promise<void> {
    if (hydrated) return;
    if (hydratingPromise) return hydratingPromise;
    hydratingPromise = (async () => {
      try {
        const stored = await tileSkinStorage.loadAll();
        // Mezclamos sin pisar cambios que ya pudieran haberse hecho
        // en memoria entre import y hydrate (caso muy raro).
        const next = { ...stored, ...Object.fromEntries(
          Object.entries(snapshot).filter(([, v]) => v !== null)
        ) } as TileSkinMap;
        snapshot = next;
        emit();
      } catch (err) {
        console.warn("[tileSkinStore] hydrate failed", err);
      } finally {
        hydrated = true;
      }
    })();
    return hydratingPromise;
  },
  isHydrated(): boolean {
    return hydrated;
  },
};
