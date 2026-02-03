import { useState, useEffect, useCallback } from 'react';

const PURCHASE_FLAG_KEY = 'mystic_has_purchased_once';

/**
 * Hook para gestionar el "muro de primera compra"
 * Bloquea shop/packs/cofres hasta que el usuario haga su primera compra
 */
export const usePurchaseGate = () => {
  const [hasPurchasedOnce, setHasPurchasedOnce] = useState(() => {
    return localStorage.getItem(PURCHASE_FLAG_KEY) === 'true';
  });

  // Marcar como comprado (llamar después de cualquier compra exitosa)
  const markAsPurchased = useCallback(() => {
    localStorage.setItem(PURCHASE_FLAG_KEY, 'true');
    setHasPurchasedOnce(true);
  }, []);

  // Escuchar evento global de compra (para sincronizar entre componentes)
  useEffect(() => {
    const handlePurchase = () => {
      markAsPurchased();
    };

    window.addEventListener('first_purchase_completed', handlePurchase);
    return () => window.removeEventListener('first_purchase_completed', handlePurchase);
  }, [markAsPurchased]);

  return {
    hasPurchasedOnce,
    markAsPurchased,
    isShopLocked: !hasPurchasedOnce
  };
};

// Función helper para disparar el evento global
export const dispatchPurchaseCompleted = () => {
  localStorage.setItem(PURCHASE_FLAG_KEY, 'true');
  window.dispatchEvent(new Event('first_purchase_completed'));
};
