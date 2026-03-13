import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface CloseDefeatOfferProps {
  movesShort: number; // Cuántos movimientos le faltaron
  onBuy: () => void;
  onDismiss: () => void;
}

/**
 * Oferta única y simple cuando el jugador pierde por muy poco.
 * Una sola decisión clara: "Por €0.99 termina este nivel ahora"
 */
export const CloseDefeatOffer = ({ movesShort, onBuy, onDismiss }: CloseDefeatOfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();

  const handleBuy = async () => {
    const success = await createPayment('finish_level');
    if (success) {
      console.log('[PURCHASE] success confirmed via CloseDefeatOffer');
      dispatchPurchaseCompleted('finish_level');
      console.log('[PURCHASE] gate unlocked');
      onBuy();
    }
  };

  const price = getPrice('finish_level', '€0.99');

  // Mensaje emocional basado en cercanía
  const getEmotionalMessage = () => {
    if (movesShort === 1) return "¡A 1 movimiento de lograrlo!";
    if (movesShort === 2) return "¡A 2 movimientos de la victoria!";
    if (movesShort <= 3) return "¡Tan cerca que casi lo sientes!";
    return "¡Estabas a punto de conseguirlo!";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl animate-scale-in">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Emoji grande emocional - más dramático */}
          <div className="text-7xl mb-4 animate-pulse">😢</div>
          
          {/* Mensaje principal - MÁS EMOCIONAL */}
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">
            {getEmotionalMessage()}
          </h2>
          
          {/* Número grande y visible */}
          <div className="text-6xl font-bold text-white mb-2">
            {movesShort} {movesShort === 1 ? 'movimiento' : 'movimientos'}
          </div>
          
          {/* Subtext emocional */}
          <p className="text-purple-200 text-lg mb-6">
            Todo tu esfuerzo está ahí...
          </p>

          {/* CTA único y claro */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 mb-4 border border-yellow-400/30">
            <p className="text-white text-lg mb-3">
              ¿Terminar este nivel ahora?
            </p>
            <div className="text-4xl font-bold text-yellow-400 mb-1">
              {price}
            </div>
            <p className="text-green-400 text-sm">
              +5 movimientos para continuar
            </p>
          </div>

          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-5 rounded-xl text-xl shadow-lg shadow-yellow-500/30"
          >
            {loading ? '⏳ Procesando...' : '¡TERMINAR NIVEL! ✨'}
          </Button>

          <button 
            onClick={onDismiss}
            className="w-full text-white/50 hover:text-white mt-4 text-sm py-2"
          >
            No, perder el progreso
          </button>
        </div>
      </div>
    </div>
  );
};
