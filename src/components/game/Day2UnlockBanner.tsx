import { useState, useEffect } from 'react';
import { Gift, X, Sparkles, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface Day2UnlockBannerProps {
  streak: number;
  onClaimReward: (gems: number, lives: number) => void;
}

export const Day2UnlockBanner = ({ streak, onClaimReward }: Day2UnlockBannerProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const day2ClaimedKey = `day2-unlock-claimed-${user.id}`;
    const alreadyClaimed = localStorage.getItem(day2ClaimedKey);

    // Show on day 2 or 3 of streak, only once
    if ((streak === 2 || streak === 3) && !alreadyClaimed) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [streak, user?.id]);

  const handleClaim = () => {
    if (!user?.id) return;

    setClaiming(true);
    
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6'],
    });

    localStorage.setItem(`day2-unlock-claimed-${user.id}`, 'true');
    
    setTimeout(() => {
      onClaimReward(50, 3); // 50 gems + 3 lives
      setShow(false);
    }, 800);
  };

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`day2-unlock-claimed-${user.id}`, 'true');
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-amber-900 via-yellow-900 to-orange-900 rounded-3xl p-6 max-w-sm w-full border-4 border-yellow-400 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <div className="flex justify-end">
          <button onClick={handleDismiss} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <Unlock className="w-16 h-16 text-yellow-400 animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">
            ¡DESBLOQUEADO! 🎉
          </h2>
          <p className="text-yellow-100/80">
            ¡Gracias por volver el <span className="text-yellow-300 font-bold">Día {streak}</span>!
          </p>
          <p className="text-yellow-100/60 text-sm mt-1">
            Aquí tienes un regalo especial
          </p>
        </div>

        {/* Reward Preview */}
        <div className="bg-black/30 rounded-2xl p-4 mb-6 border border-yellow-400/30">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gift className="w-6 h-6 text-yellow-400" />
            <span className="text-yellow-300 font-bold">Regalo Día {streak}</span>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <span className="text-4xl font-bold text-white">50</span>
              <span className="text-3xl ml-1">💎</span>
              <p className="text-xs text-yellow-300/70 mt-1">Gemas</p>
            </div>
            <div className="text-center">
              <span className="text-4xl font-bold text-white">3</span>
              <span className="text-3xl ml-1">❤️</span>
              <p className="text-xs text-yellow-300/70 mt-1">Vidas</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-5 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-yellow-300 shadow-lg"
        >
          <Gift className="w-5 h-5 mr-2" />
          {claiming ? '¡Reclamando...!' : '¡Reclamar Regalo!'}
        </Button>

        <p className="text-center text-yellow-300/50 text-xs mt-4">
          🔥 Sigue jugando cada día para más recompensas
        </p>
      </div>
    </div>
  );
};
