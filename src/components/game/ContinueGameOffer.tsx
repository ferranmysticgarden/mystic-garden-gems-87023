import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId: 'continue_game' }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        onContinue();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  // Emotional message based on progress
  const getMessage = () => {
    if (progressPercent >= 90) return "¡Estabas a un suspiro de conseguirlo!";
    if (progressPercent >= 80) return "¡Casi lo tenías en tus manos!";
    if (progressPercent >= 70) return "¡Estabas tan cerca...!";
    return "¡No te rindas ahora!";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
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
                Continuar por €0.99
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
