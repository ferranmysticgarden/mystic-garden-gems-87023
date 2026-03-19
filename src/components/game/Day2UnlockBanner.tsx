import { useState, useEffect } from 'react';
import { Gift, X, Sparkles, Star, Zap, Crown, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface Day2UnlockBannerProps {
  streak: number;
  onClaimReward: (gems: number, lives: number, powerUps?: { hammers?: number }) => void;
}

export const Day2UnlockBanner = ({ streak, onClaimReward }: Day2UnlockBannerProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  return null; // DESACTIVADO
  const [claiming, setClaiming] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  const MEGA_GEMS = 200;
  const MEGA_LIVES = 5;
  const MEGA_HAMMERS = 3;

  const odId = user?.id || 'guest';

  useEffect(() => {
    const day2ClaimedKey = `day2-mega-claimed-${odId}`;
    const today = new Date().toISOString().split('T')[0];
    const day2ShownKey = `day2-mega-shown-${odId}-${today}`;
    const alreadyClaimed = localStorage.getItem(day2ClaimedKey);
    const alreadyShownToday = localStorage.getItem(day2ShownKey);

    if ((streak === 2 || streak === 3) && !alreadyClaimed && !alreadyShownToday) {
      const timer = setTimeout(() => {
        localStorage.setItem(day2ShownKey, 'true');
        setShow(true);
        setTimeout(() => setAnimationPhase(1), 200);
        setTimeout(() => setAnimationPhase(2), 600);
        setTimeout(() => setAnimationPhase(3), 1000);
        setTimeout(() => setShowGlow(true), 1200);

        confetti({
          particleCount: 18,
          spread: 70,
          origin: { y: 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFE55C'],
          scalar: 1,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [streak, odId]);

  const handleClaim = () => {
    setClaiming(true);
    
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#00FF88', '#FF69B4'],
      scalar: 1.5,
    });
    
    confetti({
      particleCount: 45,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FFA500'],
      scalar: 1.1,
    });

    localStorage.setItem(`day2-mega-claimed-${odId}`, 'true');
    
    setTimeout(() => {
      onClaimReward(MEGA_GEMS, MEGA_LIVES, { hammers: MEGA_HAMMERS });
      setShow(false);
    }, 2000);
  };

  const handleDismiss = () => {
    localStorage.setItem(`day2-mega-claimed-${odId}`, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-700">
      <div className={`relative bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-6 max-w-sm w-full border-4 border-yellow-400 shadow-2xl transition-all duration-700 ${animationPhase >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} ${showGlow ? 'shadow-yellow-500/60 shadow-2xl' : ''}`}>
        {showGlow && (
          <>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-yellow-400/30 via-orange-400/30 to-yellow-400/30 animate-pulse blur-xl" />
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse blur-2xl" style={{ animationDelay: '500ms' }} />
          </>
        )}
        
        <div className="relative flex justify-end">
          <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`relative text-center mb-4 transition-all duration-500 ${animationPhase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex justify-center items-center gap-1 mb-3">
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
            <Crown className="w-14 h-14 text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-lg" />
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
          </div>
          
          <div className="relative">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300">
              ¡MEGA REGALO!
            </h2>
            <p className="text-3xl font-black text-white mt-1">
              DÍA {streak} 🎉
            </p>
          </div>
          
          <p className="text-purple-200/80 mt-2 text-sm">
            ¡Volviste! Mereces algo <span className="text-yellow-300 font-bold">ESPECIAL</span>
          </p>
        </div>

        <div className={`relative bg-black/50 rounded-2xl p-4 mb-5 border-2 border-yellow-400/60 overflow-hidden transition-all duration-500 ${animationPhase >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <Sparkles className="w-40 h-40 text-yellow-400/10 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          
          <div className="relative grid grid-cols-3 gap-3">
            <div className="text-center animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.5s' }}>
              <div className="bg-gradient-to-b from-blue-500/30 to-purple-500/30 rounded-xl p-3 border border-blue-400/40">
                <div className="text-4xl font-black text-white drop-shadow-lg">{MEGA_GEMS}</div>
                <div className="text-3xl">💎</div>
                <p className="text-blue-300 font-bold text-xs mt-1">GEMAS</p>
              </div>
            </div>
            
            <div className="text-center animate-bounce" style={{ animationDelay: '100ms', animationDuration: '1.5s' }}>
              <div className="bg-gradient-to-b from-red-500/30 to-pink-500/30 rounded-xl p-3 border border-red-400/40">
                <div className="text-4xl font-black text-white drop-shadow-lg">{MEGA_LIVES}</div>
                <div className="text-3xl">❤️</div>
                <p className="text-red-300 font-bold text-xs mt-1">VIDAS</p>
              </div>
            </div>
            
            <div className="text-center animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.5s' }}>
              <div className="bg-gradient-to-b from-amber-500/30 to-orange-500/30 rounded-xl p-3 border border-amber-400/40">
                <div className="text-4xl font-black text-white drop-shadow-lg">{MEGA_HAMMERS}</div>
                <div className="text-3xl">🔨</div>
                <p className="text-amber-300 font-bold text-xs mt-1">MARTILLOS</p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <span className="text-white/60 text-xs">Valor real: </span>
            <span className="text-white/40 line-through text-sm">€4.99</span>
            <span className="text-green-400 font-bold text-lg ml-2">¡GRATIS!</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 mb-4 border border-green-400/30">
          <p className="text-center text-green-200 text-sm">
            🌱 <span className="font-semibold">Tu jardín te esperaba...</span><br/>
            <span className="text-green-300/80 text-xs">Cada día que vuelves, crece más fuerte</span>
          </p>
        </div>

        <Button
          onClick={handleClaim}
          disabled={claiming}
          className="relative w-full py-7 text-xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:from-yellow-400 hover:via-orange-400 hover:to-yellow-400 border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 transition-all hover:scale-105 active:scale-95"
        >
          <Gift className="w-7 h-7 mr-2" />
          {claiming ? '✨ ¡ABRIENDO REGALO! ✨' : '🎁 ¡RECLAMAR TODO!'}
        </Button>

        <p className="text-center text-white/40 text-xs mt-4">
          Este regalo solo aparece <span className="text-yellow-400">UNA VEZ</span>
        </p>
      </div>
    </div>
  );
};
