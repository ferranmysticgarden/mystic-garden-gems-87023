import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, X, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';

interface StreakProtectionOfferProps {
  currentStreak: number;
  onBuy: () => void;
  onDismiss: () => void;
}

/**
 * Oferta de protección de racha cuando el usuario está a punto de perderla.
 * Precio: €0.49 - Permite mantener la racha si pierdes un día.
 */
export const StreakProtectionOffer = ({ 
  currentStreak, 
  onBuy, 
  onDismiss 
}: StreakProtectionOfferProps) => {
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId: 'streak_protection' }
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

  const getEmotionalMessage = () => {
    if (currentStreak >= 7) {
      return language === 'es' 
        ? `¡${currentStreak} días de esfuerzo a punto de perderse!` 
        : `${currentStreak} days of effort about to be lost!`;
    }
    if (currentStreak >= 3) {
      return language === 'es'
        ? `¡Tu racha de ${currentStreak} días en peligro!`
        : `Your ${currentStreak}-day streak in danger!`;
    }
    return language === 'es'
      ? '¡No pierdas tu progreso!'
      : "Don't lose your progress!";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-orange-900 via-red-900 to-purple-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-orange-400 shadow-2xl animate-scale-in">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Icono animado */}
          <div className="relative mb-4">
            <Flame className="w-16 h-16 mx-auto text-orange-400 animate-pulse" />
            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm animate-bounce">
              {currentStreak}
            </div>
          </div>
          
          {/* Mensaje emocional */}
          <h2 className="text-xl font-bold text-orange-400 mb-2">
            🔥 {getEmotionalMessage()}
          </h2>
          
          <p className="text-orange-200 text-sm mb-4">
            {language === 'es' 
              ? 'Un escudo protegerá tu racha por 24 horas extra'
              : 'A shield will protect your streak for 24 extra hours'}
          </p>

          {/* Oferta */}
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-4 mb-4 border border-orange-400/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">
                {language === 'es' ? 'Protección de Racha' : 'Streak Protection'}
              </span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">€0.49</div>
            <p className="text-green-400 text-sm">
              {language === 'es' ? '+24 horas para reclamar' : '+24 hours to claim'}
            </p>
          </div>

          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-5 rounded-xl text-xl shadow-lg shadow-orange-500/30 mb-3"
          >
            {loading ? '⏳...' : (
              <span className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                {language === 'es' ? '¡PROTEGER RACHA!' : 'PROTECT STREAK!'}
              </span>
            )}
          </Button>

          <button 
            onClick={onDismiss}
            className="w-full text-white/50 hover:text-white text-sm py-2"
          >
            {language === 'es' ? 'Dejar que se pierda' : 'Let it be lost'}
          </button>
        </div>
      </div>
    </div>
  );
};
