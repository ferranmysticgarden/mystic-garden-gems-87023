import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface FirstDayOfferProps {
  levelJustCompleted?: number;
}

export const FirstDayOffer = ({ levelJustCompleted }: FirstDayOfferProps) => {
  const [show, setShow] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos - más urgencia
  const { user } = useAuth();
  const { createPayment, loading, getPrice } = usePayment();

  const price = getPrice('mega_pack_inicial', '€0.99');

  useEffect(() => {
    if (!user?.id) return;

    // Mostrar después de nivel 1 O si cuenta es nueva (< 2 horas)
    const checkEligibility = async () => {
      const hasSeenOffer = localStorage.getItem(`first-day-offer-${user.id}`);
      if (hasSeenOffer) return;

      // Si acaba de completar nivel 1, mostrar inmediatamente
      if (levelJustCompleted === 1) {
        setTimeout(() => setShow(true), 1500); // Delay para que no sea abrupto
        return;
      }

      // Fallback: mostrar si cuenta es muy nueva (< 2 horas)
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.created_at) return;

      const accountAge = Date.now() - new Date(profile.created_at).getTime();
      const twoHours = 2 * 60 * 60 * 1000;

      if (accountAge < twoHours) {
        setShow(true);
      }
    };

    checkEligibility();
  }, [user?.id, levelJustCompleted]);

  useEffect(() => {
    if (!show) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShow(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show]);

  const handleBuy = async () => {
    if (!user?.id || loading) return;
    
    const success = await createPayment('mega_pack_inicial');
    if (success) {
      console.log('[PURCHASE] success confirmed via FirstDayOffer');
      dispatchPurchaseCompleted('mega_pack_inicial');
      console.log('[PURCHASE] gate unlocked');
      localStorage.setItem(`first-day-offer-${user.id}`, 'true');
      setShow(false);
    }
  };

  const handleDismiss = () => {
    if (!user?.id) return;
    localStorage.setItem(`first-day-offer-${user.id}`, 'true');
    setShow(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-emerald-900 via-green-800 to-emerald-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl animate-scale-in">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400 rounded-3xl blur opacity-40 animate-pulse" />
        
        <div className="relative">
          <button 
            onClick={handleDismiss}
            className="absolute top-0 right-0 text-white/70 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            {/* Badge de urgencia */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-full animate-bounce shadow-lg">
                ⚡ SOLO 15 MIN ⚡
              </div>
            </div>

            <div className="pt-4">
              <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-2 animate-pulse" />
              
              <h2 className="text-xl font-bold text-yellow-400 mb-1">
                🎉 ¡BIENVENIDO AL JARDÍN!
              </h2>
              
              <p className="text-green-200 text-sm mb-3">
                Regalo exclusivo por tu primera partida
              </p>
            </div>

            <div className="bg-black/30 rounded-2xl p-4 mb-4 border border-yellow-400/30">
              <h3 className="text-lg font-bold text-white mb-3">
                🎁 MEGA PACK DE BIENVENIDA
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-white mb-4 text-sm">
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span>💎</span>
                  <span className="font-bold text-yellow-300">500 Gemas</span>
                </div>
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span>❤️</span>
                  <span className="font-bold text-red-300">10 Vidas</span>
                </div>
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span>🚫</span>
                  <span className="font-bold text-blue-300">24h Sin Ads</span>
                </div>
                <div className="bg-black/30 rounded-lg p-2 flex items-center gap-2">
                  <span>🔨</span>
                  <span className="font-bold text-purple-300">3 Power-ups</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Valor</p>
                  <span className="text-gray-400 line-through text-lg">€9.99</span>
                </div>
                <div className="text-center">
                  <p className="text-yellow-300 text-xs font-bold">HOY</p>
                  <span className="text-3xl font-bold text-yellow-400 animate-pulse">{price}</span>
                </div>
              </div>
              <div className="inline-block bg-green-500 rounded-full px-4 py-1">
                <p className="text-white font-bold text-sm">🔥 90% OFF 🔥</p>
              </div>
            </div>

            {/* Timer más visible */}
            <div className={`rounded-xl p-2 mb-4 ${timeLeft < 300 ? 'bg-red-500/50 animate-pulse' : 'bg-orange-500/30'}`}>
              <p className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-white' : 'text-orange-300'}`}>
                ⏰ {formatTime(timeLeft)} {timeLeft < 300 && '¡RÁPIDO!'}
              </p>
            </div>

            <Button 
              onClick={handleBuy}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-5 rounded-xl text-lg shadow-lg shadow-yellow-500/30"
            >
              {loading ? '⏳ Procesando...' : '🎁 ¡QUIERO MI REGALO!'}
            </Button>

            <Button 
              onClick={handleDismiss}
              variant="ghost"
              className="w-full text-white/30 hover:text-white/50 mt-2 text-xs"
            >
              No gracias, prefiero jugar sin ventajas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
