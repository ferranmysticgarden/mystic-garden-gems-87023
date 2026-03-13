import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Clock } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface Level6OfferProps {
  onBuy: () => void;
  onDismiss: () => void;
  progressPercent?: number;
}

/**
 * Oferta ligera y neutra para el nivel 6.
 * Se muestra solo en la PRIMERA derrota con ≥50% de progreso.
 * Recompensa: +3 movimientos por €0.50
 * Incluye timer de urgencia de 5 minutos.
 */
export const Level6Offer = ({ onBuy, onDismiss, progressPercent = 85 }: Level6OfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  console.log("LEVEL6 POPUP RENDER");

  // Analytics movidos a GameScreen.tsx (componente estable) para Android

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBuy = async () => {
    const success = await createPayment('buy_moves');
    if (success) {
      console.log('[PURCHASE] success confirmed via Level6Offer');
      dispatchPurchaseCompleted('buy_moves');
      console.log('[PURCHASE] gate unlocked');
      localStorage.setItem('level6_offer_dismissed', 'true');
      localStorage.setItem('first_purchase_completed', 'true');
      onBuy();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('level6_offer_dismissed', 'true');
    onDismiss();
  };

  const price = getPrice('buy_moves', '€0.50');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft < 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in">
      <div className="relative bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-6 max-w-sm mx-4 border-2 border-purple-400/50 shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/50 hover:text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          {/* Emoji neutro */}
          <div className="text-5xl mb-3">🌿</div>

          {/* Título neutro */}
          <h2 className="text-xl font-semibold text-white mb-1">
            Estuviste muy cerca
          </h2>

          {/* Timer de urgencia */}
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 transition-all ${
            isUrgent 
              ? 'bg-red-600/80 animate-pulse border border-red-400' 
              : 'bg-black/40 border border-white/10'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-white animate-bounce' : 'text-amber-300'}`} />
            <span className={`font-mono font-bold text-sm ${isUrgent ? 'text-white' : 'text-amber-300'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Refuerzo emocional */}
          <p className="text-purple-300/90 text-xs mb-3 italic">
            Ya has hecho casi todo el trabajo
          </p>

          {/* Barra de progreso visual */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-purple-300 mb-1">
              <span>Tu progreso</span>
              <span className="font-bold text-amber-400">{Math.round(progressPercent)}%</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-4 bg-white/10 border border-white/10 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-amber-400"
            />
            <p className="text-purple-200 text-sm mt-2">
              Con unos pocos movimientos más lo superas
            </p>
          </div>

          {/* Beneficio */}
          <div className="bg-white/10 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-center gap-2 text-white">
              <span className="text-2xl">✨</span>
              <span className="text-lg font-medium">+3 movimientos</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-5 rounded-xl text-lg shadow-lg transition-all"
          >
            {loading ? '⏳ Procesando...' : 'Terminar este nivel'}
          </Button>

          {/* Precio visible debajo */}
          <p className="text-purple-300/80 text-sm mt-2">
            {price} · menos que un café
          </p>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/50 text-xs mt-4 transition-colors"
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
};
