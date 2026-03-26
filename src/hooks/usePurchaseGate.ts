import { useState, useEffect, useCallback } from 'react';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

const PURCHASE_FLAG_KEY = 'mystic_has_purchased_once';
const PURCHASE_EVENT_DEDUP_WINDOW_MS = 1500;

let lastPurchaseDispatch: { productId: string; timestamp: number } | null = null;

/**
 * Hook para gestionar el "muro de primera compra"
 * - Guest: fallback localStorage
 * - Usuario autenticado: valida contra backend para evitar bypass local
 */
export const usePurchaseGate = () => {
  const { user } = useAuth();
  const [hasPurchasedOnce, setHasPurchasedOnce] = useState(() => {
    return localStorage.getItem(PURCHASE_FLAG_KEY) === 'true';
  });

  useEffect(() => {
    let mounted = true;

    const syncPurchaseState = async () => {
      if (!user) {
        if (mounted) {
          setHasPurchasedOnce(localStorage.getItem(PURCHASE_FLAG_KEY) === 'true');
        }
        return;
      }

      const { data, error } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!mounted) return;

      if (error) {
        console.error('[PURCHASE_GATE] Error syncing purchase state:', error);
        setHasPurchasedOnce(localStorage.getItem(PURCHASE_FLAG_KEY) === 'true');
        return;
      }

      const hasServerPurchase = Boolean(data && data.length > 0);
      if (hasServerPurchase) {
        localStorage.setItem(PURCHASE_FLAG_KEY, 'true');
      }
      setHasPurchasedOnce(hasServerPurchase || localStorage.getItem(PURCHASE_FLAG_KEY) === 'true');
    };

    syncPurchaseState();

    return () => {
      mounted = false;
    };
  }, [user]);

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

// Rewards shape from server
export interface ServerRewards {
  gems?: number;
  lives?: number;
  powerups?: number;
  noAdsDays?: number;
  noAdsForever?: boolean;
  unlimitedLivesMinutes?: number;
}

// Función helper para disparar el evento global (con rewards opcionales del servidor)
export const dispatchPurchaseCompleted = (productId?: string, rewards?: ServerRewards) => {
  const resolvedProductId = productId ?? '__unknown__';
  const now = Date.now();

  if (
    lastPurchaseDispatch &&
    lastPurchaseDispatch.productId === resolvedProductId &&
    now - lastPurchaseDispatch.timestamp < PURCHASE_EVENT_DEDUP_WINDOW_MS
  ) {
    console.warn('[PURCHASE_GATE] Duplicate purchase event ignored:', resolvedProductId);
    return;
  }

  lastPurchaseDispatch = { productId: resolvedProductId, timestamp: now };

  localStorage.setItem(PURCHASE_FLAG_KEY, 'true');
  localStorage.setItem('first_purchase_completed', 'true');
  window.dispatchEvent(new CustomEvent('first_purchase_completed', {
    detail: { productId, rewards },
  }));
  
  // Emit to Firebase/Google Ads so campaigns can optimize
  emitAnalyticsEvent('first_purchase_completed', { product: productId });
};
