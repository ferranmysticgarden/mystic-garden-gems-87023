/**
 * Feature flags para AAB 2092.
 * Cambiar a false para rollback OTA sin AAB.
 */
export const FEATURE_FLAGS = {
  sugarCrush: true,
  haptics: true,
  tileParticles: true,
  screenShake: true,
  fairyLuna: true,
  worldBanners: true,
} as const;
