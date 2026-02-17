import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Zap, Coins } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';
import confetti from 'canvas-confetti';

interface WelcomeOfferProps {
  onPurchase: () => void;
  onDismiss: () => void;
}

/**
 * Oferta de bienvenida obligatoria después del primer nivel.
 * Solo se muestra UNA VEZ por usuario.
 * €0.49 - Pack Bienvenida
 */
export const WelcomeOffer = ({ onPurchase, onDismiss }: WelcomeOfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();
  const [visible, setVisible] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    // Analytics movidos a GameScreen/Index (componente estable) para Android
    
    // Celebrate entry
    setTimeout(() => {
      setVisible(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#FFD700', '#FFA500', '#FF69B4']
      });
    }, 300);

    // Delay dismiss button 3 seconds to reduce impulsive closes
    setTimeout(() => {
      setCanDismiss(true);
    }, 3300);
  }, []);

  const handleBuy = async () => {
    const success = await createPayment('welcome_pack');
    if (success) {
      console.log('[PURCHASE] success confirmed via WelcomeOffer');
      dispatchPurchaseCompleted();
      console.log('[PURCHASE] gate unlocked');
      localStorage.setItem('welcome_offer_claimed', 'true');
      localStorage.setItem('first_purchase_completed', 'true');
      
      onPurchase();
    }
  };

  const handleDismiss = () => {
    // Mark as shown (won't show again until tomorrow)
    const today = new Date().toDateString();
    localStorage.setItem('welcome_offer_rejected_date', today);
    localStorage.setItem('offer_shown_today', 'true');
    
    onDismiss();
  };

  const price = getPrice('welcome_pack', '€0.50');

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-sm mx-4 w-full">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-3xl blur-xl opacity-40 animate-pulse" />
        
        <div className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 rounded-3xl p-6 border-4 border-yellow-400 shadow-2xl animate-scale-in">
          {/* Close button - aparece después de 3 segundos */}
          {canDismiss && (
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/40 hover:text-white/60 transition-colors animate-fade-in"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-4 py-1 rounded-full text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              OFERTA DE BIENVENIDA
            </div>

            {/* Emoji celebratorio */}
            <div className="text-6xl mb-3 animate-bounce">🎁</div>

            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Increíble primera victoria!
            </h2>
            
            <p className="text-purple-200 mb-4">
              Solo ahora - oferta exclusiva
            </p>

            {/* Benefits list */}
            <div className="bg-black/30 rounded-xl p-4 mb-4 text-left space-y-2">
              <div className="flex items-center gap-3 text-white">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span><strong>+5 Movimientos</strong> extra</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span><strong>+3 Boosters</strong> especiales</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <Coins className="w-5 h-5 text-amber-400" />
                <span><strong>x2 Monedas</strong> durante 30 min</span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="text-4xl font-bold text-yellow-400 mb-1">
                {price}
              </div>
              <p className="text-purple-300 text-sm">
                Menos que un café ☕
              </p>
            </div>

            {/* CTA - Sin alternativa gratuita visible */}
            <Button 
              onClick={handleBuy}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-6 rounded-2xl text-xl shadow-lg shadow-yellow-500/30 transition-all hover:scale-105"
            >
              {loading ? (
                '⏳ Procesando...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Aprovechar {price}
                </span>
              )}
            </Button>

            {/* Anchor text */}
            <p className="text-white/40 text-xs mt-3">
              Oferta especial de inicio
            </p>

            {/* Dismiss text - aparece después de 3 segundos */}
            {canDismiss && (
              <button 
                onClick={handleDismiss}
                className="text-white/30 hover:text-white/50 text-xs mt-4 transition-colors animate-fade-in"
              >
                Ahora no
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
