import { useSyncExternalStore } from "react";
import { tileSkinStore, type TileSkinMap } from "@/utils/tileSkinStore";

/**
 * Hook React reactivo para leer el mapping de fotos por tipo de ficha.
 * Devuelve siempre un objeto { t1..t6 -> dataUrl | null }.
 *
 * En FASE E se conectará con la persistencia (Filesystem + IndexedDB).
 */
export function useTileSkin(): TileSkinMap {
  return useSyncExternalStore(
    tileSkinStore.subscribe,
    tileSkinStore.getSnapshot,
    tileSkinStore.getSnapshot, // SSR snapshot (no hay SSR, pero OK)
  );
}
