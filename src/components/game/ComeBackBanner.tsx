import { useState, useEffect } from 'react';
import { Gift, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface ComeBackBannerProps {
  onClaimReward: (gems: number, lives: number) => void;
}

export const ComeBackBanner = ({ onClaimReward }: ComeBackBannerProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [daysAway, setDaysAway] = useState(0);
  const [claiming, setClaiming] = useState(false);

  const odId = user?.id || 'guest';

  useEffect(() => {
    const lastSessionKey = `last-session-${odId}`;
    const claimedKey = `comeback-claimed-${odId}`;
    const lastSession = localStorage.getItem(lastSessionKey);
    const alreadyClaimed = localStorage.getItem(claimedKey);
    const today = new Date().toISOString().split('T')[0];

    // Update last session
    localStorage.setItem(lastSessionKey, today);

    // Check if coming back after 2+ days
    if (lastSession && !alreadyClaimed) {
      const lastDate = new Date(lastSession);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 2) {
        setDaysAway(diffDays);
        setShow(true);
      }
    }
  }, [odId]);

  const calculateReward = () => {
    const baseGems = 20;
    const bonusGems = Math.min(daysAway * 10, 50);
    const lives = Math.min(Math.floor(daysAway / 2) + 2, 5);
    
    return { gems: baseGems + bonusGems, lives };
  };

  const handleClaim = () => {
    setClaiming(true);
    const reward = calculateReward();
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
    });

    localStorage.setItem(`comeback-claimed-${odId}`, new Date().toISOString().split('T')[0]);
    
    setTimeout(() => {
      onClaimReward(reward.gems, reward.lives);
      setShow(false);
    }, 500);
  };

  const handleDismiss = () => {
    localStorage.setItem(`comeback-claimed-${odId}`, new Date().toISOString().split('T')[0]);
    setShow(false);
  };

  if (!show) return null;

  const reward = calculateReward();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-emerald-400 shadow-2xl">
        <div className="flex justify-end">
          <button onClick={handleDismiss} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">👋</div>
          <h2 className="text-2xl font-bold text-emerald-300 mb-2">
            ¡Te Echamos de Menos!
          </h2>
          <p className="text-emerald-100/80">
            Han pasado <span className="text-yellow-300 font-bold">{daysAway} días</span> desde tu última visita
          </p>
        </div>

        <div className="bg-black/30 rounded-2xl p-4 mb-6 border border-emerald-400/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-300 font-semibold">Regalo de Bienvenida</span>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <span className="text-3xl">{reward.gems}</span>
              <span className="text-2xl">💎</span>
              <p className="text-xs text-emerald-300/70">Gemas</p>
            </div>
            <div className="text-center">
              <span className="text-3xl">{reward.lives}</span>
              <span className="text-2xl">❤️</span>
              <p className="text-xs text-emerald-300/70">Vidas</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-5 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-yellow-400 shadow-lg"
        >
          <Gift className="w-5 h-5 mr-2" />
          {claiming ? '¡Reclamando!' : '¡Reclamar Regalo!'}
        </Button>

        <p className="text-center text-emerald-300/50 text-xs mt-4">
          🎮 ¡Juega cada día para ganar más recompensas!
        </p>
      </div>
    </div>
  );
};
