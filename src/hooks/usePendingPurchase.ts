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
  const [verifying, setVerifying] = useState(false);

  // Detectar si venimos de un pago y VERIFICAR con backend
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Limpiar URL inmediatamente
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Cargar estado pendiente
      const savedState = loadPendingState();
      if (savedState && user) {
        // VERIFICAR con backend antes de desbloquear
        setVerifying(true);
        verifyStripePurchase(savedState.productId).then((verified) => {
          if (verified) {
            setPendingState(savedState);
            setPaymentSuccess(true);
            console.log('[PendingPurchase] Pago verificado con Stripe:', savedState.productId);
          } else {
            console.warn('[PendingPurchase] Pago NO verificado — posible manipulación de URL');
            clearPendingStateStorage();
          }
          setVerifying(false);
        });
      } else if (savedState && !user) {
        // Guest: no podemos verificar con Stripe (no tienen session)
        // El webhook ya debería haber procesado si es real
        console.warn('[PendingPurchase] Guest return from Stripe — cannot verify server-side');
        clearPendingStateStorage();
      } else {
        clearPendingStateStorage();
      }
    } else if (paymentStatus === 'cancel') {
      clearPendingStateStorage();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user]);

  const verifyStripePurchase = async (productId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-purchase', {
        body: { productId },
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
      
      // Verificar que no haya expirado
      if (Date.now() - state.timestamp > EXPIRY_TIME) {
        clearPendingStateStorage();
        return null;
      }
      
      return state;
    } catch {
      return null;
    }
  };

  const clearPendingStateStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Limpiar estado después de usarlo
  const clearPendingState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingState(null);
    setPaymentSuccess(false);
    console.log('[PendingPurchase] Estado limpiado');
  }, []);

  return {
    pendingState,
    paymentSuccess,
    verifying,
    savePendingState,
    clearPendingState,
  };
};
