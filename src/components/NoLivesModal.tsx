import { Gem, Heart, Infinity } from 'lucide-react';
import { Button } from './ui/button';
import { usePayment } from '@/hooks/usePayment';
import { trackEvent } from '@/lib/trackEvent';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface NoLivesModalProps {
  gems: number;
  onUseGems: () => void;
  onClose: () => void;
  onUnlimitedLivesPurchased?: () => void;
  onQuickLifePurchased?: (rewards: { lives: number; gems: number }) => void;
}

export const NoLivesModal = ({ gems, onUseGems, onClose, onUnlimitedLivesPurchased, onQuickLifePurchased }: NoLivesModalProps) => {
  const { createPayment, getPrice, loading } = usePayment();

  const unlimitedPrice = getPrice('unlimited_lives_30min', '€0.99');

  const handleUnlimitedLivesPurchase = async () => {
    trackEvent('purchase_attempt', { product: 'unlimited_lives_30min', source: 'no_lives_modal' });
    const success = await createPayment('unlimited_lives_30min');
    if (success) {
      dispatchPurchaseCompleted('unlimited_lives_30min');
      onUnlimitedLivesPurchased?.();
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
          {/* MAIN CTA: Unlimited Lives 30min */}
          <Button
            onClick={handleUnlimitedLivesPurchase}
            disabled={loading}
            className="w-full gradient-gold shadow-gold text-lg py-6"
            id="buy-unlimited-lives"
          >
            <Infinity className="w-6 h-6 mr-2" />
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            {loading ? 'Procesando...' : `VIDAS INFINITAS 30min - ${unlimitedPrice}`}
          </Button>

          <Button
            onClick={onUseGems}
            disabled={gems < 5}
            variant="outline"
            className="w-full text-lg py-6"
            id="use-gems-for-life"
          >
            <Gem className="w-6 h-6 mr-2" />
            Usar 5 Gemas {gems < 5 && '(No tienes suficientes)'}
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};
