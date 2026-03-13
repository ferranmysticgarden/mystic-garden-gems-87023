import { useState, useEffect, useCallback, useRef } from 'react';
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

export const useGooglePlayBilling = () => {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<Record<string, ProductDetails>>({});
  const [loading, setLoading] = useState(false);
  const verificationTasksRef = useRef<Map<string, Promise<boolean>>>(new Map());

  const isAndroid = Capacitor.getPlatform() === 'android';
  const hasLoadedProducts = Object.keys(products).length > 0;

  const loadProducts = useCallback(async (retryCount = 0): Promise<Record<string, ProductDetails>> => {
    const productIds = getGooglePlayQueryProductIds();
    try {
      const productDetails = await GooglePlayBilling.queryProducts({ productIds });
      setProducts(productDetails);
      trackEvent('billing_status', {
        ready: Object.keys(productDetails).length > 0,
        products_loaded: Object.keys(productDetails).length,
      });
      return productDetails;
    } catch (error) {
      console.error('Error loading products (attempt ' + (retryCount + 1) + '):', error);
      trackEvent('billing_error', { error: String(error), attempt: retryCount + 1 });
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 1500 * (retryCount + 1)));
        return loadProducts(retryCount + 1);
      }
      setProducts({});
      return {};
    }
  }, []);

  useEffect(() => {
    if (!isAndroid) return;

    const setupBilling = async () => {
      try {
        const { ready } = await GooglePlayBilling.isReady();
        setIsReady(ready);

        if (!ready) {
          setProducts({});
          trackEvent('billing_status', { ready: false, products_loaded: 0 });
          return;
        }

        await loadProducts();
      } catch (error) {
        console.error('Error setting up billing:', error);
        setProducts({});
        trackEvent('billing_error', { error: String(error), phase: 'setup' });
      }
    };

    setupBilling();

    const readyListener = GooglePlayBilling.addListener('billingReady', async ({ ready }) => {
      setIsReady(ready);

      if (!ready) {
        setProducts({});
        trackEvent('billing_status', { ready: false, products_loaded: 0 });
        return;
      }

      try {
        await loadProducts();
      } catch (error) {
        console.error('Error loading products after billingReady:', error);
        setProducts({});
        trackEvent('billing_error', { error: String(error), phase: 'billingReady' });
      }
    });

    const purchaseListener = GooglePlayBilling.addListener('purchaseCompleted', async (purchase) => {
      console.log('Purchase completed:', purchase);
      await verifyAndProcessPurchase(purchase);
    });

    const cancelListener = GooglePlayBilling.addListener('purchaseCancelled', () => {
      trackEvent('purchase_cancelled', { platform: 'android' });
    });

    const errorListener = GooglePlayBilling.addListener('purchaseError', ({ error }) => {
      trackEvent('purchase_error', { platform: 'android', error });
    });

    const pendingListener = GooglePlayBilling.addListener('purchasePending', ({ productId }) => {
      trackEvent('purchase_pending', { platform: 'android', product: productId });
      toast.info('Compra pendiente de confirmación de pago');
    });

    return () => {
      readyListener.then(l => l.remove());
      purchaseListener.then(l => l.remove());
      cancelListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      pendingListener.then(l => l.remove());
    };
  }, [isAndroid, loadProducts]);

  const verifyAndProcessPurchase = useCallback((purchase: PurchaseResult): Promise<boolean> => {
    const purchaseToken = purchase.purchaseToken;

    if (!purchaseToken) {
      trackEvent('purchase_verification_failed', {
        platform: 'android',
        product: purchase.productId,
        reason: 'missing_purchase_token',
      });
      return Promise.resolve(false);
    }

    const existingTask = verificationTasksRef.current.get(purchaseToken);
    if (existingTask) {
      return existingTask;
    }

    const verificationTask = (async () => {
      try {
        trackEvent('purchase_verification_started', {
          platform: 'android',
          product: purchase.productId,
        });

        const { data, error } = await supabase.functions.invoke('verify-google-purchase', {
          body: {
            purchaseToken: purchase.purchaseToken,
            productId: purchase.productId,
            orderId: purchase.orderId,
            packageName: purchase.packageName,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Purchase verification failed');
        }

        // Verification succeeded — NOW consume the purchase on Google Play
        try {
          await GooglePlayBilling.consumePurchase({ purchaseToken });
          console.log('[PURCHASE] ✅ Consumed after server verification');
        } catch (consumeError) {
          // Log but don't fail — rewards already granted server-side
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
          product: purchase.productId,
          guest: Boolean(data?.isGuest),
        });
        dispatchPurchaseCompleted(purchase.productId);
        console.log('[PURCHASE] gate unlocked');
        toast.success('¡Compra completada!');
        return true;
      } catch (error) {
        verificationTasksRef.current.delete(purchaseToken);
        console.error('Error processing purchase:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isPermission403 = errorMessage.includes('Google Play API 403');
        const normalizedError = errorMessage.toLowerCase();
        const isServiceDisabled =
          normalizedError.includes('api desactivada') ||
          normalizedError.includes('service_disabled') ||
          normalizedError.includes('accessnotconfigured') ||
          normalizedError.includes('api has not been used');
        const isInvalidCredentials =
          normalizedError.includes('google play api error: 401') ||
          normalizedError.includes('invalid_grant') ||
          normalizedError.includes('invalid credentials') ||
          normalizedError.includes('invalid_client') ||
          normalizedError.includes('invalid jwt') ||
          normalizedError.includes('cuenta de servicio');

        trackEvent('purchase_verification_failed', {
          platform: 'android',
          product: purchase.productId,
          error: errorMessage,
        });

        toast.error(
          isServiceDisabled
            ? 'Compra bloqueada: activa Google Play Android Developer API del proyecto de la cuenta de servicio y espera 5 minutos.'
            : isPermission403
              ? 'Compra bloqueada por permisos de Google Play (API 403). Revisa acceso API, Gestionar pedidos y Ver datos financieros.'
              : isInvalidCredentials
                ? 'Compra bloqueada: credenciales de Google Play inválidas o cuenta de servicio sin acceso. Revisa GOOGLE_PLAY_SERVICE_ACCOUNT y el acceso API en Google Play Console.'
                : 'Error al procesar la compra'
        );
        return false;
      }
    })();

    verificationTasksRef.current.set(purchaseToken, verificationTask);
    return verificationTask;
  }, []);

  const purchase = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAndroid) {
      console.warn('Google Play Billing only available on Android');
      return false;
    }

    if (!isReady) {
      toast.error('Sistema de pagos no disponible');
      trackEvent('purchase_blocked', { platform: 'android', product: productId, reason: 'billing_not_ready' });
      return false;
    }

    const candidates = getGooglePlayCandidates(productId);

    setLoading(true);
    trackEvent('gp_purchase_flow_start', { product: productId, google_candidates: candidates.join(',') });

    try {
      let cachedProducts = products;
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
          const directProductDetails = await GooglePlayBilling.queryProducts({ productIds: candidates });
          if (Object.keys(directProductDetails).length > 0) {
            cachedProducts = { ...cachedProducts, ...directProductDetails };
            setProducts((prev) => ({ ...prev, ...directProductDetails }));
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
        toast.error('Producto no encontrado en Google Play');
        trackEvent('purchase_blocked', {
          platform: 'android',
          product: productId,
          reason: 'product_not_loaded',
          requested_candidates: candidates.join(','),
          available_products: Object.keys(cachedProducts).join(','),
        });
        return false;
      }

      trackEvent('gp_native_call_start', { product: productId, google_id: googlePlayProductId });
      const result = await GooglePlayBilling.purchase({ productId: googlePlayProductId });
      trackEvent('gp_native_call_success', {
        product: productId,
        google_id: googlePlayProductId,
        has_token: !!result?.purchaseToken,
      });
      return await verifyAndProcessPurchase(result);
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg?.includes('cancelled') || errorMsg?.includes('Cancel') || errorMsg?.includes('pending')) {
        if (errorMsg?.includes('pending')) {
          toast.info('Compra pendiente de pago');
          trackEvent('purchase_pending', { platform: 'android', product: productId });
        } else {
          toast.info('Compra cancelada');
          trackEvent('purchase_cancelled', { platform: 'android', product: productId, error: errorMsg });
        }
      } else {
        console.error('Purchase error:', error);
        toast.error('Error al realizar la compra');
        trackEvent('purchase_error', {
          platform: 'android',
          product: productId,
          error: errorMsg,
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAndroid, isReady, products, loadProducts, verifyAndProcessPurchase]);

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
