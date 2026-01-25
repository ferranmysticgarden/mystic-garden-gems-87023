import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId: 'finish_level' }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        onBuy();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl animate-scale-in">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Emoji grande emocional */}
          <div className="text-6xl mb-4">😢</div>
          
          {/* Mensaje principal - valor visible */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Te faltaron solo
          </h2>
          <div className="text-5xl font-bold text-yellow-400 mb-2">
            {movesShort} movimientos
          </div>
          
          {/* Valor claro */}
          <p className="text-purple-200 text-lg mb-6">
            Estuviste tan cerca...
          </p>

          {/* CTA único y claro */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 mb-4 border border-yellow-400/30">
            <p className="text-white text-lg mb-3">
              ¿Terminar este nivel ahora?
            </p>
            <div className="text-4xl font-bold text-yellow-400 mb-1">
              €0.99
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
