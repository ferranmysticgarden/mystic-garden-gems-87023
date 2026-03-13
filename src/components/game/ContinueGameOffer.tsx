import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface ContinueGameOfferProps {
  progressPercent: number;
  onContinue: () => void;
  onExit: () => void;
}

export const ContinueGameOffer = ({ 
  progressPercent, 
  onContinue, 
  onExit 
}: ContinueGameOfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();

  const handleBuy = async () => {
    const success = await createPayment('continue_game');
    if (success) {
      console.log('[PURCHASE] success confirmed via ContinueGameOffer');
      dispatchPurchaseCompleted('continue_game');
      console.log('[PURCHASE] gate unlocked');
      onContinue();
    }
  };

  const price = getPrice('continue_game', '€0.99');

  // Emotional message based on progress
  const getMessage = () => {
    if (progressPercent >= 90) return "¡Estabas a un suspiro de conseguirlo!";
    if (progressPercent >= 80) return "¡Casi lo tenías en tus manos!";
    if (progressPercent >= 70) return "¡Estabas tan cerca...!";
    return "¡No te rindas ahora!";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in">
      <div className="relative max-w-sm mx-4 text-center">
        {/* Slow fade in animation for emotional impact */}
        <div className="animate-scale-in" style={{ animationDuration: '0.8s' }}>
          {/* Broken heart or sad emoji */}
          <div className="text-8xl mb-6 animate-pulse">
            💔
          </div>

          {/* Emotional message */}
          <h2 className="text-3xl font-bold text-white mb-3">
            {getMessage()}
          </h2>
          
          <p className="text-gray-300 text-lg mb-8">
            Completaste el <span className="text-yellow-400 font-bold">{Math.round(progressPercent)}%</span> del nivel
          </p>

          {/* Main CTA - Continue */}
          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-6 rounded-2xl text-xl shadow-lg shadow-yellow-500/30 mb-4 transition-all hover:scale-105"
          >
            {loading ? (
              '⏳ Procesando...'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Heart className="w-6 h-6 fill-current" />
                Continuar por {price}
              </span>
            )}
          </Button>

          {/* Secondary option - Exit (small) */}
          <button 
            onClick={onExit}
            className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
};
