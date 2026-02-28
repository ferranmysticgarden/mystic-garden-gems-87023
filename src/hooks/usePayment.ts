import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useGooglePlayBilling } from './useGooglePlayBilling';
import { toast } from 'sonner';
import { dispatchPurchaseCompleted } from './usePurchaseGate';

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
        if (googlePlayBilling.isAvailable) {
          const success = await googlePlayBilling.purchase(productId);
          return success;
        }
        
        // Google Play Billing NO está disponible en Android
        // NO caer a Stripe — los guests no pueden pagar por Stripe
        console.error('[PAYMENT] Google Play Billing not available on Android. Purchase blocked.');
        toast.error('Compras no disponibles ahora. Reinicia la app e inténtalo de nuevo.');
        return false;
      }

      // Web → Stripe (solo plataforma web)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Guest user — dispatch event so Index shows LoginPrompt
        window.dispatchEvent(new CustomEvent('request_login', { detail: { reason: 'purchase' } }));
        return false;
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId },
      });

      if (error) throw error;

      if (data?.url) {
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
