import { PRODUCTS } from '@/data/products';

const GOOGLE_PLAY_ID_OVERRIDES: Record<string, string[]> = {
  starter_gems: ['starter-gems'],
  welcome_pack: ['welcomepack'],
  pack_impulso: ['packimpulso'],
  pack_experiencia: ['packexperiencia'],
  pack_racha_infinita: ['pack_racha_infinita', 'packrachainfinita'],
  pack_victoria_segura: ['pack_victoria_segura', 'packvictoriasegura'],
  pack_victoria_segura_pro: ['packvictoriasegurapro'],
  quick_pack: ['quickpack'],
  gems_100: ['gems100'],
  gems_300: ['gems300'],
  gems_1200: ['gems1200'],
  no_ads_month: ['noadsmonth'],
  no_ads_forever: ['noadsforever'],
  garden_pass: ['gardenpass'],
  extra_moves: ['extramoves'],
  first_purchase: ['firstpurchase'],
  flash_offer: ['flashoffer'],
  buy_moves: ['buymoves'],
  finish_level: ['finishlevel'],
  starter_pack: ['starterpack'],
  continue_game: ['continuegame'],
  victory_multiplier: ['victorymultiplier'],
  reward_doubler: ['rewarddoubler'],
  chest_silver: ['chestsilver'],
  chest_gold: ['chestgold'],
  mega_pack_inicial: ['megapackinicial'],
  pack_revancha: ['packrevancha'],
  lifesaver_pack: ['lifesaverpack'],
  streak_protection: ['streakprotection'],
  extra_spin: ['extraspin'],
  unlimited_lives_30min: ['unlimitedlives30min'],
};

const normalizeId = (id: string) => id.toLowerCase().replace(/[_-]/g, '');

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const getPreferredGooglePlayProductId = (productId: string): string => {
  const explicit = GOOGLE_PLAY_ID_OVERRIDES[productId]?.[0];
  return explicit ?? normalizeId(productId);
};

const getPrimaryGooglePlayCandidates = (productId: string): string[] => {
  const normalized = normalizeId(productId);
  const explicit = GOOGLE_PLAY_ID_OVERRIDES[productId] ?? [];

  return unique([
    ...explicit,
    normalized,
    productId,
  ]);
};

export const getGooglePlayCandidates = (productId: string): string[] => {
  const normalized = normalizeId(productId);

  return unique([
    ...getPrimaryGooglePlayCandidates(productId),
    `${normalized}1`,
    `${productId}1`,
  ]);
};

const KNOWN_PRODUCT_IDS = PRODUCTS.map((product) => product.id);

export const getGooglePlayQueryProductIds = (): string[] => {
  return unique(KNOWN_PRODUCT_IDS.map((productId) => getPreferredGooglePlayProductId(productId)));
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
