import { useState, useEffect, useCallback } from 'react';
import { Board } from './Board';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { LEVELS, Level } from '@/data/levels';
import { LoseBundle } from './game/LoseBundle';
import { ComboMultiplier } from './game/ComboMultiplier';
import { LevelWinCelebration } from './game/LevelWinCelebration';
import { OnboardingMessage } from './game/OnboardingMessage';
import confetti from 'canvas-confetti';

// Audio para derrota
let loseAudioCtx: AudioContext | null = null;
const getLoseAudioContext = () => {
  if (!loseAudioCtx) {
    loseAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return loseAudioCtx;
};

const playLoseSound = () => {
  try {
    const ctx = getLoseAudioContext();
    
    // Notas descendentes tristes
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
    
    // Bajo triste final
    setTimeout(() => {
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.value = 100;
      bassGain.gain.setValueAtTime(0.2, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      bass.start();
      bass.stop(ctx.currentTime + 0.5);
    }, 700);
  } catch (e) {}
};

interface GameScreenProps {
  level: Level;
  onWin: (stars: number, reward: { gems?: number }, usedPowerups: boolean) => void;
  onLose: () => void;
  onBack: () => void;
}

export const GameScreen = ({ level, onWin, onLose, onBack }: GameScreenProps) => {
  const { t } = useLanguage();
  const [moves, setMoves] = useState(level.moves);
  const [score, setScore] = useState(0);
  const [collected, setCollected] = useState<Record<string, number>>({});
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showLoseBundle, setShowLoseBundle] = useState(false);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [usedPowerups, setUsedPowerups] = useState(false);

  // Level 1 is impossible to lose - infinite moves
  const isFirstLevel = level.id === 1;

  const checkWinCondition = useCallback(() => {
    if (level.objective.type === 'score') {
      return score >= level.objective.count;
    } else if (level.objective.type === 'collect') {
      return (collected[level.objective.target] || 0) >= level.objective.count;
    }
    return false;
  }, [level, score, collected]);

  const calculateStars = useCallback(() => {
    const value = level.objective.type === 'score' 
      ? score 
      : (collected[level.objective.target] || 0);
    
    if (value >= level.stars.three) return 3;
    if (value >= level.stars.two) return 2;
    return 1;
  }, [level, score, collected]);

  useEffect(() => {
    if (checkWinCondition() && !gameOver) {
      setGameOver(true);
      setWon(true);
      setShowWinCelebration(true);
    } else if (moves === 0 && !checkWinCondition() && !gameOver) {
      // Level 1 can't be lost - give extra moves
      if (isFirstLevel) {
        setMoves(10); // Give 10 more moves
        return;
      }
      
      setGameOver(true);
      setWon(false);
      playLoseSound(); // Sonido de derrota
      // Show LoseBundle offer instead of immediate game over
      setShowLoseBundle(true);
    }
  }, [moves, score, collected, checkWinCondition, gameOver, level, isFirstLevel]);

  const handleMatch = useCallback((tiles: string[], count: number) => {
    setScore((prev) => prev + count * 10);
    setCombo((prev) => prev + 1);

    setCollected((prev) => {
      const next = { ...prev };
      tiles.forEach((tile) => {
        next[tile] = (next[tile] || 0) + 1;
      });
      return next;
    });
  }, []);

  const handleMove = useCallback(() => {
    setMoves((prev) => Math.max(0, prev - 1));
  }, []);

  const handleComboEnd = useCallback(() => {
    setCombo(0);
  }, []);

  const handleLoseBundleBuy = () => {
    // User bought the bundle - add 5 moves and continue
    setMoves(5);
    setGameOver(false);
    setShowLoseBundle(false);
    setUsedPowerups(true); // Buying extra moves counts as using powerup
  };

  const handleLoseBundleDismiss = () => {
    setShowLoseBundle(false);
    // Game over - show final screen
  };

  const handleWinContinue = () => {
    const stars = calculateStars();
    setShowWinCelebration(false);
    onWin(stars, level.reward, usedPowerups);
  };

  const getProgress = () => {
    if (level.objective.type === 'score') {
      return `${score} / ${level.objective.count}`;
    }
    return `${collected[level.objective.target] || 0} / ${level.objective.count}`;
  };

  return (
    <div className="min-h-screen p-4 flex flex-col relative z-10">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="gradient-card shadow-card rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={onBack} variant="outline" size="sm">
              ← {t('menu.levels')}
            </Button>
            <h2 className="text-xl font-bold text-gold">
              {t('game.level')} {level.id}
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">{t('game.moves')}</div>
              <div className={`text-2xl font-bold ${isFirstLevel ? 'text-emerald-400' : ''}`}>
                {isFirstLevel ? '∞' : moves}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">{t('game.score')}</div>
              <div className="text-2xl font-bold">{score}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">{t('game.objective')}</div>
              <div className="text-sm font-bold">{getProgress()}</div>
            </div>
          </div>
          
          {/* OBJETIVO CLARO Y VISIBLE */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-2 border-primary/30">
            <div className="flex items-center justify-center gap-3">
              {level.objective.type === 'collect' ? (
                <>
                  <span className="text-sm text-muted-foreground">{t('game.collect')}</span>
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1">
                    <span className="text-4xl animate-pulse">{level.objective.target}</span>
                    <span className="text-2xl font-bold text-gold">×{level.objective.count}</span>
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    ({collected[level.objective.target] || 0}/{level.objective.count})
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">{t('game.collect')}</span>
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1">
                    <span className="text-2xl">⭐</span>
                    <span className="text-2xl font-bold text-gold">{level.objective.count} pts</span>
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    ({score}/{level.objective.count})
                  </div>
                </>
              )}
            </div>
          </div>

          {/* First level indicator */}
          {isFirstLevel && (
            <div className="mt-3 text-center">
              <span className="text-sm text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full">
                ✨ Nivel de práctica - No puedes perder
              </span>
            </div>
          )}
        </div>

        {/* Board */}
        <div className="flex-1 flex items-center justify-center">
          <Board
            onMatch={handleMatch}
            onMove={handleMove}
            targetTile={level.objective.type === 'collect' ? level.objective.target : undefined}
            disabled={gameOver}
          />
        </div>

        {/* Combo Multiplier */}
        <ComboMultiplier combo={combo} onComboEnd={handleComboEnd} />

        {/* Onboarding Message for Level 1 */}
        {showOnboarding && (
          <OnboardingMessage 
            levelId={level.id} 
            onDismiss={() => setShowOnboarding(false)} 
          />
        )}

        {/* Level Win Celebration */}
        {showWinCelebration && (
          <LevelWinCelebration
            levelId={level.id}
            score={score}
            stars={calculateStars()}
            reward={level.reward}
            onContinue={handleWinContinue}
          />
        )}

        {/* LoseBundle Offer */}
        {showLoseBundle && (
          <LoseBundle 
            onBuy={handleLoseBundleBuy}
            onDismiss={handleLoseBundleDismiss}
          />
        )}

        {/* Game Over Overlay - only show after LoseBundle is dismissed (for losses) */}
        {gameOver && !showLoseBundle && !won && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="gradient-card shadow-card rounded-2xl p-8 text-center max-w-sm mx-4">
              <h2 className="text-4xl font-bold mb-4 text-destructive">
                {t('game.lose')}
              </h2>
              <p className="text-muted-foreground mb-4">
                ¡No te rindas! Inténtalo de nuevo.
              </p>
              <Button
                onClick={onLose}
                className="mt-4 gradient-gold shadow-gold text-lg py-4 px-8"
              >
                {t('game.continue')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
