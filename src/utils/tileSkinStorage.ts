/**
 * tileSkinStorage.ts
 *
 * Capa de persistencia para las fotos personalizadas de las fichas.
 *
 * - NATIVO (Android/iOS): @capacitor/filesystem en Directory.Data,
 *   un archivo JSON único `tile-skins.json` con cabecera de versión.
 * - WEB: IndexedDB vía idb-keyval (clave única `tile-skins-v1`).
 *
 * NUNCA sube fotos a Supabase / red. 100% local.
 *
 * Política de errores: las operaciones son "best effort". Si falla
 * persistir, el store en memoria sigue siendo la verdad para esta
 * sesión y el caller decide si mostrar toast.
 */

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

import { TILE_TYPES, type TileType } from "@/constants/tileTypes";

export type SkinMap = Record<TileType, string | null>;

const STORAGE_VERSION = 1;
const NATIVE_FILE = "tile-skins.json";
const WEB_KEY = "tile-skins-v1";

interface StoredPayload {
  version: number;
  skins: SkinMap;
}

const emptyMap = (): SkinMap =>
  TILE_TYPES.reduce((acc, id) => {
    acc[id] = null;
    return acc;
  }, {} as SkinMap);

const isNative = () => Capacitor.isNativePlatform();

// ─── Lectura completa ─────────────────────────────────────────────────────────

async function readNative(): Promise<StoredPayload | null> {
  try {
    const res = await Filesystem.readFile({
      path: NATIVE_FILE,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    const data = typeof res.data === "string" ? res.data : "";
    if (!data) return null;
    return JSON.parse(data) as StoredPayload;
  } catch {
    // Archivo aún no existe → primer arranque
    return null;
  }
}

async function readWeb(): Promise<StoredPayload | null> {
  try {
    const data = (await idbGet(WEB_KEY)) as StoredPayload | undefined;
    return data ?? null;
  } catch {
    return null;
  }
}

async function writeNative(payload: StoredPayload): Promise<void> {
  await Filesystem.writeFile({
    path: NATIVE_FILE,
    data: JSON.stringify(payload),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });
}

async function writeWeb(payload: StoredPayload): Promise<void> {
  await idbSet(WEB_KEY, payload);
}

async function readPayload(): Promise<StoredPayload | null> {
  return isNative() ? readNative() : readWeb();
}

async function writePayload(payload: StoredPayload): Promise<void> {
  return isNative() ? writeNative(payload) : writeWeb(payload);
}

// Cache en memoria para evitar leer/escribir el archivo entero por slot.
let cache: SkinMap | null = null;

async function ensureCache(): Promise<SkinMap> {
  if (cache) return cache;
  const stored = await readPayload();
  if (!stored) {
    cache = emptyMap();
    return cache;
  }
  // Migración por versión: si en el futuro cambia, borrar y empezar limpio.
  if (stored.version !== STORAGE_VERSION) {
    cache = emptyMap();
    try {
      await writePayload({ version: STORAGE_VERSION, skins: cache });
    } catch {
      /* best effort */
    }
    return cache;
  }
  // Sanitizamos para garantizar que las 6 claves existen.
  const merged = emptyMap();
  for (const id of TILE_TYPES) {
    const v = stored.skins?.[id];
    merged[id] = typeof v === "string" && v.length > 0 ? v : null;
  }
  cache = merged;
  return cache;
}

export interface TileSkinStorage {
  save(skinId: TileType, dataUrl: string): Promise<void>;
  load(skinId: TileType): Promise<string | null>;
  remove(skinId: TileType): Promise<void>;
  loadAll(): Promise<SkinMap>;
  clear(): Promise<void>;
}

export const tileSkinStorage: TileSkinStorage = {
  async loadAll() {
    const map = await ensureCache();
    // Devolvemos copia para no exponer la referencia interna mutable.
    return { ...map };
  },

  async load(skinId) {
    const map = await ensureCache();
    return map[skinId] ?? null;
  },

  async save(skinId, dataUrl) {
    const map = await ensureCache();
    map[skinId] = dataUrl;
    await writePayload({ version: STORAGE_VERSION, skins: { ...map } });
  },

  async remove(skinId) {
    const map = await ensureCache();
    map[skinId] = null;
    await writePayload({ version: STORAGE_VERSION, skins: { ...map } });
  },

  async clear() {
    cache = emptyMap();
    if (isNative()) {
      try {
        await Filesystem.deleteFile({
          path: NATIVE_FILE,
          directory: Directory.Data,
        });
      } catch {
        /* archivo puede no existir */
      }
    } else {
      try {
        await idbDel(WEB_KEY);
      } catch {
        /* best effort */
      }
    }
  },
};
