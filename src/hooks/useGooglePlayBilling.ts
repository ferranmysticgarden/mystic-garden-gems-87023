import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import GooglePlayBilling, { ProductDetails, PurchaseResult } from '@/plugins/GooglePlayBilling';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dispatchPurchaseCompleted } from './usePurchaseGate';
import { trackEvent } from '@/lib/trackEvent';
import {
  getGooglePlayCandidates,
  getGooglePlayQueryProductIds,
  resolveGooglePlayProductId,
} from './googlePlayCatalog';

type BillingStatus = {
  ready: boolean;
  responseCode?: number;
  debugMessage?: string;
};

type SharedBillingState = {
  isReady: boolean;
  products: Record<string, ProductDetails>;
  loading: boolean;
  billingStatus: BillingStatus;
};

const sharedBillingState: SharedBillingState = {
  isReady: false,
  products: {},
  loading: false,
  billingStatus: { ready: false },
};

const billingSubscribers = new Set<(state: SharedBillingState) => void>();
const verificationTasks = new Map<string, Promise<boolean>>();
const purchaseInitiatedByUser = new Set<string>();
const PURCHASE_CANCEL_DEDUP_WINDOW_MS = 1500;

let purchaseInFlightProduct: string | null = null;
let lastAttemptedProductId: string | null = null;
let billingSetupStarted = false;
let billingListenersAttached = false;
let lastPurchaseCancellation: { productId: string; timestamp: number } | null = null;

const reportPurchaseCancelled = (productId?: string | null, error?: string, source?: string) => {
  const resolvedProductId = productId ?? lastAttemptedProductId ?? 'unknown';
  const now = Date.now();

  if (
    lastPurchaseCancellation &&
    lastPurchaseCancellation.productId === resolvedProductId &&
    now - lastPurchaseCancellation.timestamp < PURCHASE_CANCEL_DEDUP_WINDOW_MS
  ) {
    return;
  }

  lastPurchaseCancellation = { productId: resolvedProductId, timestamp: now };
  trackEvent('purchase_cancelled', {
    platform: 'android',
    product: resolvedProductId,
    productId: resolvedProductId,
    ...(error ? { error } : {}),
    ...(source ? { source } : {}),
  });
};

const emitSharedBillingState = () => {
  const snapshot: SharedBillingState = {
    isReady: sharedBillingState.isReady,
    products: { ...sharedBillingState.products },
    loading: sharedBillingState.loading,
    billingStatus: { ...sharedBillingState.billingStatus },
  };

  billingSubscribers.forEach((listener) => listener(snapshot));
};

const updateSharedBillingState = (updater: (state: SharedBillingState) => void) => {
  updater(sharedBillingState);
  emitSharedBillingState();
};

