import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Purchase {
  id: string;
  user_id: string;
  product_id: string;
  expires_at: string | null;
  created_at: string;
}

export const usePurchases = (user: User | null) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPurchases([]);
      setLoading(false);
      return;
    }

    loadPurchases();
  }, [user]);

  const loadPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPurchase = async (productId: string, expiresInDays?: number) => {
    if (!user) return;

    try {
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('user_purchases')
        .insert({
          user_id: user.id,
          product_id: productId,
          expires_at: expiresAt,
        });

      if (error) throw error;
      await loadPurchases();
    } catch (error) {
      console.error('Error adding purchase:', error);
    }
  };

  const hasActiveProduct = (productId: string): boolean => {
    // Check both raw and prefixed product IDs (stripe_ and gp_)
    const purchase = purchases.find(p => 
      p.product_id === productId || 
      p.product_id === `stripe_${productId}` ||
      (p.product_id.startsWith(`gp_`) && p.product_id.includes(productId))
    );
    if (!purchase) return false;
    
    if (!purchase.expires_at) return true; // Forever purchase
    
    return new Date(purchase.expires_at) > new Date();
  };

  const hasAdsDisabled = (): boolean => {
    return hasActiveProduct('no_ads_month') || 
           hasActiveProduct('no_ads_forever') || 
           hasActiveProduct('garden_pass');
  };

  return {
    purchases,
    loading,
    addPurchase,
    hasActiveProduct,
    hasAdsDisabled,
  };
};
