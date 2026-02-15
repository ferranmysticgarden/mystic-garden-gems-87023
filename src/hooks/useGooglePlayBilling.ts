import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import GooglePlayBilling, { ProductDetails, PurchaseResult } from '@/plugins/GooglePlayBilling';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dispatchPurchaseCompleted } from './usePurchaseGate';

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
  'welcome_pack': 'welcome_pack',
  // Ofertas de nivel
  'victory_multiplier': 'victory_multiplier',
  'finish_level': 'finish_level',
  'continue_game': 'continue_game',
  'buy_moves': 'buy_moves',
  // Micro-transacciones €0.49-€0.50
  'streak_protection': 'streak_protection',
  'extra_spin': 'extra_spin',
  'reward_doubler': 'reward_doubler',
  // Multi-tier packs
  'pack_impulso': 'pack_impulso',
  'pack_experiencia': 'pack_experiencia',
  'pack_victoria_segura_pro': 'pack_victoria_segura_pro',
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

      console.log('[PURCHASE] success confirmed via Google Play');
      dispatchPurchaseCompleted();
      console.log('[PURCHASE] gate unlocked');
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
