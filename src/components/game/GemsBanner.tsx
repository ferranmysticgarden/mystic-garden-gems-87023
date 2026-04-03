import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { trackEvent } from '@/lib/trackEvent';

interface GemsBannerProps {
  onPurchased?: () => void;
  onPurchaseSuccess?: () => void;
}

export const GemsBanner = ({ onPurchased, onPurchaseSuccess }: GemsBannerProps) => {
  const { createPayment, loading, getPrice, isGooglePlayAvailable, isAndroid } = usePayment();
  const price = getPrice('welcome_pack', '€0.50');
  const hasTracked = useRef(false);

  // Track offer impression once — to BOTH Firebase and Supabase
  useEffect(() => {
    if (!hasTracked.current && localStorage.getItem('first_purchase_completed') !== 'true') {
      hasTracked.current = true;
      emitAnalyticsEvent('first_purchase_offer_shown', { product: 'gems_banner' });
      // Direct to DB — bypasses broken native Firebase plugin
      trackEvent('offer_shown', { 
        product: 'gems_banner',
        billing_available: isAndroid ? isGooglePlayAvailable : 'web',
      });
    }
  }, [isAndroid, isGooglePlayAvailable]);

  const handleBuy = async () => {
    const success = await createPayment('welcome_pack', 'gems_banner');
    if (success) {
      onPurchaseSuccess?.();
      onPurchased?.();
    }
  };

  // Don't show if already purchased
  if (localStorage.getItem('first_purchase_completed') === 'true') return null;

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="w-full mb-3 bg-gradient-to-r from-yellow-500/90 via-amber-500/90 to-orange-500/90 rounded-xl p-2.5 flex items-center justify-between group hover:from-yellow-600/90 hover:via-amber-600/90 hover:to-orange-600/90 transition-all border border-yellow-300/50 shadow-lg shadow-yellow-500/20"
    >
      <div className="flex items-center gap-2">
        <div className="bg-yellow-300/20 rounded-full p-1.5">
          <Sparkles className="w-5 h-5 text-yellow-200" />
        </div>
        <div className="text-left">
          <p className="text-white font-bold text-xs leading-tight">
            💎 +5 Movimientos +3 Boosters
          </p>
          <p className="text-yellow-100/70 text-[10px]">
            Pack Bienvenida · Oferta especial
          </p>
        </div>
      </div>
      <div className="bg-white/20 rounded-lg px-3 py-1.5 group-hover:bg-white/30 transition-colors">
        <span className="text-white font-bold text-sm">
          {loading ? '...' : price}
        </span>
      </div>
    </button>
  );
};
