import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Star, Gift, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';
import confetti from 'canvas-confetti';

interface StarterPackProps {
  levelJustCompleted: number;
  onClose: () => void;
}

export const StarterPack = ({ levelJustCompleted, onClose }: StarterPackProps) => {
  const [show, setShow] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds (más urgencia)
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'visible'>('entering');
  const { user } = useAuth();
  const { createPayment, loading, getPrice } = usePayment();

  const price = getPrice('starter_pack', '€0.99');

  useEffect(() => {
    // Trigger después de nivel 2, 3 o 4 (más temprano para captar antes del churn)
    if (![2, 3, 4].includes(levelJustCompleted)) return;

    // Use a stable ID: user.id for logged-in, 'guest' for guests
    const odId = user?.id || 'guest';

    // Reaparece cada 3 sesiones en vez de mostrarse solo 1 vez
    const seenCount = parseInt(localStorage.getItem(`starter-pack-count-${odId}`) || '0', 10);
    const hasBought = localStorage.getItem(`starter-pack-${odId}`) === 'true';
    if (!hasBought && seenCount % 3 === 0) {
      localStorage.setItem(`starter-pack-count-${odId}`, String(seenCount + 1));
      // Delay para que aparezca después de la celebración
      const timer = setTimeout(() => {
        setShow(true);
        triggerCelebration();
      }, 2500);
      return () => clearTimeout(timer);
    } else if (!hasBought) {
      localStorage.setItem(`starter-pack-count-${odId}`, String(seenCount + 1));
    }
  }, [levelJustCompleted, user?.id]);

  useEffect(() => {
    if (show && animationPhase === 'entering') {
      const timer = setTimeout(() => setAnimationPhase('visible'), 600);
      return () => clearTimeout(timer);
    }
  }, [show, animationPhase]);

  useEffect(() => {
    if (!show) return;

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
  }, [show]);

  const triggerCelebration = () => {
    // Confetti dorado cayendo del cielo
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.2 },
      colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6B00'],
      gravity: 0.8,
    });
  };

  const handleBuy = async () => {
    if (loading) return;
    
    const success = await createPayment('starter_pack');
    if (success) {
      const odId = user?.id || 'guest';
      console.log('[PURCHASE] success confirmed via StarterPack');
      dispatchPurchaseCompleted('starter_pack');
      console.log('[PURCHASE] gate unlocked');
      localStorage.setItem(`starter-pack-${odId}`, 'true');
      setShow(false);
      onClose();
    }
  };

  const handleDismiss = () => {
    const odId = user?.id || 'guest';
    localStorage.setItem(`starter-pack-${odId}`, 'true');
    setShow(false);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determinar si el timer está crítico (menos de 5 minutos)
  const isUrgent = timeLeft < 300;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Animación de entrada "cae del cielo" */}
      <div 
        className={`relative max-w-sm mx-4 transition-all duration-700 ease-out ${
          animationPhase === 'entering' 
            ? 'opacity-0 -translate-y-full scale-75' 
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        {/* Glow exterior pulsante */}
        <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-3xl blur-xl opacity-60 animate-pulse" />
        
        <div className="relative bg-gradient-to-b from-yellow-900 via-amber-800 to-orange-900 rounded-3xl p-6 border-4 border-yellow-400 shadow-2xl overflow-hidden">
          {/* Animated sparkles background */}
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-300/50 animate-pulse" />
            <Sparkles className="absolute top-8 right-6 w-4 h-4 text-yellow-300/40 animate-pulse delay-75" />
            <Sparkles className="absolute bottom-12 left-8 w-5 h-5 text-yellow-300/45 animate-pulse delay-150" />
            <Sparkles className="absolute bottom-6 right-4 w-6 h-6 text-yellow-300/50 animate-pulse delay-100" />
            <Zap className="absolute top-1/2 left-2 w-4 h-4 text-yellow-400/30 animate-bounce" />
            <Zap className="absolute top-1/3 right-2 w-4 h-4 text-yellow-400/30 animate-bounce delay-200" />
          </div>

          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/70 hover:text-white z-20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center relative z-10">
            {/* Golden glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 to-transparent opacity-60 blur-3xl" />
            
            <div className="relative">
              {/* BADGE "SOLO HOY" */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg animate-bounce">
                  ⚡ SOLO HOY ⚡
                </div>
              </div>

              {/* Mensaje personalizado - "Felicítalo primero" */}
              <div className="bg-green-500/20 border border-green-400/50 rounded-xl px-4 py-2 mb-3 mt-4">
                <p className="text-green-300 text-sm font-semibold">
                  🎉 ¡Increíble! Nivel {levelJustCompleted} completado
                </p>
                <p className="text-green-200/80 text-xs">
                  Te has ganado esta oferta exclusiva
                </p>
              </div>

              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-spin-slow" />
              </div>
              
              <h2 className="text-2xl font-bold text-yellow-400 mb-1 drop-shadow-lg">
                ¡OFERTA EXCLUSIVA!
              </h2>
              
              {/* Timer URGENTE - 30 minutos */}
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-3 transition-all ${
                isUrgent 
                  ? 'bg-red-600/80 animate-pulse border-2 border-red-400' 
                  : 'bg-black/50 border border-yellow-400/30'
              }`}>
                <Clock className={`w-4 h-4 ${isUrgent ? 'text-white animate-bounce' : 'text-yellow-300'}`} />
                <span className={`font-mono font-bold text-lg ${isUrgent ? 'text-white' : 'text-yellow-300'}`}>
                  {formatTime(timeLeft)}
                </span>
                {isUrgent && <span className="text-white text-xs">¡RÁPIDO!</span>}
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl p-4 mb-4 border-2 border-yellow-400/50 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Gift className="w-7 h-7 text-yellow-400 animate-bounce" />
                <h3 className="text-xl font-bold text-white">
                  STARTER PACK
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-white mb-4">
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <span className="font-bold text-yellow-300 text-sm">500 Gemas</span>
                </div>
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span className="text-xl">❤️</span>
                  <span className="font-bold text-red-300 text-sm">10 Vidas</span>
                </div>
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span className="text-xl">🔨</span>
                  <span className="font-bold text-blue-300 text-sm">3 Power-ups</span>
                </div>
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <span className="font-bold text-purple-300 text-sm">1 Revive</span>
                </div>
              </div>
              
              {/* Precio con valor percibido aumentado */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Valor real</p>
                  <span className="text-gray-400 line-through text-xl">€9.99</span>
                </div>
                <div className="text-center">
                  <p className="text-yellow-300 text-xs font-bold">HOY</p>
                  <span className="text-4xl font-bold text-yellow-400 drop-shadow-lg animate-pulse">{price}</span>
                </div>
              </div>
              
              <div className="inline-block bg-gradient-to-r from-green-600 to-green-500 rounded-full px-5 py-1.5 shadow-lg">
                <p className="text-white font-bold text-sm">🔥 90% DESCUENTO 🔥</p>
              </div>
            </div>

            <Button 
              onClick={handleBuy}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 text-black font-bold py-6 rounded-xl text-xl shadow-lg shadow-yellow-500/50 transform hover:scale-105 transition-all active:scale-95"
            >
              {loading ? '⏳ Procesando...' : '🎁 ¡COMPRAR AHORA!'}
            </Button>

            <p className="text-yellow-300/60 text-xs mt-2">
              💳 Pago seguro con Stripe
            </p>

            <Button 
              onClick={handleDismiss}
              variant="ghost"
              className="w-full text-white/30 hover:text-white/50 mt-1 text-xs"
            >
              No, prefiero pagar precio completo después
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
