import { PRODUCTS } from '@/data/products';

const GOOGLE_PLAY_CORE_QUERY_SKUS: string[] = [
  'starter_gems',
  'gems_100',
  'pack_racha_infinita',
  'unlimited_lives_30min',
  'extra_moves',
];

const GOOGLE_PLAY_ID_OVERRIDES: Record<string, string[]> = {
  starter_gems: ['starter_gems', 'startergems'],
  gems_100: ['gems_100', 'gems100'],
  pack_racha_infinita: ['pack_racha_infinita', 'packrachainfinita'],
  unlimited_lives_30min: ['unlimited_lives_30min', 'unlimitedlives30min'],
  pack_victoria_segura_pro: ['pack_victoria_segura_pro', 'packvictoriasegurapro'],
  first_day_offer: ['first_day_offer', 'firstdayoffer'],
  extra_moves: ['extra_moves', 'extramoves'],
};

const GOOGLE_PLAY_PURCHASE_OVERRIDES: Record<string, string[]> = {
  quick_pack: ['gems_100'],
  flash_offer: ['gems_100'],
  starter_pack: ['pack_racha_infinita'],
  pack_impulso: ['pack_racha_infinita'],
  continue_game: ['extra_moves'],
  buy_moves: ['extra_moves'],
  finish_level: ['extra_moves'],
  welcome_pack: ['extra_moves'],
  victory_multiplier: ['extra_moves'],
  reward_doubler: ['extra_moves'],
  lifesaver_pack: ['extra_moves'],
  streak_protection: ['extra_moves'],
  extra_spin: ['extra_moves'],
};

const normalizeId = (id: string) => id.toLowerCase().replace(/[_-]/g, '');

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const withAliases = (productIds: string[]) => unique(productIds.flatMap((productId) => {
  const explicit = GOOGLE_PLAY_ID_OVERRIDES[productId] ?? [];
  return explicit.length > 0 ? explicit : [productId, normalizeId(productId)];
}));

export const getGooglePlayCandidates = (productId: string): string[] => {
  const mappedProductIds = GOOGLE_PLAY_PURCHASE_OVERRIDES[productId] ?? [productId];
  return withAliases(mappedProductIds);
};

export const getGooglePlayQueryProductIds = (): string[] => {
  return withAliases(GOOGLE_PLAY_CORE_QUERY_SKUS);
};

export const getGooglePlayRequestedRewardProductId = (productId: string): string => {
  return PRODUCTS.some((product) => product.id === productId) ? productId : productId;
};

export const resolveGooglePlayProductId = (
  productId: string,
  availableProducts: Record<string, unknown>
): string | null => {
  const candidates = getGooglePlayCandidates(productId);

  for (const candidate of candidates) {
    if (availableProducts[candidate]) {
      return candidate;
    }
  }

  return null;
};
