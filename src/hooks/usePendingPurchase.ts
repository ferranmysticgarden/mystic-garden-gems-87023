import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Interface para el estado guardado del juego antes de pagar
 */
export interface PendingPurchaseState {
  levelId: number;
  moves: number;
  score: number;
  collected: Record<string, number>;
  productId: string;
  timestamp: number;
}

const STORAGE_KEY = 'pending_purchase_state';
const PENDING_PRODUCT_KEY = 'stripe_pending_product';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutos

/**
 * Hook para gestionar el estado del juego durante pagos con Stripe
 * Guarda el estado antes de ir a Stripe y lo restaura al volver.
 * 
 * CRITICAL: No confia en ?payment=success. Verifica contra Stripe real.
 */
export const usePendingPurchase = () => {
  const { user } = useAuth();
  const [pendingState, setPendingState] = useState<PendingPurchaseState | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifiedProductId, setVerifiedProductId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Capturar parámetros de URL al montar (antes de que user esté listo)
  const [capturedParams, setCapturedParams] = useState<{ paymentStatus: string | null; sessionId: string | null }>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    // Limpiar URL inmediatamente para evitar re-procesamiento
    if (paymentStatus) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    return { paymentStatus, sessionId };
  });

  // Procesar pago cuando user esté disponible
  useEffect(() => {
    const { paymentStatus, sessionId } = capturedParams;
    
    if (paymentStatus === 'cancel') {
      clearAllStorage();
      setCapturedParams({ paymentStatus: null, sessionId: null });
      return;
    }

    if (paymentStatus !== 'success') return;
    if (!user) return; // Esperar a que user cargue

    const savedState = loadPendingState();
    const simplePending = loadSimplePending();
    const productId = savedState?.productId || simplePending?.productId;

    if (!productId) {
      console.warn('[PendingPurchase] No productId found in storage');
      clearAllStorage();
      setCapturedParams({ paymentStatus: null, sessionId: null });
      return;
    }

    if (sessionId) {
      setVerifying(true);
      verifyStripePurchase(productId, sessionId).then((verified) => {
        if (verified) {
          if (savedState) setPendingState(savedState);
          setVerifiedProductId(productId);
          setPaymentSuccess(true);
          console.log('[PendingPurchase] ✅ Pago verificado con Stripe:', productId);
        } else {
          console.warn('[PendingPurchase] ❌ Pago NO verificado');
          clearAllStorage();
        }
        setVerifying(false);
        setCapturedParams({ paymentStatus: null, sessionId: null });
      });
    } else {
      console.warn('[PendingPurchase] Missing session_id on success redirect, refusing unverified grant for:', productId);
      clearAllStorage();
      setCapturedParams({ paymentStatus: null, sessionId: null });
    }
  }, [user, capturedParams]);

  const verifyStripePurchase = async (productId: string, sessionId: string | null): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-purchase', {
        body: { productId, sessionId },
      });
      
      if (error) {
        console.error('[PendingPurchase] Verification error:', error);
        return false;
      }
      
      return data?.verified === true;
    } catch (e) {
      console.error('[PendingPurchase] Verification exception:', e);
      return false;
    }
  };

  const loadSimplePending = (): { productId: string; timestamp: number } | null => {
    try {
      const saved = localStorage.getItem(PENDING_PRODUCT_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp > EXPIRY_TIME) {
        localStorage.removeItem(PENDING_PRODUCT_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  // Guardar estado antes de ir a Stripe
  const savePendingState = useCallback((state: Omit<PendingPurchaseState, 'timestamp'>) => {
    const fullState: PendingPurchaseState = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
    console.log('[PendingPurchase] Estado guardado:', fullState);
  }, []);

  // Cargar estado guardado
  const loadPendingState = (): PendingPurchaseState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      
      const state: PendingPurchaseState = JSON.parse(saved);
      
      if (Date.now() - state.timestamp > EXPIRY_TIME) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return state;
    } catch {
      return null;
    }
  };

  const clearAllStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PENDING_PRODUCT_KEY);
  };

  // Limpiar estado después de usarlo
  const clearPendingState = useCallback(() => {
    clearAllStorage();
    setPendingState(null);
    setPaymentSuccess(false);
    setVerifiedProductId(null);
    console.log('[PendingPurchase] Estado limpiado');
  }, []);

  return {
    pendingState,
    paymentSuccess,
    verifiedProductId,
    verifying,
    savePendingState,
    clearPendingState,
  };
};
