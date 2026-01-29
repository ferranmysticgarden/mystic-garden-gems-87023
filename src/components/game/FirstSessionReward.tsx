import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Crown, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FirstSessionRewardProps {
  levelJustCompleted: number;
  onClaim: (gems: number, lives: number) => void;
  onClose: () => void;
}

export const FirstSessionReward = ({ levelJustCompleted, onClaim, onClose }: FirstSessionRewardProps) => {
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Only show after completing level 5 for the first time
  useEffect(() => {
    const hasClaimedFirstSession = localStorage.getItem('first_session_reward_claimed');
    
    if (levelJustCompleted === 5 && !hasClaimedFirstSession) {
      // Delay to let victory screen settle
      const timer = setTimeout(() => {
        setVisible(true);
        // Celebration effect
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1']
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [levelJustCompleted]);

  const handleClaim = () => {
    setClaimed(true);
    localStorage.setItem('first_session_reward_claimed', 'true');
    
    // Fire more confetti on claim
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 }
    });

    // Delay to show celebration
    setTimeout(() => {
      onClaim(100, 5); // 100 gems + 5 lives (full refill)
      onClose();
    }, 1500);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="relative max-w-sm w-full">
        {/* Animated glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
        
        <div className="relative bg-gradient-to-b from-amber-900/95 via-orange-900/95 to-red-900/95 rounded-2xl p-6 border-2 border-yellow-500/50 shadow-2xl">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Crown icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="w-20 h-20 text-yellow-400 animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-yellow-300 mb-2">
            🎉 ¡INCREÍBLE! 🎉
          </h2>
          <p className="text-center text-white/90 text-lg mb-1">
            ¡Completaste 5 niveles en tu primera sesión!
          </p>
          <p className="text-center text-yellow-200/80 text-sm mb-6">
            Te mereces un regalo especial 🎁
          </p>

          {/* Rewards display */}
          <div className="bg-black/30 rounded-xl p-4 mb-6 border border-yellow-500/30">
            <p className="text-center text-yellow-200 text-sm mb-3 font-semibold">
              REGALO DE PRIMERA SESIÓN
            </p>
            <div className="flex justify-center items-center gap-6">
              <div className="text-center">
                <div className="text-4xl mb-1 animate-bounce">💎</div>
                <div className="text-2xl font-bold text-cyan-400">+100</div>
                <div className="text-xs text-white/60">Gemas</div>
              </div>
              <div className="text-3xl text-yellow-400">+</div>
              <div className="text-center">
                <div className="text-4xl mb-1 animate-bounce" style={{ animationDelay: '0.2s' }}>❤️</div>
                <div className="text-2xl font-bold text-red-400">+5</div>
                <div className="text-xs text-white/60">Vidas</div>
              </div>
              <div className="text-3xl text-yellow-400">+</div>
              <div className="text-center">
                <div className="text-4xl mb-1 animate-bounce" style={{ animationDelay: '0.4s' }}>📦</div>
                <div className="text-xl font-bold text-amber-400">1x</div>
                <div className="text-xs text-white/60">Cofre</div>
              </div>
            </div>
          </div>

          {/* Claim button */}
          {!claimed ? (
            <Button
              onClick={handleClaim}
              className="w-full py-6 text-xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 text-white shadow-lg animate-pulse"
            >
              <Gift className="w-6 h-6 mr-2" />
              ¡RECLAMAR REGALO!
            </Button>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2 animate-bounce">🎊</div>
              <p className="text-yellow-300 font-bold text-xl">¡Reclamado!</p>
            </div>
          )}

          {/* Motivational footer */}
          <p className="text-center text-white/50 text-xs mt-4">
            ¡Eres parte del 5% que llega tan lejos en su primer día! 🌟
          </p>
        </div>
      </div>
    </div>
  );
};
