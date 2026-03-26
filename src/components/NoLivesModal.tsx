import { Gem, Heart, Infinity, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { usePayment } from '@/hooks/usePayment';
import { trackEvent } from '@/lib/trackEvent';

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

  const unlimitedPrice = getPrice('unlimited_lives_30min', '€0.99');
  const starterGemsPrice = getPrice('starter_gems', '€0.50');
  const canAffordGems = gems >= 10;

  const handleUseGemsForLife = () => {
    trackEvent('gems_for_life', { gems_balance: gems, source: 'no_lives_modal' });
    onUseGems();
  };

  const handleUnlimitedLivesPurchase = async () => {
    trackEvent('purchase_attempt', { product: 'unlimited_lives_30min', source: 'no_lives_modal' });
    const success = await createPayment('unlimited_lives_30min');
    if (success) {
      onUnlimitedLivesPurchased?.();
    }
  };

  const handleNeedGems = () => {
    trackEvent('need_gems_from_no_lives', { gems_balance: gems });
    onClose();
    onShowStarterOffer?.();
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
          {/* PRIMARY CTA: Use gems for 1 life - cheap and easy */}
          <Button
            onClick={handleUseGemsForLife}
            disabled={gems < 5}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-lg py-6"
            id="use-gems-for-life"
          >
            <Heart className="w-5 h-5 mr-2 text-red-400" />
            <Gem className="w-5 h-5 mr-2" />
            {gems >= 5 ? `+1 Vida por 5 Gemas (tienes ${gems}💎)` : 'No tienes gemas suficientes'}
          </Button>

          {/* If user can't afford gems, show a way to get them cheap */}
          {!canAffordGems && (
            <Button
              onClick={handleNeedGems}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-base py-5 animate-pulse"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {`💎 ¡Consigue 50 Gemas por solo ${starterGemsPrice}! 💎`}
            </Button>
          )}

          {/* Secondary: Unlimited Lives (higher commitment) */}
          <Button
            onClick={handleUnlimitedLivesPurchase}
            disabled={loading}
            className="w-full gradient-gold shadow-gold text-base py-5"
            id="buy-unlimited-lives"
          >
            <Infinity className="w-5 h-5 mr-2" />
            <Heart className="w-4 h-4 mr-2 text-red-500" />
            {loading ? 'Procesando...' : `Vidas Infinitas 30min - ${unlimitedPrice}`}
          </Button>

          <Button
            onClick={onClose}
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
