import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { trackEvent } from '@/lib/trackEvent';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { PRODUCTS } from '@/data/products';

// Local lookup: canonical product_id → { price, name } from src/data/products.ts.
// Built once at module load. Contains catalog metadata only — NO user data, NO PII.
const PRODUCT_CATALOG_LOOKUP: Record<string, { price: number; name: string }> =
  Object.fromEntries(
    PRODUCTS.map((p) => [p.id, { price: p.price, name: p.name }])
  );

const TRACKED_SESSIONS_KEY = 'tracked_success_session_ids';

const wasSessionTracked = (sessionId: string): boolean => {
  try {
    const raw = localStorage.getItem(TRACKED_SESSIONS_KEY);
    if (!raw) return false;
    const arr: string[] = JSON.parse(raw);
    return Array.isArray(arr) && arr.includes(sessionId);
  } catch {
    return false;
  }
};

const markSessionTracked = (sessionId: string) => {
  try {
    const raw = localStorage.getItem(TRACKED_SESSIONS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr) ? arr : [];
    if (!next.includes(sessionId)) next.push(sessionId);
    // Keep last 50 to avoid unbounded growth
    const trimmed = next.slice(-50);
    localStorage.setItem(TRACKED_SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
};

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
  const { user, session, loading: authLoading } = useAuth();
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
    if (authLoading) return;
    if (!user || !session?.access_token) return; // Esperar sesión real para invocar backend con auth

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
      verifyStripePurchase(productId, sessionId, session.access_token).then((verified) => {
        if (verified) {
          if (savedState) setPendingState(savedState);
          setVerifiedProductId(productId);
          setPaymentSuccess(true);
          // Emit purchase_success ONLY after Stripe verification, with dedupe by session_id
          if (!wasSessionTracked(sessionId)) {
            markSessionTracked(sessionId);
            trackEvent('purchase_success', {
              productId,
              platform: 'web',
              stripe_session_id: sessionId,
              userId: user.id,
              guest: false,
            });
            // ─── Cross-platform parity: emit purchase_verified for Web (Stripe) ───
            // Until now this Supabase event only existed in the Android flow
            // (useGooglePlayBilling.ts). Adding it here so the dashboard funnel
            // shows verified count for both Android and Web from the same field.
            trackEvent('purchase_verified', {
              platform: 'web',
              product: productId,
              stripe_session_id: sessionId,
              guest: false,
            });
            // ─── Firebase Analytics: GA4 standard 'purchase' event for Google Ads ───
            // Fires ONLY here, after server-side Stripe verification succeeded
            // (verify-stripe-purchase Edge Function returned verified=true).
            // Deduped by sessionId via wasSessionTracked() guard above, so a user
            // refreshing the success URL will NOT double-count the conversion.
            // Wrapped in try/catch so a Firebase failure NEVER breaks the success UI.
            try {
              const meta = PRODUCT_CATALOG_LOOKUP[productId];
              const productPrice = meta?.price ?? 0;
              const productName = meta?.name ?? productId;
              emitAnalyticsEvent('purchase', {
                value: productPrice,
                currency: 'EUR',
                transaction_id: sessionId,
                items: [{
                  item_id: productId,
                  item_name: productName,
                  price: productPrice,
                  quantity: 1,
                }],
              });
            } catch (e) {
              console.warn('[ANALYTICS] GA4 purchase emission failed (non-blocking)', e);
            }
          }
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
  }, [user, session, authLoading, capturedParams]);

  const verifyStripePurchase = async (
    productId: string,
    sessionId: string | null,
    accessToken: string,
  ): Promise<boolean> => {
    if (!sessionId) return false;
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-purchase', {
        body: { productId, sessionId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
