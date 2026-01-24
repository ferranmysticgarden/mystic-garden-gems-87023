import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoseBundleProps {
  onBuy: () => void;
  onDismiss: () => void;
}

export const LoseBundle = ({ onBuy, onDismiss }: LoseBundleProps) => {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId: 'pack_revancha' }
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
      <div className="relative bg-gradient-to-b from-red-900 via-purple-900 to-indigo-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-orange-400 shadow-2xl animate-scale-in">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="text-5xl mb-3">😢</div>
          
          <h2 className="text-2xl font-bold text-orange-400 mb-1">
            ¡CASI LO TENÍAS!
          </h2>
          
          <p className="text-purple-200 text-sm mb-2">
            Estuviste a solo <span className="text-yellow-400 font-bold">2 movimientos</span> de ganar...
          </p>
          <p className="text-orange-300 text-xs mb-4">
            No dejes que el nivel te gane ahora
          </p>

          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-4 mb-4">
            <h3 className="text-xl font-bold text-white mb-3">
              PACK REVANCHA
            </h3>
            
            <div className="text-left space-y-1 text-white mb-4">
              <p>✅ 5 vidas extra ❤️</p>
              <p>✅ 50 gemas 💎</p>
              <p>✅ +5 movimientos para este nivel</p>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-gray-400 line-through text-lg">€2.99</span>
              <span className="text-3xl font-bold text-orange-400">€0.99</span>
            </div>
            <p className="text-green-400 font-semibold">¡67% de descuento!</p>
          </div>

          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-4 rounded-xl text-lg mb-3"
          >
            {loading ? '⏳ Procesando...' : '¡COMPRAR Y CONTINUAR! 💪'}
          </Button>

          <Button 
            onClick={onDismiss}
            variant="ghost"
            className="w-full text-purple-300 hover:text-white"
          >
            No, gracias
          </Button>

          <p className="text-purple-300 text-xs mt-3">
            Oferta especial por tiempo limitado
          </p>
        </div>
      </div>
    </div>
  );
};
