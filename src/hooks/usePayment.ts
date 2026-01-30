import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useGooglePlayBilling } from './useGooglePlayBilling';
import { toast } from 'sonner';

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
      if (isAndroid && googlePlayBilling.isAvailable) {
        const success = await googlePlayBilling.purchase(productId);
        return success;
      }

      // Web → Stripe
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Debes iniciar sesión para realizar una compra');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, '_blank');
        toast.success('Redirigiendo a la pasarela de pago...');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error creating payment:', error);
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
