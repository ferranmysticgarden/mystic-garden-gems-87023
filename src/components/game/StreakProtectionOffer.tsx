import { Shield, X, Flame } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

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
  const { createPayment, loading, getPrice } = usePayment();
  const { language } = useLanguage();

  const handleBuy = async () => {
    const success = await createPayment('streak_protection');
    if (success) {
      console.log('[PURCHASE] success confirmed via StreakProtection');
      dispatchPurchaseCompleted('streak_protection');
      console.log('[PURCHASE] gate unlocked');
      onBuy();
    }
  };

  const price = getPrice('streak_protection', '€0.50');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative bg-gradient-to-b from-orange-900 via-red-900 to-purple-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-orange-400 shadow-2xl animate-scale-in">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Icono animado */}
          <div className="relative mb-4">
            <Flame className="w-20 h-20 mx-auto text-orange-400 animate-pulse drop-shadow-lg" />
            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-lg animate-bounce shadow-lg">
              {currentStreak}
            </div>
          </div>
          
          {/* Mensaje emocional */}
          <h2 className="text-2xl font-bold text-orange-300 mb-2 drop-shadow-lg">
            🔥 {getEmotionalMessage()}
          </h2>
          
          <p className="text-orange-200/90 text-sm mb-5">
            {language === 'es' 
              ? 'Un escudo protegerá tu racha por 24 horas extra'
              : 'A shield will protect your streak for 24 extra hours'}
          </p>

          {/* Oferta destacada */}
          <div className="bg-gradient-to-r from-orange-500/30 to-yellow-500/30 rounded-2xl p-5 mb-5 border-2 border-orange-400/50 shadow-inner">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Shield className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
              <span className="text-2xl font-bold text-white">
                {language === 'es' ? 'Protección de Racha' : 'Streak Protection'}
              </span>
            </div>
            <div className="text-5xl font-black text-white mb-2 drop-shadow-lg">{price}</div>
            <p className="text-green-400 font-semibold">
              {language === 'es' ? '+24 horas para reclamar' : '+24 hours to claim'}
            </p>
          </div>

          <PremiumButton 
            onClick={handleBuy}
            loading={loading}
            variant="orange"
            size="lg"
            className="mb-4"
          >
            <Shield className="w-6 h-6" />
            {language === 'es' ? '¡PROTEGER RACHA!' : 'PROTECT STREAK!'}
          </PremiumButton>

          <button 
            onClick={onDismiss}
            className="w-full text-white/40 hover:text-white/70 text-sm py-2 transition-colors"
          >
            {language === 'es' ? 'Dejar que se pierda' : 'Let it be lost'}
          </button>
        </div>
      </div>
    </div>
  );
};
