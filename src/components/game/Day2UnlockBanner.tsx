import { useState, useEffect } from 'react';
import { Gift, X, Sparkles, Star, Zap } from 'lucide-react';
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
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const day2ClaimedKey = `day2-unlock-claimed-${user.id}`;
    const alreadyClaimed = localStorage.getItem(day2ClaimedKey);

    if ((streak === 2 || streak === 3) && !alreadyClaimed) {
      const timer = setTimeout(() => {
        setShow(true);
        // Start glow animation
        setTimeout(() => setShowGlow(true), 300);
        // Entrance confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.4 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [streak, user?.id]);

  const handleClaim = () => {
    if (!user?.id) return;

    setClaiming(true);
    
    // MEGA confetti explosion
    const duration = 2000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#00FF88'],
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#00FF88'],
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    localStorage.setItem(`day2-unlock-claimed-${user.id}`, 'true');
    
    setTimeout(() => {
      onClaimReward(50, 3);
      setShow(false);
    }, 1500);
  };

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(`day2-unlock-claimed-${user.id}`, 'true');
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className={`relative bg-gradient-to-b from-amber-800 via-yellow-900 to-orange-900 rounded-3xl p-6 max-w-sm w-full border-4 border-yellow-400 shadow-2xl animate-in zoom-in-95 duration-500 ${showGlow ? 'shadow-yellow-500/50' : ''}`}>
        {/* Animated glow effect */}
        {showGlow && (
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-yellow-400/20 animate-pulse" />
        )}
        
        {/* Close button */}
        <div className="relative flex justify-end">
          <button onClick={handleDismiss} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MEGA Header */}
        <div className="relative text-center mb-4">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
            <Star className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-bounce" />
            <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 animate-pulse">
            ¡BONUS DE BIENVENIDA!
          </h2>
          <p className="text-yellow-100/80 mt-2">
            Día <span className="text-yellow-300 font-bold text-xl">{streak}</span> en Mystic Garden 🌸
          </p>
        </div>

        {/* MEGA Reward Display */}
        <div className="relative bg-black/40 rounded-2xl p-5 mb-5 border-2 border-yellow-400/50 overflow-hidden">
          {/* Sparkle overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-32 h-32 text-yellow-400/10 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          
          <div className="relative flex justify-center gap-10">
            <div className="text-center animate-bounce" style={{ animationDelay: '0ms' }}>
              <div className="text-5xl font-black text-white drop-shadow-lg">50</div>
              <div className="text-4xl">💎</div>
              <p className="text-yellow-300 font-bold text-sm mt-1">GEMAS</p>
            </div>
            <div className="text-center animate-bounce" style={{ animationDelay: '150ms' }}>
              <div className="text-5xl font-black text-white drop-shadow-lg">3</div>
              <div className="text-4xl">❤️</div>
              <p className="text-yellow-300 font-bold text-sm mt-1">VIDAS</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleClaim}
          disabled={claiming}
          className="relative w-full py-6 text-xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:from-yellow-400 hover:via-orange-400 hover:to-yellow-400 border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 animate-pulse"
        >
          <Gift className="w-6 h-6 mr-2" />
          {claiming ? '✨ ¡RECLAMANDO! ✨' : '🎁 ¡RECLAMAR AHORA!'}
        </Button>

        <p className="text-center text-yellow-300/60 text-xs mt-4">
          ¡Gracias por volver! 🙏
        </p>
      </div>
    </div>
  );
};
