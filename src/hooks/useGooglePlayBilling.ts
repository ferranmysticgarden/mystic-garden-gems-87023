import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import GooglePlayBilling, { ProductDetails, PurchaseResult } from '@/plugins/GooglePlayBilling';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mapeo de IDs de producto a IDs de Google Play
const GOOGLE_PLAY_PRODUCT_IDS: Record<string, string> = {
  'quick_pack': 'quick_pack',
  'gems_100': 'gems_100',
  'gems_300': 'gems_300',
  'gems_1200': 'gems_1200',
  'no_ads_month': 'no_ads_month',
  'no_ads_forever': 'no_ads_forever',
  'garden_pass': 'garden_pass',
  'flash_offer': 'flash_offer',
  'victory_multiplier': 'victory_multiplier',
  'finish_level': 'finish_level',
  'starter_pack': 'starter_pack',
  'continue_game': 'continue_game',
  'buy_moves': 'buy_moves',
  'reward_doubler': 'reward_doubler',
  'pack_victoria_segura': 'pack_victoria_segura',
  'pack_racha_infinita': 'pack_racha_infinita',
  'extra_spin': 'extra_spin',
  'streak_protection': 'streak_protection',
  'lifesaver_pack': 'lifesaver_pack',
};

export const useGooglePlayBilling = () => {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<Record<string, ProductDetails>>({});
  const [loading, setLoading] = useState(false);

  const isAndroid = Capacitor.getPlatform() === 'android';

  useEffect(() => {
    if (!isAndroid) return;

    const setupBilling = async () => {
      try {
        // Check if billing is ready
        const { ready } = await GooglePlayBilling.isReady();
        setIsReady(ready);

        if (ready) {
          // Query all products
          const productIds = Object.values(GOOGLE_PLAY_PRODUCT_IDS);
          const productDetails = await GooglePlayBilling.queryProducts({ productIds });
          setProducts(productDetails);
        }
      } catch (error) {
        console.error('Error setting up billing:', error);
      }
    };

    setupBilling();

    // Listen for billing ready event
    const readyListener = GooglePlayBilling.addListener('billingReady', async ({ ready }) => {
      setIsReady(ready);
      if (ready) {
        const productIds = Object.values(GOOGLE_PLAY_PRODUCT_IDS);
        const productDetails = await GooglePlayBilling.queryProducts({ productIds });
        setProducts(productDetails);
      }
    });

    // Listen for purchase completed
    const purchaseListener = GooglePlayBilling.addListener('purchaseCompleted', async (purchase) => {
      console.log('Purchase completed:', purchase);
      await verifyAndProcessPurchase(purchase);
    });

    return () => {
      readyListener.then(l => l.remove());
      purchaseListener.then(l => l.remove());
    };
  }, [isAndroid]);

  const verifyAndProcessPurchase = async (purchase: PurchaseResult) => {
    try {
      // Verify purchase on server and grant items
      const { error } = await supabase.functions.invoke('verify-google-purchase', {
        body: {
          purchaseToken: purchase.purchaseToken,
          productId: purchase.productId,
          orderId: purchase.orderId,
        },
      });

      if (error) {
        console.error('Error verifying purchase:', error);
        toast.error('Error al verificar la compra');
        return false;
      }

      toast.success('¡Compra completada!');
      return true;
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Error al procesar la compra');
      return false;
    }
  };

  const purchase = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAndroid) {
      console.warn('Google Play Billing only available on Android');
      return false;
    }

    if (!isReady) {
      toast.error('Sistema de pagos no disponible');
      return false;
    }

    const googlePlayProductId = GOOGLE_PLAY_PRODUCT_IDS[productId];
    if (!googlePlayProductId) {
      toast.error('Producto no encontrado');
      return false;
    }

    setLoading(true);
    try {
      const result = await GooglePlayBilling.purchase({ productId: googlePlayProductId });
      await verifyAndProcessPurchase(result);
      return true;
    } catch (error: any) {
      if (error.message?.includes('cancelled')) {
        toast.info('Compra cancelada');
      } else {
        console.error('Purchase error:', error);
        toast.error('Error al realizar la compra');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAndroid, isReady]);

  const getProductPrice = useCallback((productId: string): string | null => {
    const googlePlayProductId = GOOGLE_PLAY_PRODUCT_IDS[productId];
    if (!googlePlayProductId) return null;
    return products[googlePlayProductId]?.price || null;
  }, [products]);

  return {
    isAvailable: isAndroid && isReady,
    isAndroid,
    products,
    loading,
    purchase,
    getProductPrice,
  };
};
