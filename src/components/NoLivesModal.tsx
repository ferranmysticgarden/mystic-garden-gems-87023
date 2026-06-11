import { useEffect, useRef, useState } from 'react';
import { Gem, Heart, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { usePayment } from '@/hooks/usePayment';
import { trackEvent } from '@/lib/trackEvent';
import { hasPurchasedStarterGems } from '@/utils/purchaseUtils';
import { OfferCountdownTimer } from '@/components/offers/OfferCountdownTimer';
import { DiscountPrice } from '@/components/offers/DiscountPrice';
import { PhotoTilesPreview } from '@/components/offers/PhotoTilesPreview';
import { markOfferDismissed } from '@/utils/offerCooldown';

const OFFER_ID = 'no_lives_starter';
const TIMER_SECONDS = 300;

interface NoLivesModalProps {
  gems: number;
  onUseGems: () => void;
  onClose: () => void;
  onUnlimitedLivesPurchased?: () => void;
  onQuickLifePurchased?: (rewards: { lives: number; gems: number }) => void;
  onShowStarterOffer?: () => void;
}

export const NoLivesModal = ({ gems, onUseGems, onClose, onUnlimitedLivesPurchased, onQuickLifePurchased, onShowStarterOffer }: NoLivesModalProps) => {
  const { createPayment, getPrice, loading } = usePayment();

  const starterPrice = getPrice('starter_gems', '€0.50');
  const gems100Price = getPrice('gems_100', '€0.99');
  const canAffordGems = gems >= 35;
  const alreadyBoughtStarter = hasPurchasedStarterGems();

  useEffect(() => {
    if (alreadyBoughtStarter) {
      trackEvent('starter_gems_blocked', { source: 'no_lives_modal' });
    }
  }, [alreadyBoughtStarter]);

  const handleUseGemsForLife = () => {
    trackEvent('gems_for_life', { gems_balance: gems, source: 'no_lives_modal' });
    onUseGems();
  };

  // ── PRIMARY monetisation CTA: buy gems, grant instant life ──
  const handleBuyLife = async () => {
    const productId = alreadyBoughtStarter ? 'gems_100' : 'starter_gems';
    
    trackEvent('purchase_life_attempt', { 
      productId, 
      already_bought_starter: alreadyBoughtStarter,
      source: 'no_lives_modal' 
    });

    const success = await createPayment(productId, 'no_lives_modal');
    if (success) {
      // Instant benefit: +1 life so the player can keep playing NOW
      onQuickLifePurchased?.({ lives: 1, gems: 0 });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="gradient-card shadow-card rounded-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-2xl font-bold text-gold mb-2">Sin Vidas</h2>
          <p className="text-muted-foreground">¡No te rindas ahora!</p>
        </div>

        <div className="space-y-3">
          {/* PAID CTA first — highest conversion priority */}
          <Button
            onClick={handleBuyLife}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-lg py-6 animate-pulse"
            id="buy-life-no-lives"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {loading ? (
              'Procesando...'
            ) : alreadyBoughtStarter ? (
              <span className="flex flex-col items-center">
                <span>❤️ +1 Vida + 100 💎</span>
                <span className="text-xs opacity-90">por solo {gems100Price}</span>
              </span>
            ) : (
              `❤️ +1 Vida + 400 💎 por solo ${starterPrice}`
            )}
          </Button>

          {/* Secondary: gems path (only prominent if user can afford it) */}
          {canAffordGems && (
            <Button
              onClick={handleUseGemsForLife}
              variant="outline"
              className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-900/30 text-sm py-4"
              id="use-gems-for-life"
            >
              <Heart className="w-4 h-4 mr-2 text-red-400" />
              <Gem className="w-4 h-4 mr-2" />
              {`+1 Vida por 35 Gemas (tienes ${gems}💎)`}
            </Button>
          )}

          <Button
            onClick={() => {
              trackEvent('offer_dismissed', {
                offer: 'starter_gems',
                trigger: 'no_lives',
                source: 'auto_popup',
                reason: 'no_thanks',
                gems_balance: gems,
              });
              onClose();
            }}
            variant="ghost"
            className="w-full text-muted-foreground text-sm"
          >
            Esperar a que se recarguen
          </Button>
        </div>
      </div>
    </div>
  );
};
