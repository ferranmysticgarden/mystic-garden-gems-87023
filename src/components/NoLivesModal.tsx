import { useEffect, useRef, useState } from 'react';
import { Gem, Heart, Sparkles, Loader2, X } from 'lucide-react';
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
  const timeRemainingRef = useRef(TIMER_SECONDS);
  const [autoClosed, setAutoClosed] = useState(false);

  const starterPrice = getPrice('starter_gems', '€0.50');
  const gems100Price = getPrice('gems_100', '€0.99');
  const canAffordGems = gems >= 35;
  const alreadyBoughtStarter = hasPurchasedStarterGems();
  const productId = alreadyBoughtStarter ? 'gems_100' : 'starter_gems';
  const currentPrice = alreadyBoughtStarter ? gems100Price : starterPrice;

  useEffect(() => {
    if (alreadyBoughtStarter) {
      trackEvent('starter_gems_blocked', { source: 'no_lives_modal' });
    }
  }, [alreadyBoughtStarter]);

  const handleDismiss = (reason: 'no_thanks' | 'auto_close') => {
    trackEvent('offer_dismissed', {
      offer: productId,
      trigger: 'no_lives',
      source: 'auto_popup',
      reason,
      gems_balance: gems,
    });
    markOfferDismissed(OFFER_ID);
    onClose();
  };

  const handleUseGemsForLife = () => {
    trackEvent('gems_for_life', { gems_balance: gems, source: 'no_lives_modal' });
    onUseGems();
  };

  // ── PRIMARY monetisation CTA: buy gems, grant instant life ──
  const handleBuyLife = async () => {
    trackEvent('purchase_life_attempt', {
      productId,
      already_bought_starter: alreadyBoughtStarter,
      source: 'no_lives_modal',
    });

    const success = await createPayment(productId, 'no_lives_modal');
    if (success) {
      trackEvent('offer_purchased_in_time', {
        offer_type: OFFER_ID,
        time_remaining: timeRemainingRef.current,
      });
      // Instant benefit: +1 life so the player can keep playing NOW
      onQuickLifePurchased?.({ lives: 1, gems: 0 });
    }
  };

  if (autoClosed) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="gradient-card shadow-card rounded-2xl p-6 max-w-md w-full relative">
        <button
          onClick={() => handleDismiss('no_thanks')}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">💔</div>
          <p className="text-yellow-400 text-sm font-bold mb-1">🔥 OFERTA EXCLUSIVA - Solo HOY 🔥</p>
          <h2 className="text-2xl font-bold text-gold mb-2">Sin Vidas</h2>
          <p className="text-muted-foreground text-sm">¡No te rindas ahora!</p>
        </div>

        <div className="flex justify-center mb-3">
          <OfferCountdownTimer
            offerType={OFFER_ID}
            durationSeconds={TIMER_SECONDS}
            onExpire={() => {
              setAutoClosed(true);
              handleDismiss('auto_close');
            }}
          />
        </div>

        <PhotoTilesPreview className="mb-3" />

        <div className="flex justify-center mb-4">
          <DiscountPrice productId={productId} currentPrice={currentPrice} />
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
            onClick={() => handleDismiss('no_thanks')}
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
