import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import GooglePlayBilling, { ProductDetails, PurchaseResult } from '@/plugins/GooglePlayBilling';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dispatchPurchaseCompleted } from './usePurchaseGate';
import { trackEvent } from '@/lib/trackEvent';

// Mapeo de IDs de producto a IDs de Google Play
// SINCRONIZADO con Google Play Console (15 productos activos)
const GOOGLE_PLAY_PRODUCT_IDS: Record<string, string> = {
  // Cofres
  'chest_gold': 'chest_gold',
  'chest_silver': 'chest_silver',
  'chest_wooden': 'chest_wooden',
  // Packs principales
  'mega_pack_inicial': 'mega_pack_inicial',
  'starter_pack': 'starter_pack',
  'flash_offer': 'flash_offer',
  'pack_revancha': 'pack_revancha',
  'lifesaver_pack': 'lifesaver_pack',
  'welcome_pack': 'welcomepack',
  // Ofertas de nivel
  'victory_multiplier': 'victory_multiplier',
  'finish_level': 'finish_level',
  'continue_game': 'continue_game',
  'buy_moves': 'buy_moves',
  // Micro-transacciones €0.49-€0.50
  'streak_protection': 'streak_protection',
  'extra_spin': 'extra_spin',
  'reward_doubler': 'reward_doubler',
  // Multi-tier packs (Google Play: sin guion bajo)
  'pack_impulso': 'packimpulso',
  'pack_experiencia': 'packexperiencia',
  'pack_victoria_segura_pro': 'packvictoriasegura',
  // 7 nuevos productos (10 mar 2026) — Google Play: sin guion bajo
  'quick_pack': 'quickpack',
  'gems_100': 'gems100',
  'gems_300': 'gems300',
  'gems_1200': 'gems1200',
  'no_ads_month': 'noadsmonth',
  'no_ads_forever': 'noadsforever',
  'garden_pass': 'gardenpass',
};

export const useGooglePlayBilling = () => {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<Record<string, ProductDetails>>({});
  const [loading, setLoading] = useState(false);
  const processedTokensRef = useRef(new Set<string>());

  const isAndroid = Capacitor.getPlatform() === 'android';
  const hasLoadedProducts = Object.keys(products).length > 0;

  const loadProducts = useCallback(async (retryCount = 0): Promise<Record<string, ProductDetails>> => {
    const productIds = Object.values(GOOGLE_PLAY_PRODUCT_IDS);
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
      // Retry up to 2 times with delay for "internal error" / "disconnected"
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

    return () => {
      readyListener.then(l => l.remove());
      purchaseListener.then(l => l.remove());
      cancelListener.then(l => l.remove());
      errorListener.then(l => l.remove());
    };
  }, [isAndroid, loadProducts]);

  const verifyAndProcessPurchase = useCallback(async (purchase: PurchaseResult) => {
    const purchaseToken = purchase.purchaseToken;

    if (!purchaseToken) {
      trackEvent('purchase_verification_failed', {
        platform: 'android',
        product: purchase.productId,
        reason: 'missing_purchase_token',
      });
      return false;
    }

    if (processedTokensRef.current.has(purchaseToken)) {
      return true;
    }

    processedTokensRef.current.add(purchaseToken);

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
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Purchase verification failed');
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
      processedTokensRef.current.delete(purchaseToken);
      console.error('Error processing purchase:', error);
      trackEvent('purchase_verification_failed', {
        platform: 'android',
        product: purchase.productId,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Error al procesar la compra');
      return false;
    }
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

    const googlePlayProductId = GOOGLE_PLAY_PRODUCT_IDS[productId];
    if (!googlePlayProductId) {
      toast.error('Producto no encontrado');
      trackEvent('purchase_blocked', { platform: 'android', product: productId, reason: 'unknown_product_mapping' });
      return false;
    }

    setLoading(true);
    trackEvent('gp_purchase_flow_start', { product: productId, google_id: googlePlayProductId });
    try {
      let cachedProducts = products;

      if (!cachedProducts[googlePlayProductId]) {
        trackEvent('gp_purchase_reload_products', { product: productId, google_id: googlePlayProductId });
        cachedProducts = await loadProducts();
      }

      if (!cachedProducts[googlePlayProductId]) {
        toast.error('El producto aún no está listo. Inténtalo de nuevo en unos segundos.');
        trackEvent('purchase_blocked', {
          platform: 'android',
          product: productId,
          google_product_id: googlePlayProductId,
          reason: 'product_not_loaded',
          available_products: Object.keys(cachedProducts).join(','),
        });
        return false;
      }

      trackEvent('gp_native_call_start', { product: productId, google_id: googlePlayProductId });
      const result = await GooglePlayBilling.purchase({ productId: googlePlayProductId });
      trackEvent('gp_native_call_success', { product: productId, google_id: googlePlayProductId, has_token: !!result?.purchaseToken });
      return await verifyAndProcessPurchase(result);
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg?.includes('cancelled') || errorMsg?.includes('Cancel')) {
        toast.info('Compra cancelada');
        trackEvent('purchase_cancelled', { platform: 'android', product: productId, error: errorMsg });
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
    const googlePlayProductId = GOOGLE_PLAY_PRODUCT_IDS[productId];
    if (!googlePlayProductId) return null;
    return products[googlePlayProductId]?.price || null;
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
