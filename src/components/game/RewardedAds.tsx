import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RewardedAdsProps {
  onRewardEarned?: (gems: number) => void;
}

export const RewardedAds = ({ onRewardEarned }: RewardedAdsProps) => {
  const [loading, setLoading] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { user } = useAuth();

  useEffect(() => {
    if (showingAd && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showingAd && countdown === 0) {
      completeAdWatch();
    }
  }, [showingAd, countdown]);

  const handleWatchAd = () => {
    if (!user?.id || loading) return;
    setLoading(true);
    setShowingAd(true);
    setCountdown(5);
  };

  const completeAdWatch = async () => {
    if (!user?.id) return;
    
    const reward = 20;

    const { data: gameState } = await supabase
      .from('game_progress')
      .select('gems')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gameState) {
      await supabase
        .from('game_progress')
        .update({
          gems: (gameState.gems || 0) + reward
        })
        .eq('user_id', user.id);
    }

    onRewardEarned?.(reward);
    setShowingAd(false);
    setLoading(false);
  };

  // Modal del anuncio simulado con mensaje emocional
  if (showingAd) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        {/* Contenido del anuncio con mensaje emocional */}
        <div className="w-full max-w-md p-6 text-center">
          <div className="mb-6">
            <Sparkles className="w-20 h-20 text-yellow-400 mx-auto animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            🌸 Mystic Garden 🌸
          </h2>
          <p className="text-xl text-purple-300 mb-2">
            ¡El mejor juego de puzzles!
          </p>
          <p className="text-muted-foreground mb-8">
            Resuelve niveles, colecciona flores y gana recompensas
          </p>
          
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-8">
            <p className="text-white text-lg font-semibold mb-2">
              🎁 ¡Oferta Especial!
            </p>
            <p className="text-white/80">
              Pack de 500 gemas + 10 vidas
            </p>
            <p className="text-2xl font-bold text-yellow-300 mt-2">
              Solo €0.99
            </p>
          </div>

          {/* Contador con animación más lenta */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-green-500/30">
              <span className="text-3xl font-bold text-white">{countdown}</span>
            </div>
            <p className="text-muted-foreground">Tu recompensa está casi lista...</p>
          </div>
        </div>

        {/* Barra de progreso mejorada */}
        <div className="absolute bottom-20 left-0 right-0 px-8">
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 transition-all duration-1000 rounded-full"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            🌸 Gracias por apoyar el jardín 🌸
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-800/50 to-indigo-800/50 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-purple-600 rounded-full p-2">
          <Play className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold">
            Ver anuncio = 20 gemas 💎
          </p>
          <p className="text-purple-200 text-sm">
            Gana gemas gratis viendo anuncios
          </p>
        </div>
      </div>
      
      <Button
        onClick={handleWatchAd}
        disabled={loading}
        size="sm"
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold"
      >
        <Play className="w-4 h-4 mr-1" />
        Ver ad
      </Button>
    </div>
  );
};
