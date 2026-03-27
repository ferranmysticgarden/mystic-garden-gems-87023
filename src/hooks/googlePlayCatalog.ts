import { PRODUCTS } from '@/data/products';

// Map internal product IDs to their ACTUAL Google Play Console IDs.
// The FIRST entry should be the exact ID as it appears in the Console.
const GOOGLE_PLAY_ID_OVERRIDES: Record<string, string[]> = {
  // starter_gems had multiple historical IDs; keep all known working variants
  starter_gems: ['starter-gems', 'startergems', 'starter_gems'],
  victory_multiplier: ['victory_multiplier', 'victorymultiplier'],
  chest_gold: ['chest_gold', 'chestgold'],
  chest_silver: ['chest_silver', 'chestsilver'],
  mega_pack_inicial: ['mega_pack_inicial', 'megapackinicial'],
  starter_pack: ['starter_pack', 'starterpack'],
  flash_offer: ['flash_offer', 'flashoffer'],
  finish_level: ['finish_level', 'finishlevel'],
  continue_game: ['continue_game', 'continuegame'],
  buy_moves: ['buy_moves', 'buymoves'],
  pack_revancha: ['pack_revancha', 'packrevancha'],
  lifesaver_pack: ['lifesaver_pack', 'lifesaverpack'],
  streak_protection: ['streak_protection', 'streakprotection'],
  extra_spin: ['extra_spin', 'extraspin'],
  reward_doubler: ['reward_doubler', 'rewarddoubler'],

  // Products that must use the Console ID WITHOUT underscores
  unlimited_lives_30min: ['unlimitedlives30min'],
  first_day_offer: ['firstdayoffer'],
  pack_racha_infinita: ['packrachainfinita'],
  pack_victoria_segura: ['packvictoriasegura'],
  pack_victoria_segura_pro: ['packvictoriasegurapro'],
  welcome_pack: ['welcomepack'],
  pack_impulso: ['packimpulso'],
  pack_experiencia: ['packexperiencia'],
  quick_pack: ['quickpack'],
  gems_100: ['gems100'],
  gems_300: ['gems300'],
  gems_1200: ['gems1200'],
  no_ads_month: ['noadsmonth'],
  no_ads_forever: ['noadsforever'],
  garden_pass: ['gardenpass'],
  extra_moves: ['extramoves'],
  first_purchase: ['firstpurchase'],
};

const normalizeId = (id: string) => id.toLowerCase().replace(/[_-]/g, '');

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const shouldKeepRawProductId = (productId: string, explicitCandidates: string[]) => {
  return explicitCandidates.length === 0 || explicitCandidates.includes(productId);
};

const getPrimaryGooglePlayCandidates = (productId: string): string[] => {
  const normalized = normalizeId(productId);
  const explicit = GOOGLE_PLAY_ID_OVERRIDES[productId] ?? [];
  const keepRawProductId = shouldKeepRawProductId(productId, explicit);

  return unique([
    ...explicit,
    normalized,
    ...(keepRawProductId ? [productId] : []),
  ]);
};

export const getGooglePlayCandidates = (productId: string): string[] => {
  const normalized = normalizeId(productId);
  const explicit = GOOGLE_PLAY_ID_OVERRIDES[productId] ?? [];
  const keepRawProductId = shouldKeepRawProductId(productId, explicit);

  return unique([
    ...getPrimaryGooglePlayCandidates(productId),
    `${normalized}1`,
    ...(keepRawProductId ? [`${productId}1`] : []),
  ]);
};

const KNOWN_PRODUCT_IDS = PRODUCTS.map((product) => product.id);

// Query only the canonical candidates for the initial catalog load
export const getGooglePlayQueryProductIds = (): string[] => {
  return unique(KNOWN_PRODUCT_IDS.flatMap((productId) => getPrimaryGooglePlayCandidates(productId)));
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
