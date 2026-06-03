/**
 * Utilidades para gestionar el historial de compras local y evitar canibalización.
 * Clave principal: mystic_purchased_starter_gems
 */

const STARTER_GEMS_KEY = 'mystic_purchased_starter_gems';

/**
 * Verifica si el usuario ya ha comprado el pack de inicio de gemas.
 * Funciona tanto para invitados como para registrados mediante localStorage.
 */
export const hasPurchasedStarterGems = (): boolean => {
  return localStorage.getItem(STARTER_GEMS_KEY) === 'true';
};

/**
 * Marca el pack de inicio como comprado en el dispositivo actual.
 */
export const markStarterGemsAsPurchased = () => {
  localStorage.setItem(STARTER_GEMS_KEY, 'true');
  console.log('[PURCHASES] Starter gems marked as purchased locally');
};
