import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Star, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StarterPackProps {
  levelJustCompleted: number;
  onClose: () => void;
}

export const StarterPack = ({ levelJustCompleted, onClose }: StarterPackProps) => {
  const [show, setShow] = useState(false);
  const [timeLeft, setTimeLeft] = useState(86400); // 24 hours in seconds
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Solo mostrar después de nivel 3 o 4
    if (levelJustCompleted !== 3 && levelJustCompleted !== 4) return;

    const hasSeenOffer = localStorage.getItem(`starter-pack-${user.id}`);
    if (!hasSeenOffer) {
      // Small delay to let win celebration show first
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [levelJustCompleted, user?.id]);

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

  const handleBuy = async () => {
    if (!user?.id || loading) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { productId: 'starter_pack' }
      });

      if (error) throw error;
      if (data?.url) {
        localStorage.setItem(`starter-pack-${user.id}`, 'true');
        window.open(data.url, '_blank');
        setShow(false);
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`starter-pack-${user.id}`, 'true');
    }
    setShow(false);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-yellow-900 via-amber-800 to-orange-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl animate-scale-in overflow-hidden">
        {/* Animated sparkles background */}
        <div className="absolute inset-0 overflow-hidden">
          <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-300/40 animate-pulse" />
          <Sparkles className="absolute top-8 right-6 w-4 h-4 text-yellow-300/30 animate-pulse delay-75" />
          <Sparkles className="absolute bottom-12 left-8 w-5 h-5 text-yellow-300/35 animate-pulse delay-150" />
          <Sparkles className="absolute bottom-6 right-4 w-6 h-6 text-yellow-300/40 animate-pulse delay-100" />
        </div>

        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white z-20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center relative z-10">
          {/* Golden glow effect */}
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 to-transparent opacity-60 blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-yellow-400 mb-1 drop-shadow-lg">
              ¡OFERTA DE BIENVENIDA!
            </h2>
            
            <p className="text-amber-200 text-sm mb-1">
              Solo para nuevos jugadores
            </p>
            
            {/* Timer */}
            <div className="inline-flex items-center gap-2 bg-black/40 rounded-full px-4 py-1 mb-4">
              <span className="text-yellow-300 text-xs">⏰ Disponible:</span>
              <span className="text-white font-bold text-sm">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl p-4 mb-4 border-2 border-yellow-400/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-8 h-8 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">
                STARTER PACK
              </h3>
            </div>
            
            <div className="space-y-2 text-white mb-4">
              <p className="flex items-center justify-center gap-2 text-lg">
                <span className="text-2xl">💎</span>
                <span className="font-bold text-yellow-300">500 Gemas</span>
              </p>
              <p className="flex items-center justify-center gap-2 text-lg">
                <span className="text-2xl">❤️</span>
                <span className="font-bold text-red-300">10 Vidas</span>
              </p>
              <p className="flex items-center justify-center gap-2 text-lg">
                <span className="text-2xl">🔨</span>
                <span className="font-bold text-blue-300">3 Power-ups</span>
              </p>
              <p className="flex items-center justify-center gap-2 text-lg">
                <span className="text-2xl">✨</span>
                <span className="font-bold text-purple-300">1 Revive Gratis</span>
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-gray-400 line-through text-xl">€4.99</span>
              <span className="text-4xl font-bold text-yellow-400 drop-shadow-lg">€0.99</span>
            </div>
            <div className="inline-block bg-green-500/80 rounded-full px-4 py-1">
              <p className="text-white font-bold">80% DESCUENTO</p>
            </div>
          </div>

          <Button 
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 text-black font-bold py-5 rounded-xl text-xl shadow-lg shadow-yellow-500/40"
          >
            {loading ? '⏳ Procesando...' : '🎁 ¡COMPRAR AHORA!'}
          </Button>

          <Button 
            onClick={handleDismiss}
            variant="ghost"
            className="w-full text-white/40 hover:text-white/60 mt-2 text-xs"
          >
            No, gracias
          </Button>
        </div>
      </div>
    </div>
  );
};
