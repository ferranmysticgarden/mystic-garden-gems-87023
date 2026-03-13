import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Zap, Sparkles } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface BuyMovesOfferProps {
  onBuy: () => void;
  onDismiss: () => void;
  movesShort?: number; // If 1-2, hide free option (soft paywall)
}

export const BuyMovesOffer = ({ onBuy, onDismiss, movesShort = 3 }: BuyMovesOfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();
  const [pulse, setPulse] = useState(true);

  // Soft paywall: if player lost by 1-2 moves, hide free exit
  const isSoftPaywall = movesShort <= 2;

  // Pulsing effect to draw attention
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = async () => {
    const success = await createPayment('buy_moves');
    if (success) {
      console.log('[PURCHASE] success confirmed via BuyMovesOffer');
      dispatchPurchaseCompleted('buy_moves');
      console.log('[PURCHASE] gate unlocked');
      onBuy();
    }
  };

  const price = getPrice('buy_moves', '€0.49');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div 
        className={`relative bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-6 max-w-sm mx-4 border-4 transition-all duration-300 ${
          pulse ? 'border-yellow-400 shadow-2xl shadow-yellow-500/30' : 'border-yellow-500/50 shadow-xl'
        }`}
      >
        <div className="text-center">
          {/* Urgency indicator */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-yellow-400 font-bold text-lg">¡CASI LO CONSEGUISTE!</span>
          </div>

          {/* Visual representation */}
          <div className="text-6xl mb-4">
            {isSoftPaywall ? '😢' : '🎯'}
          </div>

          {/* Emotional message for soft paywall */}
          {isSoftPaywall ? (
            <>
              <p className="text-white text-lg mb-1">
                ¡Solo te faltaba <span className="text-yellow-400 font-bold">{movesShort}</span> {movesShort === 1 ? 'movimiento' : 'movimientos'}!
              </p>
              <p className="text-purple-200 text-sm mb-4">
                Todo tu progreso se perderá...
              </p>
            </>
          ) : (
            <>
              <p className="text-white text-lg mb-2">
                ¡CASI LO CONSEGUISTE!
              </p>
              <p className="text-purple-200 mb-4">
                Solo te faltaba un poco más...
              </p>
            </>
          )}

          {/* The offer */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 mb-4 border border-green-400/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-green-400">+5 Movimientos</span>
            </div>
            <p className="text-white text-3xl font-bold">{price}</p>
            <p className="text-purple-300 text-xs mt-1">Menos que un café ☕</p>
          </div>

          {/* Buy button */}
          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-5 rounded-xl text-lg shadow-lg shadow-yellow-500/30 mb-3"
          >
            {loading ? (
              '⏳ Procesando...'
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {isSoftPaywall ? '¡CONTINUAR!' : 'CONTINUAR'}
                <span className="ml-1">{price}</span>
              </span>
            )}
          </Button>

          {/* Dismiss - hidden on soft paywall */}
          {!isSoftPaywall && (
            <button 
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
            >
              PERDER NIVEL
            </button>
          )}
          
          {/* Soft paywall: tiny exit that looks like giving up */}
          {isSoftPaywall && (
            <button 
              onClick={onDismiss}
              className="text-white/20 hover:text-white/40 text-xs transition-colors mt-2"
            >
              Perder todo el progreso
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
