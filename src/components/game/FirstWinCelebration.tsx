import { useState, useEffect } from 'react';
import { Star, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface FirstWinCelebrationProps {
  levelsCompleted: number;
  gemsEarned?: number;
  onClose: () => void;
}

export const FirstWinCelebration = ({ levelsCompleted, gemsEarned = 15, onClose }: FirstWinCelebrationProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [gemCount, setGemCount] = useState(0);

  const odId = user?.id || 'guest';

  useEffect(() => {
    const firstWinKey = `first-win-celebrated-${odId}`;
    const alreadyCelebrated = localStorage.getItem(firstWinKey);

    if (levelsCompleted === 1 && !alreadyCelebrated) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(firstWinKey, 'true');
        
        // EPIC confetti sequence — 3 bursts
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.3 },
          colors: ['#FFD700', '#4ECDC4', '#FF6B6B', '#9B59B6', '#FFFF00'],
        });

        setTimeout(() => confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500'],
        }), 400);

        setTimeout(() => confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500'],
        }), 800);

        // Gem counter animation
        let count = 0;
        const interval = setInterval(() => {
          count += 1;
          if (count >= gemsEarned) {
            clearInterval(interval);
            setGemCount(gemsEarned);
          } else {
            setGemCount(count);
          }
        }, 50);

      }, 500);
      return () => clearTimeout(timer);
    }
  }, [levelsCompleted, odId, gemsEarned]);

  const handleContinue = () => {
    setShow(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-emerald-400/50 shadow-2xl animate-scale-in overflow-hidden relative">
        {/* Sparkle particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Sparkles className="absolute top-4 left-6 w-5 h-5 text-yellow-300/50 animate-pulse" />
          <Sparkles className="absolute top-12 right-8 w-4 h-4 text-yellow-300/40 animate-pulse" style={{ animationDelay: '200ms' }} />
          <Sparkles className="absolute bottom-16 left-10 w-5 h-5 text-yellow-300/45 animate-pulse" style={{ animationDelay: '400ms' }} />
          <Sparkles className="absolute bottom-8 right-6 w-4 h-4 text-yellow-300/50 animate-pulse" style={{ animationDelay: '100ms' }} />
        </div>

        {/* Trophy */}
        <div className="text-center mb-3 relative z-10">
          <div className="relative inline-block">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-4 relative z-10">
          <h2 className="text-3xl font-bold text-emerald-300 mb-2">
            ¡INCREÍBLE! 🎉
          </h2>
          <p className="text-emerald-100 text-lg mb-3">
            ¡Has completado tu primer nivel!
          </p>

          {/* GEM RAIN counter */}
          <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl p-4 border-2 border-yellow-400/50 mb-3">
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl animate-bounce">💎</span>
              <div>
                <p className="text-sm text-yellow-200/80">¡Has ganado!</p>
                <p className="text-4xl font-bold text-yellow-400 tabular-nums">
                  +{gemCount}
                </p>
                <p className="text-sm text-yellow-300/70 font-semibold">GEMAS</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/20 rounded-xl p-3 border border-emerald-400/30">
            <p className="text-yellow-300 font-semibold text-sm">
              ✨ ¡Eres un natural! Los niveles se ponen más emocionantes ✨
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-5">
          {[1, 2, 3].map((star) => (
            <Star 
              key={star} 
              className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-pulse" 
              style={{ animationDelay: `${star * 150}ms` }}
            />
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleContinue}
          className="w-full py-6 text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-300 shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          🌸 ¡Siguiente Nivel!
        </Button>

        <p className="text-center text-emerald-300/50 text-xs mt-3">
          Nivel 1 de 50 completado
        </p>
      </div>
    </div>
  );
};
