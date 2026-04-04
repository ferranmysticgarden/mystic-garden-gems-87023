import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useGooglePlayBilling } from './useGooglePlayBilling';
import { toast } from 'sonner';
import { PRODUCTS } from '@/data/products';

import { trackEvent } from '@/lib/trackEvent';

const PENDING_PRODUCT_KEY = 'stripe_pending_product';
let activePaymentProduct: string | null = null;
let stripeRedirectInProgress = false;
const paymentLoadingSubscribers = new Set<(productId: string | null) => void>();

const broadcastPaymentLoading = () => {
  paymentLoadingSubscribers.forEach((listener) => listener(activePaymentProduct));
};

const getProductFallbackPrice = (productId: string, fallbackPrice?: string): string => {
  const product = PRODUCTS.find((item) => item.id === productId);
  if (product) {
    return `€${product.price.toFixed(2)}`;
  }

  return fallbackPrice ?? 'Precio no disponible';
};

/**
 * Hook unificado de pagos:
 * - Android: Google Play Billing (INAPP consumables)
 * - Web: Stripe Checkout
 */
export const usePayment = () => {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(activePaymentProduct);
  const googlePlayBilling = useGooglePlayBilling();

  const isAndroid = Capacitor.getPlatform() === 'android';
  const isWeb = Capacitor.getPlatform() === 'web';

  useEffect(() => {
    paymentLoadingSubscribers.add(setLoadingProduct);
    setLoadingProduct(activePaymentProduct);

    return () => {
      paymentLoadingSubscribers.delete(setLoadingProduct);
    };
  }, []);

  const createPayment = async (productId: string, source?: string): Promise<boolean> => {
    if (activePaymentProduct) {
      trackEvent('payment_bridge_blocked', {
        product: productId,
        productId,
        platform: isAndroid ? 'android' : 'web',
        active_product: activePaymentProduct,
        activeProductId: activePaymentProduct,
        reason: 'payment_in_progress',
      });
      toast.info('Ya hay un pago en curso. Espera un momento.');
      return false;
    }

    trackEvent('purchase_attempt', {
      product: productId,
      productId,
      source: source || 'unknown',
      platform: isAndroid ? 'android' : 'web',
      billing_available: isAndroid ? googlePlayBilling.isAvailable : 'web',
    });

    activePaymentProduct = productId;
    stripeRedirectInProgress = false;
    broadcastPaymentLoading();

    try {
      if (isAndroid) {
        trackEvent('payment_bridge_start', {
          product: productId,
          productId,
          platform: 'android',
          billing_available: googlePlayBilling.isAvailable,
        });

        try {
          const success = await googlePlayBilling.purchase(productId);
          trackEvent('payment_bridge_result', { product: productId, productId, platform: 'android', success });
          return success;
        } catch (gpError: any) {
          trackEvent('payment_bridge_error', {
            product: productId,
            productId,
            platform: 'android',
            error: gpError instanceof Error ? gpError.message : String(gpError),
          });
          console.error('[PAYMENT] Google Play purchase threw:', gpError);
          toast.error('Error en la compra. Inténtalo de nuevo.');
          return false;
        }
      }

      // Web → Stripe
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.dispatchEvent(new CustomEvent('request_login', { detail: { reason: 'purchase' } }));
        return false;
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // ✅ CRITICAL: Save productId BEFORE redirecting to Stripe
        localStorage.setItem(PENDING_PRODUCT_KEY, JSON.stringify({
          productId,
          timestamp: Date.now(),
        }));
        stripeRedirectInProgress = true;
        console.log('[PAYMENT] Saved pending product before Stripe redirect:', productId);
        toast.success('Redirigiendo a la pasarela de pago...');
        window.location.assign(data.url);
        return false;
      }

      return false;
    } catch (error: any) {
      stripeRedirectInProgress = false;
      console.error('Error creating payment:', error);
      trackEvent('payment_bridge_error', { product: productId, platform: isAndroid ? 'android' : 'web', error: error?.message });
      toast.error('Error al crear el pago: ' + error.message);
      return false;
    } finally {
      if (!stripeRedirectInProgress) {
        activePaymentProduct = null;
        broadcastPaymentLoading();
      }
    }
  };

  // Get the display price for a product (from Google Play or fallback)
  const getPrice = (productId: string, fallbackPrice: string): string => {
    if (isAndroid) {
      const googlePrice = googlePlayBilling.getProductPrice(productId);
      if (googlePrice) return googlePrice;
      return getProductFallbackPrice(productId, fallbackPrice);
    }
    return getProductFallbackPrice(productId, fallbackPrice);
  };

  return {
    createPayment,
    getPrice,
    loading: Boolean(loadingProduct) || googlePlayBilling.loading,
    loadingProduct,
    isAndroid,
    isWeb,
    isGooglePlayAvailable: googlePlayBilling.isAvailable,
  };
};
