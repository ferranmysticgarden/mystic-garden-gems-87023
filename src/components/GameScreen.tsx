import { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './Board';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { LEVELS, Level } from '@/data/levels';
import { CloseDefeatOffer } from './game/CloseDefeatOffer';
import { FlashOffer } from './game/FlashOffer';
import { ComboMultiplier } from './game/ComboMultiplier';
import { BuyMovesOffer } from './game/BuyMovesOffer';
import { DefeatPacksOffer } from './game/DefeatPacksOffer';
import { Level10Paywall } from './game/Level10Paywall';
import { Level6Offer } from './game/Level6Offer';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { useMysticSounds } from '@/hooks/useMysticSounds';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { usePurchaseGate } from '@/hooks/usePurchaseGate';
import confetti from 'canvas-confetti';
import { usePendingPurchase } from '@/hooks/usePendingPurchase';

interface GameScreenProps {
  level: Level;
  onWin: (stars: number, reward: { gems?: number }) => void;
  onLose: () => void;
  onBack: () => void;
  onShowExitModal: () => void;
  // Para restaurar estado después de pago
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
  const [movesShortBy, setMovesShortBy] = useState(0);
  const [combo, setCombo] = useState(0);
  const [progressAtLoss, setProgressAtLoss] = useState(0);
  const [showNearWinMessage, setShowNearWinMessage] = useState(false);
  const hasPlayedEndSound = useRef(false);
  const hasShownFlashOffer = useRef(false);
  const hasShownBuyMoves = useRef(false);
  
  // Hook para verificar si ya compró
  const { hasPurchasedOnce } = usePurchaseGate();
  const { savePendingState } = usePendingPurchase();
  
  // Use mystical fairy sounds
  const { playVictorySound, playLoseSound } = useMysticSounds();

  // Set music to very low during gameplay
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

  // Calcular qué tan cerca estuvo el jugador de ganar
  const getProgressPercentage = useCallback(() => {
    if (level.objective.type === 'score') {
      return (score / level.objective.count) * 100;
    } else {
      const current = collected[level.objective.target] || 0;
      return (current / level.objective.count) * 100;
    }
  }, [level, score, collected]);

  // Estimar cuántos movimientos le faltaron (aproximado)
  const estimateMovesNeeded = useCallback(() => {
    const progress = getProgressPercentage();
    if (progress >= 100) return 0;
    // Si llegó al 80%+, probablemente le faltaban 2-3 movimientos
    if (progress >= 80) return Math.ceil((100 - progress) / 15);
    // Si llegó al 60%+, probablemente le faltaban 4-5
    if (progress >= 60) return Math.ceil((100 - progress) / 10);
    return Math.ceil((100 - progress) / 8);
  }, [getProgressPercentage]);

  useEffect(() => {
    if (checkWinCondition() && !gameOver) {
      setGameOver(true);
      setWon(true);
      
      if (!hasPlayedEndSound.current) {
        hasPlayedEndSound.current = true;
        backgroundMusic.setScreen('victory');
        playVictorySound();
      }
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (moves === 0 && !checkWinCondition() && !gameOver) {
      // Player ran out of moves - calculate how close they were
      const movesNeeded = estimateMovesNeeded();
      setMovesShortBy(movesNeeded);
      
      const progress = getProgressPercentage();

      // Helper: lógica que decide qué oferta mostrar
      const showDefeatOffer = () => {
        // MURO NIVEL 10
        const paywallAlreadyShown = localStorage.getItem('level10_paywall_dismissed') === 'true';
        if (level.id === 10 && !hasPurchasedOnce && !paywallAlreadyShown) {
          savePendingState({
            levelId: level.id,
            moves: 0,
            score,
            collected,
            productId: 'buy_moves',
          });
          setProgressAtLoss(progress);
          setMovesShortBy(movesNeeded);
          emitAnalyticsEvent('level10_popup_shown', { level: 10, progress, movesShort: movesNeeded });
          setShowLevel10Paywall(true);
          return;
        }

        // OFERTA NIVEL 6
        const level6AlreadyShown = localStorage.getItem('level6_offer_dismissed') === 'true';
        if (level.id === 6 && !level6AlreadyShown) {
          if (progress >= 50) {
            setProgressAtLoss(progress);
            emitAnalyticsEvent('level6_popup_shown', { level: 6, progress });
            setShowLevel6Offer(true);
            return;
          }
        }

        // Buy moves offer BEFORE defeat (otros niveles)
        if (!hasShownBuyMoves.current) {
          hasShownBuyMoves.current = true;
          emitAnalyticsEvent('buy_moves_offer_shown', { level: level.id });
          setShowBuyMovesOffer(true);
          return;
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

      // MICRO-VICTORIA EMOCIONAL: si progreso >= 80%, mostrar mensaje 1s antes de oferta
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
  }, [moves, score, collected, checkWinCondition, gameOver, level, playVictorySound, playLoseSound, getProgressPercentage, estimateMovesNeeded, hasPurchasedOnce]);

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
    // Reset combo on move without match (handled by match timing)
  }, []);

  const handleComboEnd = useCallback(() => {
    setCombo(0);
  }, []);

  const handleCloseDefeatBuy = () => {
    // User bought - add 5 moves and continue
    setMoves(5);
    setGameOver(false);
    setShowCloseDefeatOffer(false);
  };

  const handleCloseDefeatDismiss = () => {
    setShowCloseDefeatOffer(false);
    
    // Si es primera derrota cercana, mostrar Flash Offer
    if (hasShownFlashOffer.current && !localStorage.getItem('flash_offer_shown_session')) {
      localStorage.setItem('flash_offer_shown_session', 'true');
      setShowFlashOffer(true);
    }
  };

  const handleFlashOfferClose = () => {
    setShowFlashOffer(false);
  };

  // Handler para comprar movimientos ANTES de perder
  const handleBuyMovesBuy = () => {
    setMoves(5);
    setShowBuyMovesOffer(false);
    hasShownBuyMoves.current = false; // Reset para siguiente vez
  };

  const handleBuyMovesDismiss = () => {
    setShowBuyMovesOffer(false);
    // Ahora sí es game over
    setGameOver(true);
    setWon(false);
    
    if (!hasPlayedEndSound.current) {
      hasPlayedEndSound.current = true;
      backgroundMusic.setScreen('defeat');
      playLoseSound();
    }
    
    const progress = getProgressPercentage();
    setProgressAtLoss(progress);
    
    // Mostrar DefeatPacksOffer si llegó al 40%+
    if (progress >= 40) {
      emitAnalyticsEvent('defeat_pack_shown', { level: level.id, progress });
      setShowDefeatPacksOffer(true);
    }
  };

  // Handler para compra en DefeatPacksOffer (multi-tier)
  const handleDefeatPacksBuy = () => {
    setMoves(5); // Los movimientos dependen del pack pero el básico da +5
    setGameOver(false);
    setShowDefeatPacksOffer(false);
  };

  const handleDefeatPacksExit = () => {
    setShowDefeatPacksOffer(false);
    // Mostrar Flash Offer si aplica
    if (hasShownFlashOffer.current && !localStorage.getItem('flash_offer_shown_session')) {
      localStorage.setItem('flash_offer_shown_session', 'true');
      emitAnalyticsEvent('flash_offer_shown', { level: level.id });
      setShowFlashOffer(true);
    }
  };

  // Handler para compra exitosa en Level10Paywall
  const handleLevel10Purchase = () => {
    setMoves(5); // +5 movimientos
    setShowLevel10Paywall(false);
    // El nivel continúa - no es game over
  };
 
   // Handler para cerrar Level10Paywall SIN pagar
   // Va a pantalla de derrota estándar, NO al menú
   const handleLevel10Dismiss = () => {
     // Marcar como mostrado para NO volver a mostrarlo en reintentos
     localStorage.setItem('level10_paywall_dismissed', 'true');
     setShowLevel10Paywall(false);
     setGameOver(true);
     setWon(false);
     
     if (!hasPlayedEndSound.current) {
       hasPlayedEndSound.current = true;
       backgroundMusic.setScreen('defeat');
       playLoseSound();
     }
     // NO mostrar otras ofertas - derrota limpia
   };

  // Handler para compra exitosa en Level6Offer
  const handleLevel6Purchase = () => {
    setMoves(3); // +3 movimientos
    setShowLevel6Offer(false);
    // El nivel continúa - no es game over
  };

  // Handler para cerrar Level6Offer SIN pagar
  const handleLevel6Dismiss = () => {
    setShowLevel6Offer(false);
    setGameOver(true);
    setWon(false);
    
    if (!hasPlayedEndSound.current) {
      hasPlayedEndSound.current = true;
      backgroundMusic.setScreen('defeat');
      playLoseSound();
    }
    // Derrota normal, sin otra oferta inmediata
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
            <button 
              onClick={onShowExitModal} 
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/20 border-2 border-destructive/50 hover:bg-destructive/30 hover:scale-110 transition-all duration-150"
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <div className="text-center animate-scale-in">
              <div className="text-7xl mb-3">😱</div>
              <h2 className="text-3xl font-bold text-yellow-400 drop-shadow-lg">¡Casi lo logras!</h2>
              <p className="text-xl text-white/90 mt-2">Estuviste MUY cerca...</p>
            </div>
          </div>
        )}

        {/* Combo Multiplier */}
        <ComboMultiplier combo={combo} onComboEnd={handleComboEnd} />

        {/* Close Defeat Offer - oferta simple cuando pierde por poco */}
        {showCloseDefeatOffer && (
          <CloseDefeatOffer 
            movesShort={movesShortBy}
            onBuy={handleCloseDefeatBuy}
            onDismiss={handleCloseDefeatDismiss}
          />
        )}

        {/* Flash Offer - aparece después de primera derrota cercana */}
        {showFlashOffer && (
          <FlashOffer 
            trigger="loss"
            onClose={handleFlashOfferClose}
          />
        )}

        {/* Buy Moves Offer - ANTES de perder cuando quedan 0 movimientos */}
        {showBuyMovesOffer && (
          <BuyMovesOffer 
            onBuy={handleBuyMovesBuy}
            onDismiss={handleBuyMovesDismiss}
            movesShort={movesShortBy}
          />
        )}

        {/* DefeatPacksOffer - Modal multi-tier después de perder */}
        {showDefeatPacksOffer && (
          <DefeatPacksOffer 
            progressPercent={progressAtLoss}
            onPurchase={handleDefeatPacksBuy}
            onDismiss={handleDefeatPacksExit}
        />
        )}

        {/* Level 6 Offer - oferta neutra primera derrota cercana */}
        {showLevel6Offer && (
          <Level6Offer
            onBuy={handleLevel6Purchase}
            onDismiss={handleLevel6Dismiss}
            progressPercent={progressAtLoss}
          />
        )}

        {/* Level 10 Paywall - FORZADO, no se puede cerrar */}
        {showLevel10Paywall && (
         <Level10Paywall 
           onPurchaseSuccess={handleLevel10Purchase}
           onDismiss={handleLevel10Dismiss}
           movesShort={movesShortBy}
           progressPercent={progressAtLoss}
         />
        )}

        {/* Game Over Overlay - only show after all offers are dismissed or if won */}
        {gameOver && !showCloseDefeatOffer && !showFlashOffer && !showDefeatPacksOffer && !showBuyMovesOffer && !showLevel6Offer && (
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
