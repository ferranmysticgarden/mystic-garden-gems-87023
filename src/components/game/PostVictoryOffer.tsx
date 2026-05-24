import { Button } from '@/components/ui/button';
import { Sparkles, Star } from 'lucide-react';
import { trackEvent } from '@/lib/trackEvent';

interface PostVictoryOfferProps {
  baseGems: number;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export const PostVictoryOffer = ({ baseGems, onClose, onPurchaseSuccess }: PostVictoryOfferProps) => {
  const handleClaim = () => {
    trackEvent('victory_reward_claimed', {
      gems: baseGems,
      trigger: 'post_victory'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative bg-gradient-to-b from-green-900 via-emerald-900 to-teal-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-green-400 shadow-2xl animate-scale-in overflow-hidden">
        {/* Celebration particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#00FF00', '#FF69B4'][i % 3],
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>

        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-1 mb-3">
            <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
            <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
            <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-bold text-green-300 mb-2">
            🎉 ¡LO HAS CONSEGUIDO!
          </h2>
          
          <p className="text-emerald-200 text-sm mb-6">
            ¡Victoria épica! Has completado el desafío con éxito.
          </p>

          <div className="bg-gradient-to-r from-yellow-500/20 to-green-500/20 rounded-2xl p-6 mb-6 border border-yellow-400/30">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-1">Tu recompensa</p>
              <p className="text-4xl font-bold text-white flex items-center justify-center gap-2">
                {baseGems} <span className="text-2xl">💎</span>
              </p>
            </div>
          </div>

          <Button 
            onClick={handleClaim}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-extrabold py-6 rounded-xl text-xl shadow-lg shadow-yellow-500/30 animate-bounce-subtle"
          >
            <Sparkles className="w-6 h-6 mr-2" />
            ¡RECLAMAR Y CONTINUAR!
          </Button>
        </div>
      </div>
    </div>
  );
};
