import { Button } from '@/components/ui/button';
import { Sparkles, X, Star } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface PostVictoryOfferProps {
  baseGems: number;
  onClose: () => void;
  onMultiply: (newGems: number) => void;
}

export const PostVictoryOffer = ({ baseGems, onClose, onMultiply }: PostVictoryOfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();
  const multipliedGems = baseGems * 3;

  const handleBuy = async () => {
    const success = await createPayment('victory_multiplier');
    if (success) {
      console.log('[PURCHASE] success confirmed via PostVictoryOffer');
      dispatchPurchaseCompleted();
      console.log('[PURCHASE] gate unlocked');
      onMultiply(multipliedGems);
      onClose();
    }
  };

  const price = getPrice('victory_multiplier', '€0.99');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-green-900 via-emerald-900 to-teal-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-green-400 shadow-2xl animate-scale-in overflow-hidden">
        {/* Celebration particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#00FF00', '#FF69B4'][i % 3],
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-1 mb-3">
            <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
            <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
            <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-bold text-green-300 mb-2">
            🎉 ¡LO HAS CONSEGUIDO!
          </h2>
          
          <p className="text-emerald-200 text-sm mb-4">
            ¡Victoria épica! Celebra con un bonus especial
          </p>

          <div className="bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-2xl p-5 mb-4 border border-yellow-400/30">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Ganaste</p>
                <p className="text-2xl font-bold text-white">{baseGems} 💎</p>
              </div>
              
              <div className="text-4xl animate-pulse">→</div>
              
              <div className="text-center">
                <p className="text-yellow-400 text-sm font-bold">x3</p>
                <p className="text-3xl font-bold text-yellow-400">{multipliedGems} 💎</p>
              </div>
            </div>

            <div className="bg-green-500/20 rounded-lg p-2 mb-3">
              <p className="text-green-300 font-semibold text-sm">
                + 2 vidas extra ❤️❤️
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-yellow-400">{price}</span>
            </div>
          </div>

          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-5 rounded-xl text-lg shadow-lg shadow-green-500/30"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {loading ? '⏳ Procesando...' : '¡MULTIPLICAR x3! 🚀'}
          </Button>

          <Button 
            onClick={onClose}
            variant="ghost"
            className="w-full text-emerald-300/60 hover:text-emerald-300 mt-2"
          >
            No, solo quiero {baseGems} gemas
          </Button>
        </div>
      </div>
    </div>
  );
};
