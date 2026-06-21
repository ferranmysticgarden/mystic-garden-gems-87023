export type ThemeId = 'flowers' | 'animals' | 'desserts' | 'fruits' | 'racing' | 'pirates' | 'unicorns' | 'manga';
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

export const THEME_LEVEL_UNLOCKS: Partial<Record<ThemeId, number>> = {
  animals: 5,
  desserts: 10,
  fruits: 15,
};

export const PREMIUM_THEME_IDS: ThemeId[] = ['racing', 'pirates', 'unicorns', 'manga'];

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
    tier: 'premium',
    gemPrice: 450,
    eurPrice: 2.99,
    productId: 'theme_racing_unlock',
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/racing/icon_${n}.png`),
  },
  {
    id: 'pirates',
    emoji: '🏴‍☠️',
    nameKey: 'themes.pirates.name',
    tier: 'premium',
    gemPrice: 450,
    eurPrice: 2.99,
    productId: 'theme_pirates_unlock',
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/pirates/icon_${n}.png`),
  },
  {
    id: 'unicorns',
    emoji: '🦄',
    nameKey: 'themes.unicorns.name',
    tier: 'premium',
    gemPrice: 450,
    eurPrice: 2.99,
    productId: 'theme_unicorns_unlock',
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/unicorns/icon_${n}.png`),
  },
  {
    id: 'manga',
    emoji: '🌸',
    nameKey: 'themes.manga.name',
    tier: 'premium',
    gemPrice: 450,
    eurPrice: 2.99,
    productId: 'theme_manga_unlock',
    iconPaths: [1,2,3,4,5,6].map((n) => `/themes/manga/icon_${n}.png`),
  },
];

export const THEME_MAP: Record<ThemeId, ThemeDefinition> = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme]),
) as Record<ThemeId, ThemeDefinition>;

export const DEFAULT_THEME_ID: ThemeId = 'flowers';

export const THEME_TILE_MAP: Record<ThemeId, Record<string, string>> = {
  flowers: { t1: '🌸', t2: '🌺', t3: '🌼', t4: '🍃', t5: '🌻', t6: '🌷' },
  animals: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/animals/icon_${index + 1}.png`])),
  desserts: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/desserts/icon_${index + 1}.png`])),
  fruits: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/fruits/icon_${index + 1}.png`])),
  racing: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/racing/icon_${index + 1}.png`])),
  pirates: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/pirates/icon_${index + 1}.png`])),
  unicorns: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/unicorns/icon_${index + 1}.png`])),
  manga: Object.fromEntries(['t1','t2','t3','t4','t5','t6'].map((tileId, index) => [tileId, `/themes/manga/icon_${index + 1}.png`])),
} as Record<ThemeId, Record<string, string>>;
