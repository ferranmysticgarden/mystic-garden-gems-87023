import { Gem, Heart, Sparkles } from 'lucide-react';
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

  const starterPrice = getPrice('starter_gems', '€0.50');
  const canAffordGems = gems >= 5;

  const handleUseGemsForLife = () => {
    trackEvent('gems_for_life', { gems_balance: gems, source: 'no_lives_modal' });
    onUseGems();
  };

  // ── PRIMARY monetisation CTA: buy starter_gems, grant instant life ──
  const handleBuyStarterGems = async () => {
    const success = await createPayment('starter_gems', 'no_lives_modal');
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
          {/* PRIMARY CTA: Use gems for 1 life - free path */}
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

          {/* PAID CTA: starter_gems — best value, instant life + 400 gems */}
          <Button
            onClick={handleBuyStarterGems}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-base py-5 animate-pulse"
            id="buy-starter-gems-no-lives"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {loading
              ? 'Procesando...'
              : `❤️ +1 Vida + 400 💎 por solo ${starterPrice}`}
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
