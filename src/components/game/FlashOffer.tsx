import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, X, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface FlashOfferProps {
  trigger: 'loss' | 'streak_loss';
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export const FlashOffer = ({ trigger, onClose, onPurchaseSuccess }: FlashOfferProps) => {
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const { user } = useAuth();
  const { createPayment, loading, getPrice } = usePayment();

  const price = getPrice('flash_offer', '€0.99');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBuy = async () => {
    if (loading) return;
    
    const success = await createPayment('flash_offer');
    if (success) {
      console.log('[PURCHASE] success confirmed via FlashOffer');
      dispatchPurchaseCompleted('flash_offer');
      console.log('[PURCHASE] gate unlocked');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-red-900 via-orange-900 to-yellow-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl animate-scale-in">
        {/* Pulsing border effect */}
        <div className="absolute inset-0 rounded-3xl border-4 border-yellow-400/50 animate-pulse" />
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
            <span className="text-red-400 font-bold text-lg">⚡ OFERTA FLASH ⚡</span>
            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          
          {/* Timer */}
          <div className="bg-black/50 rounded-xl p-3 mb-4 border border-red-500/50">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="font-mono text-2xl font-bold">{formatTime(timeLeft)}</span>
            </div>
            <p className="text-red-300 text-xs mt-1">¡Luego desaparece para siempre!</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 mb-4 border border-yellow-400/30">
            <h3 className="text-xl font-bold text-white mb-3">
              🔥 PACK RELÁMPAGO
            </h3>
            
            <div className="text-left space-y-2 text-white mb-4">
              <p className="flex items-center gap-2">
                <span className="text-2xl">❤️</span>
                <span className="font-semibold">10 vidas</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <span className="font-semibold">150 gemas</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">🚫</span>
                <span className="font-semibold">30 min sin anuncios</span>
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-gray-400 line-through text-lg">€4.99</span>
              <span className="text-4xl font-bold text-yellow-400">{price}</span>
            </div>
            <p className="text-green-400 font-bold text-lg">¡80% de descuento!</p>
          </div>

          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-5 rounded-xl text-xl shadow-lg shadow-yellow-500/30 animate-pulse"
          >
            {loading ? '⏳ Procesando...' : '⚡ ¡COMPRAR AHORA! ⚡'}
          </Button>

          <Button 
            onClick={onClose}
            variant="ghost"
            className="w-full text-white/50 hover:text-white mt-2 text-sm"
          >
            No, gracias (se perderá la oferta)
          </Button>
        </div>
      </div>
    </div>
  );
};
