import { Gem, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useStripePayment } from '@/hooks/useStripePayment';

interface NoLivesModalProps {
  gems: number;
  onUseGems: () => void;
  onClose: () => void;
  onQuickLifePurchased?: () => void;
}

export const NoLivesModal = ({ gems, onUseGems, onClose, onQuickLifePurchased }: NoLivesModalProps) => {
  const { createPayment, loading } = useStripePayment();

  const handleQuickLifePurchase = async () => {
    await createPayment('quick_life');
    // El webhook de Stripe procesará la compra y añadirá la vida
    if (onQuickLifePurchased) {
      onQuickLifePurchased();
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
            onClick={handleQuickLifePurchase}
            disabled={loading}
            className="w-full gradient-gold shadow-gold text-lg py-6"
            id="buy-quick-life"
          >
            <Heart className="w-6 h-6 mr-2" />
            {loading ? 'Procesando...' : 'Comprar 1 Vida - €0.20'}
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
