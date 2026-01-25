import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuyMovesOfferProps {
  onBuy: () => void;
  onDismiss: () => void;
}

export const BuyMovesOffer = ({ onBuy, onDismiss }: BuyMovesOfferProps) => {
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Pulsing effect to draw attention
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId: 'buy_moves' }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div 
        className={`relative bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-6 max-w-sm mx-4 border-4 transition-all duration-300 ${
          pulse ? 'border-yellow-400 shadow-2xl shadow-yellow-500/30' : 'border-yellow-500/50 shadow-xl'
        }`}
      >
        <div className="text-center">
          {/* Urgency indicator */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
            <span className="text-yellow-400 font-bold text-lg">¡SIN MOVIMIENTOS!</span>
            <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>

          {/* Visual representation */}
          <div className="text-6xl mb-4">
            🎯
          </div>

          {/* Simple message */}
          <p className="text-white text-lg mb-2">
            No es una derrota aún...
          </p>
          <p className="text-purple-200 mb-6">
            ¡Puedes continuar!
          </p>

          {/* The offer */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 mb-4 border border-green-400/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-green-400">+5 Movimientos</span>
            </div>
            <p className="text-white text-3xl font-bold">€0.99</p>
          </div>

          {/* Buy button */}
          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-5 rounded-xl text-lg shadow-lg shadow-green-500/30 mb-3"
          >
            {loading ? '⏳ Procesando...' : '¡SEGUIR JUGANDO!'}
          </Button>

          {/* Dismiss */}
          <button 
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            Aceptar derrota
          </button>
        </div>
      </div>
    </div>
  );
};
