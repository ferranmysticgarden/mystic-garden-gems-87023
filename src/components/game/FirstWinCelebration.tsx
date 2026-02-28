import { useState, useEffect } from 'react';
import { Star, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti';

interface FirstWinCelebrationProps {
  levelsCompleted: number;
  onClose: () => void;
}

export const FirstWinCelebration = ({ levelsCompleted, onClose }: FirstWinCelebrationProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  const odId = user?.id || 'guest';

  useEffect(() => {
    const firstWinKey = `first-win-celebrated-${odId}`;
    const alreadyCelebrated = localStorage.getItem(firstWinKey);

    // Show after first level completion
    if (levelsCompleted === 1 && !alreadyCelebrated) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(firstWinKey, 'true');
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#4ECDC4', '#FF6B6B', '#9B59B6'],
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [levelsCompleted, odId]);

  const handleContinue = () => {
    setShow(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-emerald-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Trophy */}
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>

        {/* Positive reinforcement message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-300 mb-3">
            ¡Perfecto! 🎉
          </h2>
          <p className="text-emerald-100 text-lg mb-2">
            Ya sabes jugar
          </p>
          <div className="bg-emerald-500/20 rounded-xl p-3 border border-emerald-400/30">
            <p className="text-yellow-300 font-semibold">
              ✨ Este juego es para ti ✨
            </p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((star) => (
            <Star 
              key={star} 
              className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" 
              style={{ animationDelay: `${star * 150}ms` }}
            />
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={handleContinue}
          className="w-full py-5 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-300 shadow-lg"
        >
          🌸 ¡Seguir Jugando!
        </Button>

        <p className="text-center text-emerald-300/50 text-xs mt-4">
          Nivel 1 de 100 completado
        </p>
      </div>
    </div>
  );
};
