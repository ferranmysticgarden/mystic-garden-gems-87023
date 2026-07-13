export type ThemeId = 'flowers' | 'animals' | 'desserts' | 'fruits' | 'racing' | 'pirates' | 'unicorns' | 'manga' | 'halloween' | 'christmas';
export type ThemeTier = 'free' | 'premium';
export type ThemeUnlockMethod = 'default' | 'level' | 'gems' | 'purchase';

export interface ThemeDefinition {
  id: ThemeId;
  emoji: string;
  nameKey: string;
  tier: ThemeTier;
  unlockLevel?: number;
  gemPrice?: number;
  eurPrice?: number;
  productId?: string;
  iconPaths: string[];
}

// FEATURE 1 — Racing/Pirates/Unicorns/Manga ahora gratis por nivel.
// FEATURE 2 — Halloween (80) y Navidad (100) añadidos como temas sorpresa.
export const THEME_LEVEL_UNLOCKS: Partial<Record<ThemeId, number>> = {
  animals: 5,
  desserts: 10,
  fruits: 15,
  racing: 20,
  pirates: 35,
  unicorns: 50,
  manga: 65,
  halloween: 80,
  christmas: 100,
};

// Ya no quedan premium; se conserva export por compatibilidad histórica.
export const PREMIUM_THEME_IDS: ThemeId[] = [];

// Temas sorpresa: ThemeCard oculta preview y ThemeUnlockedModal muestra
// mensaje especial "¡TEMA SORPRESA!" cuando se desbloquean.
export const SURPRISE_THEME_IDS: ThemeId[] = ['halloween', 'christmas'];

export const THEMES: ThemeDefinition[] = [
  {
    id: 'flowers',
    emoji: '🌸',
    nameKey: 'themes.flowers.name',
    tier: 'free',
    iconPaths: [],
  },
  {
    id: 'animals',
    emoji: '🐱',
    nameKey: 'themes.animals.name',
    tier: 'free',
    unlockLevel: 5,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/animals/icon_${n}.png`),
  },
  {
    id: 'desserts',
    emoji: '🍰',
    nameKey: 'themes.desserts.name',
    tier: 'free',
    unlockLevel: 10,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/desserts/icon_${n}.png`),
  },
  {
    id: 'fruits',
    emoji: '🍓',
    nameKey: 'themes.fruits.name',
    tier: 'free',
    unlockLevel: 15,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/fruits/icon_${n}.png`),
  },
  {
    id: 'racing',
    emoji: '🏎️',
    nameKey: 'themes.racing.name',
    tier: 'free',
    unlockLevel: 20,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/racing/icon_${n}.png`),
  },
  {
    id: 'pirates',
    emoji: '🏴‍☠️',
    nameKey: 'themes.pirates.name',
    tier: 'free',
    unlockLevel: 35,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/pirates/icon_${n}.png`),
  },
  {
    id: 'unicorns',
    emoji: '🦄',
    nameKey: 'themes.unicorns.name',
    tier: 'free',
    unlockLevel: 50,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/unicorns/icon_${n}.png`),
  },
  {
    id: 'manga',
    emoji: '🌸',
    nameKey: 'themes.manga.name',
    tier: 'free',
    unlockLevel: 65,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/manga/icon_${n}.png`),
  },
  {
    id: 'halloween',
    emoji: '🎃',
    nameKey: 'themes.halloween.name',
    tier: 'free',
    unlockLevel: 80,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/halloween/icon_${n}.png`),
  },
  {
    id: 'christmas',
    emoji: '❄️',
    nameKey: 'themes.christmas.name',
    tier: 'free',
    unlockLevel: 100,
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/christmas/icon_${n}.png`),
  },
];

export const THEME_MAP: Record<ThemeId, ThemeDefinition> = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme]),
) as Record<ThemeId, ThemeDefinition>;

export const DEFAULT_THEME_ID: ThemeId = 'flowers';

export const THEME_TILE_MAP: Record<ThemeId, Record<string, string>> = {
  flowers: { t1: '🌸', t2: '🪻', t3: '🌼', t4: '🍃', t5: '🌻', t6: '🌷' },
  animals: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/animals/icon_${index + 1}.png`])),
  desserts: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/desserts/icon_${index + 1}.png`])),
  fruits: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/fruits/icon_${index + 1}.png`])),
  racing: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/racing/icon_${index + 1}.png`])),
  pirates: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/pirates/icon_${index + 1}.png`])),
  unicorns: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/unicorns/icon_${index + 1}.png`])),
  manga: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/manga/icon_${index + 1}.png`])),
  halloween: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/halloween/icon_${index + 1}.png`])),
  christmas: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/christmas/icon_${index + 1}.png`])),
} as Record<ThemeId, Record<string, string>>;
