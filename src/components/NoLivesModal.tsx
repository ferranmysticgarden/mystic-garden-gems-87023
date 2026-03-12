import { Gem, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { usePayment } from '@/hooks/usePayment';
import { trackEvent } from '@/lib/trackEvent';
import { PRODUCTS } from '@/data/products';

interface NoLivesModalProps {
  gems: number;
  onUseGems: () => void;
  onClose: () => void;
  onQuickLifePurchased?: (rewards: { lives: number; gems: number }) => void;
}

export const NoLivesModal = ({ gems, onUseGems, onClose, onQuickLifePurchased }: NoLivesModalProps) => {
  const { createPayment, getPrice, loading } = usePayment();
  const quickPackProduct = PRODUCTS.find((product) => product.id === 'quick_pack');
  const quickPackLives = typeof quickPackProduct?.lives === 'number' ? quickPackProduct.lives : 3;
  const quickPackGems = quickPackProduct?.gems ?? 20;
  const quickPackPrice = getPrice('quick_pack', `€${quickPackProduct?.price.toFixed(2) ?? '0.99'}`);

  const handleQuickPackPurchase = async () => {
    trackEvent('purchase_attempt', { product: 'quick_pack', source: 'no_lives_modal' });
    const success = await createPayment('quick_pack');
    if (success) {
      onQuickLifePurchased?.({ lives: quickPackLives, gems: quickPackGems });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="gradient-card shadow-card rounded-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-bold text-gold mb-2">Sin Vidas</h2>
          <p className="text-muted-foreground">Elige una opción para continuar jugando</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleQuickPackPurchase}
            disabled={loading}
            className="w-full gradient-gold shadow-gold text-lg py-6"
            id="buy-quick-pack"
          >
            <Heart className="w-6 h-6 mr-2" />
            <Gem className="w-5 h-5 mr-2" />
            {loading ? 'Procesando...' : `${quickPackLives} Vidas + ${quickPackGems} Gemas - ${quickPackPrice}`}
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
