import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useGooglePlayBilling } from './useGooglePlayBilling';
import { toast } from 'sonner';

import { trackEvent } from '@/lib/trackEvent';

const PENDING_PRODUCT_KEY = 'stripe_pending_product';

/**
 * Hook unificado de pagos:
 * - Android: Google Play Billing (INAPP consumables)
 * - Web: Stripe Checkout
 */
export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const googlePlayBilling = useGooglePlayBilling();

  const isAndroid = Capacitor.getPlatform() === 'android';
  const isWeb = Capacitor.getPlatform() === 'web';

  const createPayment = async (productId: string): Promise<boolean> => {
    setLoading(true);

    try {
      // Android → Google Play Billing
      if (isAndroid) {
        trackEvent('payment_bridge_start', {
          product: productId,
          platform: 'android',
          billing_available: googlePlayBilling.isAvailable,
        });

        try {
          const success = await googlePlayBilling.purchase(productId);
          trackEvent('payment_bridge_result', { product: productId, platform: 'android', success });
          return success;
        } catch (gpError: any) {
          trackEvent('payment_bridge_error', {
            product: productId,
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
      });

      if (error) throw error;

      if (data?.url) {
        // ✅ CRITICAL: Save productId BEFORE redirecting to Stripe
        localStorage.setItem(PENDING_PRODUCT_KEY, JSON.stringify({
          productId,
          timestamp: Date.now(),
        }));
        console.log('[PAYMENT] Saved pending product before Stripe redirect:', productId);
        toast.success('Redirigiendo a la pasarela de pago...');
        window.location.assign(data.url);
        return false;
      }

      return false;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      trackEvent('payment_bridge_error', { product: productId, platform: isAndroid ? 'android' : 'web', error: error?.message });
      toast.error('Error al crear el pago: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get the display price for a product (from Google Play or fallback)
  const getPrice = (productId: string, fallbackPrice: string): string => {
    if (isAndroid && googlePlayBilling.isAvailable) {
      const googlePrice = googlePlayBilling.getProductPrice(productId);
      if (googlePrice) return googlePrice;
    }
    return fallbackPrice;
  };

  return {
    createPayment,
    getPrice,
    loading: loading || googlePlayBilling.loading,
    isAndroid,
    isWeb,
    isGooglePlayAvailable: googlePlayBilling.isAvailable,
  };
};
