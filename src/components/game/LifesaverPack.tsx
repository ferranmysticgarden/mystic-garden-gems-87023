import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, X, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface LifesaverPackProps {
  onBuy: () => void;
  onDismiss: () => void;
}

/**
 * Pack Salvavidas €0.49 - Cuando el usuario se queda sin vidas
 * 1 vida + 3 movimientos extra
 */
export const LifesaverPack = ({ onBuy, onDismiss }: LifesaverPackProps) => {
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId: 'lifesaver_pack' }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        onBuy();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(language === 'es' ? 'Error al procesar el pago' : 'Payment error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-red-900 via-pink-900 to-purple-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-red-400 shadow-2xl animate-scale-in">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Icono corazón roto */}
          <div className="text-6xl mb-4">💔</div>
          
          <h2 className="text-2xl font-bold text-red-400 mb-2">
            {language === 'es' ? '¡Sin vidas!' : 'No lives!'}
          </h2>
          
          <p className="text-red-200 mb-4">
            {language === 'es' 
              ? 'Pero puedes seguir jugando ahora mismo...'
              : 'But you can keep playing right now...'}
          </p>

          {/* Oferta */}
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl p-4 mb-4 border border-red-400/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-6 h-6 text-red-400 fill-red-400" />
              <span className="text-xl font-bold text-white">
                {language === 'es' ? 'Pack Salvavidas' : 'Lifesaver Pack'}
              </span>
            </div>
            
            <div className="flex justify-center gap-4 mb-3">
              <div className="text-center">
                <div className="text-2xl">❤️</div>
                <p className="text-xs text-red-200">+1 vida</p>
              </div>
              <div className="text-center">
                <div className="text-2xl">🎯</div>
                <p className="text-xs text-red-200">+3 movs</p>
              </div>
            </div>
            
            <div className="text-4xl font-bold text-white">€0.49</div>
            <p className="text-green-400 text-sm mt-1">
              {language === 'es' ? '¡Sigue jugando ya!' : 'Keep playing now!'}
            </p>
          </div>

          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-bold py-5 rounded-xl text-xl shadow-lg shadow-red-500/30 mb-3"
          >
            {loading ? '⏳...' : (
              <span className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 fill-current" />
                {language === 'es' ? '¡REVIVIR AHORA!' : 'REVIVE NOW!'}
              </span>
            )}
          </Button>

          <button 
            onClick={onDismiss}
            className="w-full text-white/50 hover:text-white text-sm py-2"
          >
            {language === 'es' ? 'Esperar regeneración' : 'Wait for regeneration'}
          </button>
          
          <p className="text-red-300/50 text-xs mt-2">
            {language === 'es' ? '⏰ Próxima vida en ~35 min' : '⏰ Next life in ~35 min'}
          </p>
        </div>
      </div>
    </div>
  );
};