export const useGooglePlayBilling = () => {
  const [billingState, setBillingState] = useState<SharedBillingState>(() => ({
    isReady: sharedBillingState.isReady,
    products: sharedBillingState.products,
    loading: sharedBillingState.loading,
    billingStatus: sharedBillingState.billingStatus,
  }));

  const isAndroid = Capacitor.getPlatform() === 'android';
  const { isReady, products, loading } = billingState;
  const hasLoadedProducts = Object.keys(products).length > 0;

  useEffect(() => {
    const listener = (state: SharedBillingState) => {
      setBillingState(state);
    };

    billingSubscribers.add(listener);
    listener({
      isReady: sharedBillingState.isReady,
      products: sharedBillingState.products,
      loading: sharedBillingState.loading,
      billingStatus: sharedBillingState.billingStatus,
    });

    return () => {
      billingSubscribers.delete(listener);
    };
  }, []);

  const applyBillingStatus = useCallback((status: BillingStatus) => {
    updateSharedBillingState((state) => {
      state.isReady = status.ready;
      state.billingStatus = status;
    });
  }, []);

  const queryProductsIndividually = useCallback(async (productIds: string[]): Promise<Record<string, ProductDetails>> => {
    const merged: Record<string, ProductDetails> = {};

    for (const id of productIds) {
      try {
        const singleResult = await GooglePlayBilling.queryProducts({ productIds: [id] });
        if (Object.keys(singleResult).length > 0) {
          Object.assign(merged, singleResult);
        }
      } catch (error) {
        console.warn('[BILLING] queryProducts single candidate failed:', id, error);
      }
    }

    return merged;
  }, []);

  const queryProductsWithFallback = useCallback(async (productIds: string[]): Promise<Record<string, ProductDetails>> => {
    try {
      const fullBatch = await GooglePlayBilling.queryProducts({ productIds });
      const loadedIds = Object.keys(fullBatch);

      if (loadedIds.length > 0) {
        const missingIds = productIds.filter((id) => !fullBatch[id]);
        if (missingIds.length === 0) {
          return fullBatch;
        }

        const recoveredProducts = await queryProductsIndividually(missingIds);
        return { ...fullBatch, ...recoveredProducts };
      }
    } catch (error) {
      console.warn('[BILLING] batch product query failed, falling back to single queries:', error);
    }

    return queryProductsIndividually(productIds);
  }, [queryProductsIndividually]);

  const queryFirstAvailableCandidate = useCallback(async (candidateIds: string[]): Promise<Record<string, ProductDetails>> => {
    for (const candidateId of candidateIds) {
      const productDetails = await queryProductsIndividually([candidateId]);
      if (Object.keys(productDetails).length > 0) {
        return productDetails;
      }
    }

    return {};
  }, [queryProductsIndividually]);

  const loadProducts = useCallback(async (retryCount = 0): Promise<Record<string, ProductDetails>> => {
    const productIds = getGooglePlayQueryProductIds();
    try {
      const productDetails = await queryProductsWithFallback(productIds);
      const loadedCount = Object.keys(productDetails).length;

      if (loadedCount === 0 && retryCount < 4) {
        await new Promise(r => setTimeout(r, 1500 * (retryCount + 1)));
        return loadProducts(retryCount + 1);
      }

      if (loadedCount === 0) {
        trackEvent('billing_error', {
          phase: 'empty_catalog_after_retries',
          attempt: retryCount + 1,
          queried_ids: productIds.length,
        });
      }

      updateSharedBillingState((state) => {
        state.products = productDetails;
      });
      trackEvent('billing_status', {
        ready: loadedCount > 0,
        products_loaded: loadedCount,
      });
      return productDetails;
    } catch (error) {
      console.error('Error loading products (attempt ' + (retryCount + 1) + '):', error);
      if (retryCount < 4) {
        await new Promise(r => setTimeout(r, 1500 * (retryCount + 1)));
        return loadProducts(retryCount + 1);
      }
      trackEvent('billing_error', {
        error: String(error),
        attempt: retryCount + 1,
        phase: 'load_products_final',
      });
       updateSharedBillingState((state) => {
         state.products = {};
       });
      return {};
    }
  }, [queryProductsWithFallback]);

  const refreshBillingState = useCallback(async (): Promise<BillingStatus & { products: Record<string, ProductDetails> }> => {
    try {
      const status = await GooglePlayBilling.isReady() as BillingStatus;
      applyBillingStatus(status);

      if (!status.ready) {
        updateSharedBillingState((state) => {
          state.products = {};
        });
        return { ...status, products: {} };
      }

      const refreshedProducts = await loadProducts();
      return { ...status, products: refreshedProducts };
    } catch (error) {
      const fallbackStatus: BillingStatus = {
        ready: false,
        debugMessage: error instanceof Error ? error.message : String(error),
      };

      applyBillingStatus(fallbackStatus);
      return { ...fallbackStatus, products: {} };
    }
  }, [applyBillingStatus, loadProducts]);

  const verifyAndProcessPurchase = useCallback((purchase: PurchaseResult, requestedProductId?: string): Promise<boolean> => {
    const purchaseToken = purchase.purchaseToken;
    const trackedProductId = requestedProductId ?? purchase.productId;

    if (!purchaseToken) {
      trackEvent('purchase_verification_failed', {
        platform: 'android',
        product: trackedProductId,
        reason: 'missing_purchase_token',
      });
      return Promise.resolve(false);
    }

    const existingTask = verificationTasks.get(purchaseToken);
    if (existingTask) {
      return existingTask;
    }

    const verificationTask = (async () => {
      let verificationFailReason: string | null = null;
      try {
        trackEvent('purchase_verification_started', {
          platform: 'android',
          product: trackedProductId,
        });

        const { data, error } = await supabase.functions.invoke('verify-google-purchase', {
          body: {
            purchaseToken: purchase.purchaseToken,
            productId: purchase.productId,
            requestedProductId: trackedProductId,
            orderId: purchase.orderId,
            packageName: purchase.packageName,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.success) {
          verificationFailReason = data?.reason ?? data?.code ?? null;
          throw new Error(data?.error || 'Purchase verification failed');
        }

        const verifiedProductId = data?.productId || trackedProductId;

        try {
          await GooglePlayBilling.consumePurchase({ purchaseToken });
          console.log('[PURCHASE] ✅ Consumed after server verification');
        } catch (consumeError) {
          console.error('[PURCHASE] ⚠️ Consume failed (rewards already granted):', consumeError);
          trackEvent('purchase_consume_failed', {
            platform: 'android',
            product: purchase.productId,
            error: String(consumeError),
          });
        }

        console.log('[PURCHASE] success confirmed via Google Play');
        trackEvent('purchase_verified', {
          platform: 'android',
          product: verifiedProductId,
          requested_product: trackedProductId,
          google_product: purchase.productId,
          guest: Boolean(data?.isGuest),
        });
        // Pass server rewards so guest clients can apply them locally
        dispatchPurchaseCompleted(verifiedProductId, data?.rewards ?? undefined);
        console.log('[PURCHASE] gate unlocked');
        toast.success('¡Compra completada!');
        return true;
      } catch (error) {
        verificationTasks.delete(purchaseToken);
        console.error('Error processing purchase:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const normalizedError = errorMessage.toLowerCase();
        const isServiceDisabled =
          normalizedError.includes('api desactivada') ||
          normalizedError.includes('service_disabled') ||
          normalizedError.includes('accessnotconfigured') ||
          normalizedError.includes('api has not been used');
        const isPermissionDenied =
          errorMessage.includes('Google Play API 403') ||
          errorMessage.includes('Google Play API 401') ||
          normalizedError.includes('permissiondenied') ||
          normalizedError.includes('permission_denied') ||
          normalizedError.includes('insufficient permissions') ||
          normalizedError.includes('permisos insuficientes');
        const isInvalidCredentials =
          normalizedError.includes('invalid_grant') ||
          normalizedError.includes('invalid credentials') ||
          normalizedError.includes('invalid_client') ||
          normalizedError.includes('invalid jwt');

        const normalizedProductId = purchase.productId.toLowerCase().replace(/[_-]/g, '');
        const isServerOnlyEntitlement = ['noadsmonth', 'noadsforever', 'gardenpass'].some((prefix) =>
          normalizedProductId.startsWith(prefix)
        );

        if (isPermissionDenied && !isServerOnlyEntitlement) {
          trackEvent('purchase_verified_degraded', {
            platform: 'android',
            product: trackedProductId,
            reason: 'google_permission_denied',
          });

          try {
            await GooglePlayBilling.consumePurchase({ purchaseToken });
          } catch (consumeError) {
            trackEvent('purchase_consume_failed', {
              platform: 'android',
              product: purchase.productId,
              error: String(consumeError),
              degraded_mode: true,
            });
          }

          // Degraded mode: no server rewards available, pass undefined (Index.tsx will fallback to PRODUCTS)
          dispatchPurchaseCompleted(trackedProductId);
          toast.success('¡Compra completada! (modo de respaldo activado)');
          return true;
        }

        trackEvent('purchase_verification_failed', {
          platform: 'android',
          product: trackedProductId,
          error: errorMessage,
          reason: verificationFailReason ?? undefined,
        });

        const isServerNotConfigured =
          normalizedError.includes('server verification not configured') ||
          verificationFailReason === 'server_not_configured' ||
          verificationFailReason === 'SERVER_VERIFICATION_NOT_CONFIGURED';

        toast.error(
          isServerNotConfigured
            ? 'Compra bloqueada: el servidor no tiene configurada la verificación de Google Play (contacta al desarrollador).'
            : isServiceDisabled
              ? 'Compra bloqueada: activa Google Play Android Developer API del proyecto de la cuenta de servicio y espera 5 minutos.'
              : isPermissionDenied
                ? 'Compra bloqueada por permisos de Google Play para la cuenta de servicio. Revisa acceso API, Gestionar pedidos y Ver datos financieros en Google Play Console.'
                : isInvalidCredentials
                  ? 'Compra bloqueada: credenciales de Google Play inválidas. Revisa GOOGLE_PLAY_SERVICE_ACCOUNT.'
                  : 'Error al procesar la compra'
        );
        return false;
      }
    })();

    verificationTasks.set(purchaseToken, verificationTask);
    return verificationTask;
  }, []);

  useEffect(() => {
    if (!isAndroid) return;

    const setupBilling = async () => {
      try {
        const status = await GooglePlayBilling.isReady() as BillingStatus;
        applyBillingStatus(status);

        if (!status.ready) {
          updateSharedBillingState((state) => {
            state.products = {};
          });
          trackEvent('billing_status', {
            ready: false,
            products_loaded: 0,
            response_code: status.responseCode,
            debug_message: status.debugMessage,
          });
          return;
        }

        await loadProducts();
      } catch (error) {
        console.error('Error setting up billing:', error);
        updateSharedBillingState((state) => {
          state.products = {};
        });
        trackEvent('billing_error', { error: String(error), phase: 'setup' });
      }
    };

    if (!billingSetupStarted) {
      billingSetupStarted = true;
      void setupBilling();
    }

    if (billingListenersAttached) return;
    billingListenersAttached = true;

    void GooglePlayBilling.addListener('billingReady', async (status) => {
      const typedStatus = status as BillingStatus;
      applyBillingStatus(typedStatus);

      if (!typedStatus.ready) {
        updateSharedBillingState((state) => {
          state.products = {};
        });
        trackEvent('billing_status', {
          ready: false,
          products_loaded: 0,
          response_code: typedStatus.responseCode,
          debug_message: typedStatus.debugMessage,
        });
        return;
      }

      try {
        await loadProducts();
      } catch (error) {
        console.error('Error loading products after billingReady:', error);
        updateSharedBillingState((state) => {
          state.products = {};
        });
        trackEvent('billing_error', { error: String(error), phase: 'billingReady' });
      }
    });

    void GooglePlayBilling.addListener('purchaseCompleted', async (purchase) => {
      console.log('Purchase completed (listener):', purchase);
      if (purchase.purchaseToken && purchaseInitiatedByUser.has(purchase.purchaseToken)) {
        console.log('[PURCHASE] Skipping listener — already handled by purchase()');
        purchaseInitiatedByUser.delete(purchase.purchaseToken);
        return;
      }
      await verifyAndProcessPurchase(purchase);
    });

    void GooglePlayBilling.addListener('purchaseCancelled', ({ error, responseCode, debugMessage, stage, productId: nativeProductId }) => {
      // Only track from native listener — the catch block in purchase() already handles user-initiated cancellations
      // This avoids duplicate purchase_cancelled events
      const resolvedProductId = nativeProductId ?? lastAttemptedProductId ?? 'unknown';
      trackEvent('purchase_cancelled_native', {
        platform: 'android',
        product: resolvedProductId,
        productId: resolvedProductId,
        response_code: responseCode,
        debug_message: debugMessage,
        stage,
      });
    });

    void GooglePlayBilling.addListener('purchaseError', ({ error, responseCode, debugMessage, stage, productId: nativeProductId }) => {
      const resolvedProductId = nativeProductId ?? lastAttemptedProductId ?? 'unknown';
      trackEvent('purchase_error', {
        platform: 'android',
        product: resolvedProductId,
        productId: resolvedProductId,
        error,
        response_code: responseCode,
        debug_message: debugMessage,
        stage,
      });
    });

    void GooglePlayBilling.addListener('purchasePending', ({ productId }) => {
      trackEvent('purchase_pending', { platform: 'android', product: productId });
      toast.info('Compra pendiente de confirmación de pago');
    });
  }, [isAndroid, loadProducts, verifyAndProcessPurchase, applyBillingStatus]);

  const purchase = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAndroid) {
      console.warn('Google Play Billing only available on Android');
      return false;
    }

    if (purchaseInFlightProduct) {
      trackEvent('purchase_blocked', {
        platform: 'android',
        product: productId,
        reason: 'purchase_in_progress',
        active_product: purchaseInFlightProduct,
      });
      toast.info('Ya hay una compra en curso. Espera un momento.');
      return false;
    }

    let cachedProducts = sharedBillingState.products;

    if (!sharedBillingState.isReady || Object.keys(cachedProducts).length === 0) {
      trackEvent('billing_recovery_attempt', {
        platform: 'android',
        product: productId,
        was_ready: sharedBillingState.isReady,
        products_loaded: Object.keys(cachedProducts).length,
        response_code: sharedBillingState.billingStatus.responseCode,
        debug_message: sharedBillingState.billingStatus.debugMessage,
      });

      const refreshedBilling = await refreshBillingState();
      cachedProducts = refreshedBilling.products;

      if (!refreshedBilling.ready) {
        toast.error('Google Play no está disponible ahora mismo. Abre Play Store y vuelve a intentarlo en unos segundos.');
        trackEvent('purchase_blocked', {
          platform: 'android',
          product: productId,
          reason: 'billing_not_ready',
          response_code: refreshedBilling.responseCode,
          debug_message: refreshedBilling.debugMessage,
        });
        return false;
      }
    }

    const candidates = getGooglePlayCandidates(productId);

    purchaseInFlightProduct = productId;
    updateSharedBillingState((state) => {
      state.loading = true;
    });
    lastAttemptedProductId = productId;
    trackEvent('gp_purchase_flow_start', { product: productId, google_candidates: candidates.join(',') });

    let purchaseFlowStarted = false;

    try {
      let googlePlayProductId = resolveGooglePlayProductId(productId, cachedProducts);

      if (!googlePlayProductId) {
        trackEvent('gp_purchase_reload_products', {
          product: productId,
          google_candidates: candidates.join(','),
        });
        cachedProducts = await loadProducts();
        googlePlayProductId = resolveGooglePlayProductId(productId, cachedProducts);
      }

      if (!googlePlayProductId) {
        try {
          const directProductDetails = await queryFirstAvailableCandidate(candidates);
          if (Object.keys(directProductDetails).length > 0) {
            cachedProducts = { ...cachedProducts, ...directProductDetails };
            updateSharedBillingState((state) => {
              state.products = { ...state.products, ...directProductDetails };
            });
            googlePlayProductId = resolveGooglePlayProductId(productId, cachedProducts);
          }
        } catch (directQueryError) {
          trackEvent('billing_error', {
            error: String(directQueryError),
            phase: 'direct_product_query',
            product: productId,
          });
        }
      }

      if (!googlePlayProductId) {
        toast.error('No pudimos cargar el producto desde Google Play. Vuelve a intentarlo en unos segundos.');
        trackEvent('purchase_blocked', {
          platform: 'android',
          product: productId,
          reason: 'product_not_loaded',
          requested_candidates: candidates.join(','),
          available_products: Object.keys(cachedProducts).join(','),
        });
        return false;
      }

      purchaseFlowStarted = true;
      window.dispatchEvent(new Event('purchase_loading_start'));
      trackEvent('gp_native_call_start', { product: productId, google_id: googlePlayProductId });
      const result = await GooglePlayBilling.purchase({ productId: googlePlayProductId });
      trackEvent('gp_native_call_success', {
        product: productId,
        google_id: googlePlayProductId,
        has_token: !!result?.purchaseToken,
      });
      if (result?.purchaseToken) {
        purchaseInitiatedByUser.add(result.purchaseToken);
      }
      return await verifyAndProcessPurchase(result, productId);
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg?.includes('cancelled') || errorMsg?.includes('Cancel') || errorMsg?.includes('pending')) {
        if (errorMsg?.includes('pending')) {
          return false;
        }

        reportPurchaseCancelled(productId, errorMsg, 'purchase_call');
        toast.info('Compra cancelada');
      } else {
        console.error('Purchase error:', error);
        toast.error('Error al realizar la compra');
        trackEvent('purchase_error', {
          platform: 'android',
          product: productId,
          error: errorMsg,
          source: 'purchase_call',
        });
      }
      return false;
    } finally {
      purchaseInFlightProduct = null;
      if (purchaseFlowStarted) {
        window.dispatchEvent(new Event('purchase_loading_end'));
      }
      updateSharedBillingState((state) => {
        state.loading = false;
      });
    }
  }, [isAndroid, loadProducts, verifyAndProcessPurchase, queryFirstAvailableCandidate, refreshBillingState]);

  const getProductPrice = useCallback((productId: string): string | null => {
    const resolvedProductId = resolveGooglePlayProductId(productId, products);
    if (!resolvedProductId) return null;
    return products[resolvedProductId]?.price || null;
  }, [products]);

  return {
    isAvailable: isAndroid && isReady && hasLoadedProducts,
    isAndroid,
    products,
    loading,
    purchase,
    getProductPrice,
  };
};