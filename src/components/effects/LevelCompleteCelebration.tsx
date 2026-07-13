import { useEffect, useRef, useState } from 'react';
import { Star, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import confetti from 'canvas-confetti';

interface LevelCompleteCelebrationProps {
  levelId: number;
  gemsEarned: number;
  score: number;
  onContinue: () => void;
  onExit?: () => void;
}

const FAIRY_SRC = '/celebration/fairy_trophy.png';
const FANFARE_SRC = '/celebration/fanfare.mp3';
const APPLAUSE_SRC = '/celebration/applause.mp3';

export const LevelCompleteCelebration = ({
  levelId,
  gemsEarned,
  score,
  onContinue,
  onExit,
}: LevelCompleteCelebrationProps) => {
  const { t, language } = useLanguage();
  const [gemCount, setGemCount] = useState(0);
  const [fairyOk, setFairyOk] = useState(true);
  const playedRef = useRef(false);

  const title = t('celebration.title');
  const sub = t('celebration.subtitle').replace('{level}', String(levelId));
  const earned = t('celebration.earned');
  const gemsLabel = t('celebration.gems');
  const cta = t('celebration.next');
  const scoreLabel = t('game.score');

  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;

    // Sounds (fail silently if asset missing)
    try {
      const fanfare = new Audio(FANFARE_SRC);
      fanfare.volume = 0.55;
      fanfare.play().catch(() => {});
      const applause = new Audio(APPLAUSE_SRC);
      applause.volume = 0.35;
      setTimeout(() => applause.play().catch(() => {}), 350);
    } catch {}

    // Epic confetti sequence
    confetti({
      particleCount: 180,
      spread: 110,
      origin: { y: 0.3 },
      colors: ['#FFD700', '#4ECDC4', '#FF6B6B', '#9B59B6', '#FFFF00'],
    });
    setTimeout(() => confetti({
      particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.6 },
      colors: ['#FFD700', '#FFA500'],
    }), 350);
    setTimeout(() => confetti({
      particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.6 },
      colors: ['#FFD700', '#FFA500'],
    }), 700);
    setTimeout(() => confetti({
      particleCount: 120, spread: 140, origin: { y: 0.5 },
      colors: ['#a78bfa', '#f0abfc', '#FFD700'],
    }), 1100);

    // Gem counter
    if (gemsEarned > 0) {
      let count = 0;
      const stepMs = Math.max(20, Math.min(60, 800 / gemsEarned));
      const interval = setInterval(() => {
        count += 1;
        if (count >= gemsEarned) {
          clearInterval(interval);
          setGemCount(gemsEarned);
        } else {
          setGemCount(count);
        }
      }, stepMs);
      return () => clearInterval(interval);
    }
  }, [gemsEarned]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 animate-fade-in">
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 border-4 border-yellow-400/60 shadow-2xl animate-scale-in overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, hsl(270 60% 22%) 0%, hsl(250 55% 18%) 50%, hsl(220 60% 22%) 100%)',
          boxShadow:
            '0 0 60px rgba(255, 215, 0, 0.45), 0 0 120px rgba(168, 85, 247, 0.35)',
        }}
      >
        {/* Close button (X) — vuelve al menú principal manteniendo la recompensa */}
        {onExit && (
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onExit}
            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center text-white active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Sparkle particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Sparkles className="absolute top-4 left-6 w-5 h-5 text-yellow-300/60 animate-pulse" />
          <Sparkles className="absolute top-10 right-8 w-4 h-4 text-yellow-300/50 animate-pulse" style={{ animationDelay: '200ms' }} />
          <Sparkles className="absolute bottom-20 left-10 w-5 h-5 text-yellow-300/55 animate-pulse" style={{ animationDelay: '400ms' }} />
          <Sparkles className="absolute bottom-10 right-6 w-4 h-4 text-yellow-300/60 animate-pulse" style={{ animationDelay: '100ms' }} />
        </div>

        {/* Fairy */}
        <div className="relative z-10 flex justify-center mb-3">
          {fairyOk ? (
            <img
              src={FAIRY_SRC}
              alt=""
              onError={() => setFairyOk(false)}
              className="w-32 h-32 object-contain animate-bounce drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]"
              style={{ animationDuration: '1.4s' }}
            />
          ) : (
            <div className="text-7xl animate-bounce" style={{ animationDuration: '1.4s' }}>
              🧚‍♀️
            </div>
          )}
        </div>

        {/* Title */}
        <div className="relative z-10 text-center mb-3">
          <h2
            className="text-4xl font-extrabold mb-1 tracking-wide"
            style={{
              background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(255,215,0,0.3)',
            }}
          >
            {title}
          </h2>
          <p className="text-emerald-100 text-base">{sub}</p>
        </div>

        {/* Stars */}
        <div className="relative z-10 flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((star) => (
            <Star
              key={star}
              className="w-9 h-9 text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]"
              style={{ animationDelay: `${star * 150}ms` }}
            />
          ))}
        </div>

        {/* Gem reward */}
        {gemsEarned > 0 && (
          <div className="relative z-10 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl p-4 border-2 border-yellow-400/50 mb-3">
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl animate-bounce" style={{ animationDuration: '0.9s' }}>💎</span>
              <div>
                <p className="text-xs text-yellow-200/80">{earned}</p>
                <p className="text-4xl font-bold text-yellow-300 tabular-nums leading-tight">
                  +{gemCount}
                </p>
                <p className="text-xs text-yellow-300/80 font-semibold tracking-widest">{gemsLabel}</p>
              </div>
            </div>
          </div>
        )}

        {score > 0 && (
          <div className="relative z-10 text-center mb-4 text-sm text-emerald-200/80">
            {scoreLabel}: <span className="font-bold text-white">{score.toLocaleString()}</span>
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={onContinue}
          className="relative z-10 w-full py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-300 shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
        >
          {cta}
        </Button>
      </div>
    </div>
  );
};
