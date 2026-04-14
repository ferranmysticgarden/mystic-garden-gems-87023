import { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './Board';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { LEVELS, Level } from '@/data/levels';
import { CloseDefeatOffer } from './game/CloseDefeatOffer';
import { GemsBanner } from './game/GemsBanner';
import { FlashOffer } from './game/FlashOffer';
import { ComboMultiplier } from './game/ComboMultiplier';
import { BuyMovesOffer } from './game/BuyMovesOffer';
import { DefeatPacksOffer } from './game/DefeatPacksOffer';
import { Level10Paywall } from './game/Level10Paywall';
import { Level6Offer } from './game/Level6Offer';
import { UltimateRescueOffer } from './game/UltimateRescueOffer';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { FirstMoveHint } from './game/FirstMoveHint';
import { useMysticSounds } from '@/hooks/useMysticSounds';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { usePurchaseGate } from '@/hooks/usePurchaseGate';
import { useAttemptTracker } from '@/hooks/useAttemptTracker';
import confetti from 'canvas-confetti';
import { usePendingPurchase } from '@/hooks/usePendingPurchase';

interface GameScreenProps {
  level: Level;
  onWin: (stars: number, reward: { gems?: number }) => void;
  onLose: () => void;
  onBack: () => void;
  onShowExitModal: () => void;
  initialMoves?: number;
  initialScore?: number;
  initialCollected?: Record<string, number>;
}

export const GameScreen = ({ 
  level, 
  onWin, 
  onLose, 
  onBack, 
  onShowExitModal,
  initialMoves,
  initialScore,
  initialCollected,
}: GameScreenProps) => {
  const { t } = useLanguage();
  const [moves, setMoves] = useState(initialMoves ?? level.moves);
  const [score, setScore] = useState(initialScore ?? 0);
  const [collected, setCollected] = useState<Record<string, number>>(initialCollected ?? {});
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showCloseDefeatOffer, setShowCloseDefeatOffer] = useState(false);
  const [showFlashOffer, setShowFlashOffer] = useState(false);
  const [showBuyMovesOffer, setShowBuyMovesOffer] = useState(false);
  const [showDefeatPacksOffer, setShowDefeatPacksOffer] = useState(false);
  const [showLevel10Paywall, setShowLevel10Paywall] = useState(false);
  const [showLevel6Offer, setShowLevel6Offer] = useState(false);
  const [showRescueOffer, setShowRescueOffer] = useState(false);
  const [rescueData, setRescueData] = useState({ attempts: 0, movesShort: 0, levelNumber: 1 });
  const [movesShortBy, setMovesShortBy] = useState(0);
  const [combo, setCombo] = useState(0);
  const [progressAtLoss, setProgressAtLoss] = useState(0);
  const [showNearWinMessage, setShowNearWinMessage] = useState(false);
  const hasPlayedEndSound = useRef(false);
  const hasShownFlashOffer = useRef(false);
  const hasShownBuyMoves = useRef(false);
  
  const { hasPurchasedOnce } = usePurchaseGate();
  const { savePendingState } = usePendingPurchase();
  const { getAttempts, incrementAttempt, resetAttempts } = useAttemptTracker();
  
  const { playVictorySound, playLoseSound } = useMysticSounds();

  useEffect(() => {
    backgroundMusic.setScreen('game');
    return () => {
      backgroundMusic.setScreen('menu');
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

  const getProgressPercentage = useCallback(() => {
    if (level.objective.type === 'score') {
      return (score / level.objective.count) * 100;
    } else {
      const current = collected[level.objective.target] || 0;
      return (current / level.objective.count) * 100;
    }
  }, [level, score, collected]);

  const estimateMovesNeeded = useCallback(() => {
    const progress = getProgressPercentage();
    if (progress >= 100) return 0;
    if (progress >= 80) return Math.ceil((100 - progress) / 15);
    if (progress >= 60) return Math.ceil((100 - progress) / 10);
    return Math.ceil((100 - progress) / 8);
  }, [getProgressPercentage]);

  const saveCurrentLevelPurchaseState = useCallback((productId: string) => {
    savePendingState({
      levelId: level.id,
      moves,
      score,
      collected,
      productId,
    });
  }, [savePendingState, level.id, moves, score, collected]);

  useEffect(() => {
    if (checkWinCondition() && !gameOver) {
      setGameOver(true);
      setWon(true);
      
      if (!hasPlayedEndSound.current) {
        hasPlayedEndSound.current = true;
        backgroundMusic.setScreen('victory');
        playVictorySound();
      }

      // Reset intentos al ganar
      try {
        resetAttempts(level.id);
      } catch (error) {
        console.error('Error reseteando intentos:', error);
      }
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (moves === 0 && !checkWinCondition() && !gameOver) {
      const movesNeeded = estimateMovesNeeded();
      setMovesShortBy(movesNeeded);
      
      const progress = getProgressPercentage();

      const showDefeatOffer = () => {
        // MURO NIVEL 10
        const paywallAlreadyShown = localStorage.getItem('level10_paywall_dismissed') === 'true';
        if (level.id === 10 && !hasPurchasedOnce && !paywallAlreadyShown) {
          saveCurrentLevelPurchaseState('buy_moves');
          setProgressAtLoss(progress);
          setMovesShortBy(movesNeeded);
          emitAnalyticsEvent('level10_popup_shown', { level: 10, progress, movesShort: movesNeeded });
          setShowLevel10Paywall(true);
          return;
        }

        // UltimateRescueOffer - nueva oferta principal
        try {
          const attempts = incrementAttempt(level.id);
          const shouldShowRescue = 
            level.id >= 6 &&
            movesNeeded <= 3 &&
            !showRescueOffer;
          
          if (shouldShowRescue) {
            saveCurrentLevelPurchaseState('continue_game');
            setRescueData({ 
              attempts, 
              movesShort: movesNeeded,
              levelNumber: level.id 
            });
            setShowRescueOffer(true);
            return;
          }
        } catch (error) {
          console.error('Error en handleDefeat:', error);
        }

        // Game over final
        setGameOver(true);
        setWon(false);

        if (!hasPlayedEndSound.current) {
          hasPlayedEndSound.current = true;
          backgroundMusic.setScreen('defeat');
          playLoseSound();
        }

        setProgressAtLoss(progress);

        if (progress >= 40) {
          emitAnalyticsEvent('defeat_pack_shown', { level: level.id, progress });
          setShowDefeatPacksOffer(true);

          if (!hasShownFlashOffer.current && !localStorage.getItem('flash_offer_shown_session')) {
            hasShownFlashOffer.current = true;
          }
        }
      };

      if (progress >= 80) {
        setShowNearWinMessage(true);
        setTimeout(() => {
          setShowNearWinMessage(false);
          showDefeatOffer();
        }, 1000);
      } else {
        showDefeatOffer();
      }
    }
  }, [moves, score, collected, checkWinCondition, gameOver, level, playVictorySound, playLoseSound, getProgressPercentage, estimateMovesNeeded, hasPurchasedOnce, saveCurrentLevelPurchaseState]);

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

  const handleCloseDefeatBuy = () => {
    setMoves(5);
    setGameOver(false);
    setShowCloseDefeatOffer(false);
  };

  const handleCloseDefeatDismiss = () => {
    setShowCloseDefeatOffer(false);
    
    if (hasShownFlashOffer.current && !localStorage.getItem('flash_offer_shown_session')) {
      localStorage.setItem('flash_offer_shown_session', 'true');
      setShowFlashOffer(true);
    }
  };

  const handleFlashOfferClose = () => {
    setShowFlashOffer(false);
  };

  const handleBuyMovesBuy = () => {
    setMoves(5);
    setShowBuyMovesOffer(false);
    hasShownBuyMoves.current = false;
  };

  const handleBuyMovesDismiss = () => {
    setShowBuyMovesOffer(false);
    setGameOver(true);
    setWon(false);
    
    if (!hasPlayedEndSound.current) {
      hasPlayedEndSound.current = true;
      backgroundMusic.setScreen('defeat');
      playLoseSound();
    }
    
    const progress = getProgressPercentage();
    setProgressAtLoss(progress);
    
    if (progress >= 40) {
      emitAnalyticsEvent('defeat_pack_shown', { level: level.id, progress });
      setShowDefeatPacksOffer(true);
    }
  };

  const handleDefeatPacksBuy = () => {
    setShowDefeatPacksOffer(false);
  };

  const handleDefeatPacksExit = () => {
    setShowDefeatPacksOffer(false);
    if (hasShownFlashOffer.current && !localStorage.getItem('flash_offer_shown_session')) {
      localStorage.setItem('flash_offer_shown_session', 'true');
      emitAnalyticsEvent('flash_offer_shown', { level: level.id });
      setShowFlashOffer(true);
    }
  };

  const handleLevel10Purchase = () => {
    setMoves(5);
    setShowLevel10Paywall(false);
  };
 
  const handleLevel10Dismiss = () => {
    localStorage.setItem('level10_paywall_dismissed', 'true');
    setShowLevel10Paywall(false);
    setGameOver(true);
    setWon(false);
    
    if (!hasPlayedEndSound.current) {
      hasPlayedEndSound.current = true;
      backgroundMusic.setScreen('defeat');
      playLoseSound();
    }
  };

  const handleLevel6Purchase = () => {
    setMoves(3);
    setShowLevel6Offer(false);
  };

  const handleLevel6Dismiss = () => {
    setShowLevel6Offer(false);
    setGameOver(true);
    setWon(false);
    
    if (!hasPlayedEndSound.current) {
      hasPlayedEndSound.current = true;
      backgroundMusic.setScreen('defeat');
      playLoseSound();
    }
  };

  // Handlers para UltimateRescueOffer
  const handleRescueBuy = () => {
    setShowRescueOffer(false);
    setMoves(prev => prev + 5);
  };

  const handleRescueDismiss = () => {
    setShowRescueOffer(false);
    // Mostrar pantalla de derrota normal
    setGameOver(true);
    setWon(false);
    
    if (!hasPlayedEndSound.current) {
      hasPlayedEndSound.current = true;
      backgroundMusic.setScreen('defeat');
      playLoseSound();
    }
  };

  const getProgress = () => {
    if (level.objective.type === 'score') {
      return `${score} / ${level.objective.count}`;
    }
    return `${collected[level.objective.target] || 0} / ${level.objective.count}`;
  };

  return (
    <div className="min-h-screen pt-8 px-4 pb-4 flex flex-col relative z-10">
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
            <button 
              onClick={onBack} 
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/20 border-2 border-destructive/50 hover:bg-destructive/30 active:scale-90 transition-transform duration-100"
              aria-label="Salir del nivel"
            >
              <span className="text-destructive text-xl font-bold">✕</span>
            </button>
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
        </div>

        {/* Gems Purchase Banner - SOLO nivel 5+ */}
        {level.id >= 5 && (
          <GemsBanner 
            onPurchaseSuccess={() => {
              setMoves(prev => prev + 5);
            }}
          />
        )}

        {/* First Move Hint (non-blocking, Level 1 only) */}
        <FirstMoveHint levelId={level.id} />

        {/* Board */}
        <div className="flex-1 flex items-center justify-center">
          <Board
            onMatch={handleMatch}
            onMove={handleMove}
            targetTile={level.objective.type === 'collect' ? level.objective.target : undefined}
            disabled={gameOver}
          />
        </div>

        {/* Near Win Emotional Message */}
        {showNearWinMessage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 pointer-events-none">
            <div className="text-center animate-scale-in">
              <div className="text-7xl mb-3">😱</div>
              <h2 className="text-3xl font-bold text-accent drop-shadow-lg">¡CASI LO CONSEGUISTE!</h2>
              <p className="text-xl text-foreground/90 mt-2">Solo te faltaba un poco más...</p>
            </div>
          </div>
        )}

        {/* Combo Multiplier */}
        <ComboMultiplier combo={combo} onComboEnd={handleComboEnd} />

        {/* Close Defeat Offer */}
        {showCloseDefeatOffer && (
          <CloseDefeatOffer 
            movesShort={movesShortBy}
            onBuy={handleCloseDefeatBuy}
            onDismiss={handleCloseDefeatDismiss}
          />
        )}

        {/* Flash Offer */}
        {showFlashOffer && (
          <FlashOffer 
            trigger="loss"
            onClose={handleFlashOfferClose}
          />
        )}

        {/* Buy Moves Offer */}
        {showBuyMovesOffer && (
          <BuyMovesOffer 
            onBuy={handleBuyMovesBuy}
            onDismiss={handleBuyMovesDismiss}
            movesShort={movesShortBy}
          />
        )}

        {/* DefeatPacksOffer */}
        {showDefeatPacksOffer && (
          <DefeatPacksOffer 
            progressPercent={progressAtLoss}
            onPurchase={handleDefeatPacksBuy}
            onDismiss={handleDefeatPacksExit}
        />
        )}

        {/* Level 6 Offer */}
        {showLevel6Offer && (
          <Level6Offer
            onBuy={handleLevel6Purchase}
            onDismiss={handleLevel6Dismiss}
            progressPercent={progressAtLoss}
          />
        )}

        {/* Level 10 Paywall */}
        {showLevel10Paywall && (
         <Level10Paywall 
           onPurchaseSuccess={handleLevel10Purchase}
           onDismiss={handleLevel10Dismiss}
           movesShort={movesShortBy}
           progressPercent={progressAtLoss}
         />
        )}

        {/* UltimateRescueOffer - nueva oferta de rescate */}
        {showRescueOffer && (
          <UltimateRescueOffer
            levelNumber={rescueData.levelNumber}
            attempts={rescueData.attempts}
            movesShort={rescueData.movesShort}
            starsEarned={0}
            onBuy={handleRescueBuy}
            onDismiss={handleRescueDismiss}
          />
        )}

        {/* Game Over Overlay */}
        {gameOver && !showCloseDefeatOffer && !showFlashOffer && !showDefeatPacksOffer && !showBuyMovesOffer && !showLevel6Offer && !showRescueOffer && (
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
              <Button
                onClick={() => won ? onWin(1, level.reward) : onLose()}
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
