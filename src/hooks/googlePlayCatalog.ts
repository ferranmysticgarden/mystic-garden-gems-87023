import { PRODUCTS } from '@/data/products';

// ── Google Play Console: ONLY these SKUs actually exist ──
// Everything else is a ghost query that causes "internal error" / "disconnected"
const GOOGLE_PLAY_LIVE_SKUS: string[] = [
  'starter_gems',
  'gems_100',
  'pack_racha_infinita',
  'unlimited_lives_30min',
  'pack_victoria_segura_pro',
  'first_day_offer',
  'extra_moves',
];

// Map internal product IDs to their ACTUAL Google Play Console IDs.
const GOOGLE_PLAY_ID_OVERRIDES: Record<string, string[]> = {
  starter_gems: ['starter_gems', 'startergems'],
  gems_100: ['gems_100', 'gems100'],
  pack_racha_infinita: ['pack_racha_infinita', 'packrachainfinita'],
  unlimited_lives_30min: ['unlimited_lives_30min', 'unlimitedlives30min'],
  pack_victoria_segura_pro: ['pack_victoria_segura_pro', 'packvictoriasegurapro'],
  first_day_offer: ['first_day_offer', 'firstdayoffer'],
  extra_moves: ['extra_moves', 'extramoves'],
};

const normalizeId = (id: string) => id.toLowerCase().replace(/[_-]/g, '');

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export const getGooglePlayCandidates = (productId: string): string[] => {
  const explicit = GOOGLE_PLAY_ID_OVERRIDES[productId] ?? [];
  if (explicit.length > 0) return explicit;
  // Fallback: try raw + normalized
  const normalized = normalizeId(productId);
  return unique([productId, normalized]);
};

// Query ONLY the SKUs that actually exist in Google Play Console
export const getGooglePlayQueryProductIds = (): string[] => {
  return [...GOOGLE_PLAY_LIVE_SKUS];
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
