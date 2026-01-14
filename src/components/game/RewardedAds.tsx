import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RewardedAdsProps {
  onRewardEarned?: (gems: number) => void;
}

export const RewardedAds = ({ onRewardEarned }: RewardedAdsProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleWatchAd = async () => {
    if (!user?.id || loading) return;

    setLoading(true);

    // Simular anuncio de 3 segundos (en producción sería 30s)
    setTimeout(async () => {
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
      setLoading(false);
    }, 3000);
  };

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
        {loading ? (
          '⏳ Viendo...'
        ) : (
          <>
            <Play className="w-4 h-4 mr-1" />
            Ver ad
          </>
        )}
      </Button>
    </div>
  );
};
