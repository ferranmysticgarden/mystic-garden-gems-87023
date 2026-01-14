import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const FirstDayOffer = () => {
  const [show, setShow] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const checkEligibility = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.created_at) return;

      const accountAge = Date.now() - new Date(profile.created_at).getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      if (accountAge < oneDay) {
        const hasSeenOffer = localStorage.getItem(`first-day-offer-${user.id}`);
        if (!hasSeenOffer) {
          setShow(true);
        }
      }
    };

    checkEligibility();
  }, [user?.id]);

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

  const handleClaim = async () => {
    if (!user?.id) return;
    localStorage.setItem(`first-day-offer-${user.id}`, 'true');
    setShow(false);
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
      <div className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl animate-scale-in">
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-2 animate-pulse" />
          
          <h2 className="text-2xl font-bold text-yellow-400 mb-1">
            ¡OFERTA ESPECIAL!
          </h2>
          
          <p className="text-purple-200 text-sm mb-4">
            Solo para nuevos jugadores
          </p>

          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 mb-4">
            <div className="text-4xl mb-2">🎁</div>
            
            <h3 className="text-xl font-bold text-white mb-3">
              MEGA PACK INICIAL
            </h3>
            
            <div className="text-left space-y-1 text-white mb-4">
              <p>✅ 500 gemas 💎</p>
              <p>✅ 10 vidas ❤️</p>
              <p>✅ Sin anuncios 24h</p>
              <p>✅ Power-up especial</p>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-gray-400 line-through text-lg">€9.99</span>
              <span className="text-3xl font-bold text-yellow-400">€0.99</span>
            </div>
            <p className="text-green-400 font-semibold">¡90% de descuento!</p>
          </div>

          <div className="text-orange-400 font-semibold mb-4">
            ⏰ Expira en: {formatTime(timeLeft)}
          </div>

          <Button 
            onClick={handleClaim}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 rounded-xl text-lg"
          >
            ¡COMPRAR AHORA! 🎉
          </Button>

          <p className="text-purple-300 text-xs mt-3">
            Oferta válida solo una vez
          </p>
        </div>
      </div>
    </div>
  );
};
