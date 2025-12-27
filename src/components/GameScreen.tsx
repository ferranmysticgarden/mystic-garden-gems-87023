import { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './Board';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Level } from '@/data/levels';
import confetti from 'canvas-confetti';

interface GameScreenProps {
  level: Level;
  onWin: (stars: number, reward: { gems?: number }) => void;
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

  const winTimeoutRef = useRef<number | null>(null);
  const loseTimeoutRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (winTimeoutRef.current) window.clearTimeout(winTimeoutRef.current);
      if (loseTimeoutRef.current) window.clearTimeout(loseTimeoutRef.current);
      try {
        confetti.reset();
      } catch {
        // ignore
      }
    };
  }, []);

  const checkWinCondition = useCallback(() => {
    if (level.objective.type === 'score') {
      return score >= level.objective.count;
    } else if (level.objective.type === 'collect') {
      return (collected[level.objective.target] || 0) >= level.objective.count;
    }
    return false;
  }, [level, score, collected]);

  useEffect(() => {
    if (gameOver || finishedRef.current) return;

    if (checkWinCondition()) {
      finishedRef.current = true;
      setGameOver(true);
      setWon(true);

      // Calculate stars
      let stars = 1;
      const finalScore =
        level.objective.type === 'score' ? score : (collected[level.objective.target] || 0);
      if (finalScore >= level.stars.three) stars = 3;
      else if (finalScore >= level.stars.two) stars = 2;

      // IMPORTANT: programamos onWin ANTES del confetti para que nunca se quede colgado
      if (winTimeoutRef.current) window.clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = window.setTimeout(() => onWin(stars, level.reward), 2000);

      // Confetti effect (puede fallar en algunos entornos móviles)
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.warn('[GameScreen] confetti failed', e);
      }
    } else if (moves === 0) {
      finishedRef.current = true;
      setGameOver(true);
      setWon(false);

      if (loseTimeoutRef.current) window.clearTimeout(loseTimeoutRef.current);
      loseTimeoutRef.current = window.setTimeout(() => onLose(), 2000);
    }
  }, [moves, score, collected, checkWinCondition, gameOver, level, onWin, onLose]);

  const handleMatch = useCallback((tiles: string[], count: number) => {
    setScore((prev) => prev + count * 10);

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

  const getObjectiveText = () => {
    if (level.objective.type === 'score') {
      return `${t('game.collect')} ${level.objective.count} ${t('game.points')}`;
    }
    return `${t('game.collect')} ${level.objective.count} ${level.objective.target}`;
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
              <div className="text-2xl font-bold">{moves}</div>
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
          
          <div className="mt-3 text-center text-sm">
            {getObjectiveText()}
          </div>
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

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="gradient-card shadow-card rounded-2xl p-8 text-center max-w-sm mx-4">
              <h2 className={`text-4xl font-bold mb-4 ${won ? 'text-gold' : 'text-destructive'}`}>
                {won ? t('game.win') : t('game.lose')}
              </h2>
              {won && (
                <div className="text-2xl mb-4">
                  🎉 {t('game.score')}: {score} 🎉
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
