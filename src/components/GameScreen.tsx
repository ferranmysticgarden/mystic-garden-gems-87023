import { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './Board';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { LEVELS, Level } from '@/data/levels';
import { CloseDefeatOffer } from './game/CloseDefeatOffer';
import { GemsBanner } from './game/GemsBanner';
import { FlashOffer } from './game/FlashOffer';
import { ComboMultiplier } from './game/ComboMultiplier';
import { SuperComboBanner } from './game/SuperComboBanner';
import { BuyMovesOffer } from './game/BuyMovesOffer';
import { DefeatPacksOffer } from './game/DefeatPacksOffer';
import { Level10Paywall } from './game/Level10Paywall';
import { Level6Offer } from './game/Level6Offer';
import { UltimateRescueOffer } from './game/UltimateRescueOffer';
import { LevelCompleteCelebration } from './effects/LevelCompleteCelebration';
import { Level1Tutorial } from './game/Level1Tutorial';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { TILE_DEFAULT_EMOJIS, type TileType } from '@/constants/tileTypes';
import { useTileSkin } from '@/hooks/useTileSkin';
import { FirstMoveHint } from './game/FirstMoveHint';
import { useMysticSounds } from '@/hooks/useMysticSounds';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { usePurchaseGate } from '@/hooks/usePurchaseGate';
import { useAttemptTracker } from '@/hooks/useAttemptTracker';
import confetti from 'canvas-confetti';
import { usePendingPurchase } from '@/hooks/usePendingPurchase';
import { trackEvent } from "@/lib/trackEvent";
import { Hammer, RefreshCw, RotateCcw, Gem, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { gemPriceForRescue, incrementRescueCount, resetRescueCount, getRescueCount } from '@/utils/rescuePriceScale';
import { consumeWinStreakPowerup } from '@/utils/winStreakPowerup';
import { isRetryOfLevel, markLevelEntered } from '@/utils/retryTracker';

interface GameScreenProps {
  level: Level;
  onWin: (stars: number, reward: { gems?: number }) => void;
  onLose: (payload?: { progress_pct: number; progress_abs: number; target: number; moves_left: number }) => void;
  onBack: () => void;
  onQuit?: () => void;
  onShowExitModal: () => void;
  initialMoves?: number;
  initialScore?: number;
  initialCollected?: Record<string, number>;
  gems?: number;
  onSpendGems?: (amount: number) => void;
  hammers?: number;
  shuffles?: number;
  undos?: number;
  onUseHammer?: () => void;
  onUseShuffle?: () => void;
  onUseUndo?: () => void;
  consecutiveLossesOnLevel?: number;
}

export const GameScreen = ({ 
  level, 
  onWin, 
  onLose, 
  onBack, 
  onQuit,
  onShowExitModal,
  initialMoves,
  initialScore,
  initialCollected,
  gems = 0,
  onSpendGems,
  hammers = 0,
  shuffles = 0,
  undos = 0,
  onUseHammer,
  onUseShuffle,
  onUseUndo,
  consecutiveLossesOnLevel = 0,
}: GameScreenProps) => {
  const { t } = useLanguage();
  const tileSkins = useTileSkin();
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
  const [superComboMax, setSuperComboMax] = useState(0);
  const cascadeMaxRef = useRef(1);
  const cascadeTotalRef = useRef(0);
  const cascadeEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progressAtLoss, setProgressAtLoss] = useState(0);
  const [showNearWinMessage, setShowNearWinMessage] = useState(false);
  const [isHammerActive, setIsHammerActive] = useState(false);
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [firstMatchMade, setFirstMatchMade] = useState(false);
  const hasPlayedEndSound = useRef(false);
  const hasShownFlashOffer = useRef(false);
  const hasShownBuyMoves = useRef(false);
  
  const { hasPurchasedOnce } = usePurchaseGate();
  const { savePendingState } = usePendingPurchase();
  const { getAttempts, incrementAttempt, resetAttempts } = useAttemptTracker();
  
  const { playVictorySound, playLoseSound } = useMysticSounds();

  const startTime = useRef(Date.now());

  // CAMBIO 9 — isRetry: si reentras al mismo nivel en la sesión, se considera reintento
  const isRetry = useRef<boolean>(isRetryOfLevel(level.id));

  // Resetear estado al cambiar de nivel
  useEffect(() => {
    setShuffleTrigger(0);
    setUndoTrigger(0);
    setIsHammerActive(false);
    // CAMBIO 7 — consumir power-up por racha si está pendiente (3 victorias seguidas)
    if (!level.bonus && consumeWinStreakPowerup()) {
      try {
        // Concedemos 1 martillo extra en este nivel (no se aplica visualmente fuera; toast informa)
        trackEvent('win_streak_powerup_granted', { level: level.id });
        toast.success('🎁 ¡Racha de 3 victorias! Power-up extra activado');
      } catch {}
    }
    markLevelEntered(level.id);
    // CAMBIO 3 — confetti suave en bonus
    if (level.bonus) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 } });
        setTimeout(() => confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } }), 800);
      } catch {}
    }
  }, [level.id, level.bonus]);

  const handleQuit = useCallback(() => {
    const timePlayed = Math.floor((Date.now() - startTime.current) / 1000);
    const movesUsed = Math.max(0, (initialMoves ?? level.moves) - moves);
    trackEvent('level_quit', {
      level: level.id,
      moves_used: movesUsed,
      time_played_seconds: timePlayed
    });
    // CAMBIO 1 — quit a media partida consume vida (Royal Match style).
    // El tracking 'life_consumed' se emite en Index.handleQuitMidGame para evitar duplicados.
    if (!won && !gameOver) {
      (onQuit ?? onBack)();
    } else {
      onBack();
    }
  }, [level.id, level.moves, initialMoves, moves, onBack, onQuit, won, gameOver]);

  useEffect(() => {
    backgroundMusic.setScreen('game');
    return () => {
      backgroundMusic.setScreen('menu');
    };
  }, []);

  // 🛟 Red de seguridad: si llega un purchase_success de 'continue_game'
  // (rescate) aplicamos +5 movimientos y reseteamos gameOver, AUNQUE el
  // modal UltimateRescueOffer ya se haya desmontado por cualquier motivo.
  // Idempotente gracias al dedup window de dispatchPurchaseCompleted.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = ((event as CustomEvent).detail ?? {}) as { productId?: string };
      
      const applyRescue = () => {
        setMoves(prev => prev + 5);
        setGameOver(false);
        setWon(false);
        setShowRescueOffer(false);
        // Cerrar también funnels post-derrota si se hubieran abierto en paralelo
        setShowDefeatPacksOffer(false);
        setShowBuyMovesOffer(false);
        setShowCloseDefeatOffer(false);
        setShowFlashOffer(false);
        hasPlayedEndSound.current = false;
        backgroundMusic.setScreen('game');
      };

      if (detail.productId === 'continue_game') {
        applyRescue();
      } else if (detail.productId === 'starter_gems' && showRescueOffer) {
        // El modal de rescate está abierto cuando llega la compra de gemas
        // → inferimos que el usuario compró para rescatar y aplicamos auto-rescate
        onSpendGems?.(150);
        applyRescue();
        trackEvent('rescue_auto_applied', { 
          source: 'ultimate_rescue_inferred', 
          productId: 'starter_gems', 
          gems_spent: 150 
        });
      }
    };
    window.addEventListener('first_purchase_completed', handler);
    return () => window.removeEventListener('first_purchase_completed', handler);
  }, [showRescueOffer, onSpendGems]);

  const checkWinCondition = useCallback(() => {
    // CAMBIO 3 — bonus: gana al agotar los 20 movimientos (no se puede perder)
    if (level.bonus) return moves === 0;
    if (level.objective.type === 'score') {
      return score >= level.objective.count;
    } else if (level.objective.type === 'collect') {
      return (collected[level.objective.target] || 0) >= level.objective.count;
    }
    return false;
  }, [level, moves, score, collected]);

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
        resetRescueCount(level.id);
      } catch (error) {
        console.error('Error reseteando intentos:', error);
      }
      
      // Confetti & sounds handled inside LevelCompleteCelebration component
    } else if (moves === 0 && !checkWinCondition() && !gameOver) {
      // Bonus levels never reach defeat path (checkWinCondition returns true at moves===0)
      if (level.bonus) return;
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
            level.id >= 4 &&
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

  const handleMatch = useCallback((tiles: string[], biggestGroupSize: number, cascadeStep: number) => {
    // CAMBIO SCORING — bonus por tamaño de match
    const base =
      biggestGroupSize >= 6 ? 300 :
      biggestGroupSize === 5 ? 150 :
      biggestGroupSize === 4 ? 80 :
      30;
    const mult = Math.min(Math.max(cascadeStep, 1), 5);
    const gained = base * mult;

    setScore((prev) => prev + gained);
    setCombo(mult);

    if (mult > cascadeMaxRef.current) cascadeMaxRef.current = mult;
    cascadeTotalRef.current += gained;

    // Tracking — match grande
    if (biggestGroupSize >= 4) {
      try {
        trackEvent('big_match_made', {
          size: biggestGroupSize >= 6 ? 6 : biggestGroupSize,
          level: level.id,
          score_earned: gained,
        });
      } catch {}
    }

    // FX visuales escalados
    try {
      if (biggestGroupSize >= 6) {
        confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 }, colors: ['#FFD700', '#FFA500', '#FF6B00'] });
      } else if (biggestGroupSize >= 5) {
        confetti({ particleCount: 60, spread: 75, origin: { y: 0.5 }, colors: ['#FFD700', '#FFFFFF'] });
      }
    } catch {}

    setCollected((prev) => {
      const next = { ...prev };
      tiles.forEach((tile) => {
        next[tile] = (next[tile] || 0) + 1;
      });
      return next;
    });

    // Detección fin de cadena (idle ~700ms sin nuevos matches)
    if (cascadeEndTimerRef.current) clearTimeout(cascadeEndTimerRef.current);
    cascadeEndTimerRef.current = setTimeout(() => {
      const max = cascadeMaxRef.current;
      const total = cascadeTotalRef.current;
      if (max >= 2) {
        try {
          trackEvent('combo_chain', {
            max_multiplier: max,
            total_score: total,
            level: level.id,
          });
        } catch {}
      }
      if (max >= 3) {
        setSuperComboMax(max);
        try {
          trackEvent('super_combo_celebrated', { level: level.id, multiplier: max });
        } catch {}
      }
      cascadeMaxRef.current = 1;
      cascadeTotalRef.current = 0;
      setCombo(0);
    }, 700);
  }, [level.id]);

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

  // Handlers para UltimateRescueOffer — CAMBIO 6: contar y escalar gemas
  const rescuePriceForCurrentLevel = gemPriceForRescue(level.id);
  const rescueCountForLevel = getRescueCount(level.id);

  const handleRescueBuy = () => {
    incrementRescueCount(level.id);
    trackEvent('extra_moves_purchased', { level: level.id, count: rescueCountForLevel + 1, payment: 'stripe' });
    setShowRescueOffer(false);
    setMoves(prev => prev + 5);
    setGameOver(false);
    setWon(false);
    hasPlayedEndSound.current = false;
    backgroundMusic.setScreen('game');
  };

  const handleRescueWithGems = () => {
    if (gems >= rescuePriceForCurrentLevel && onSpendGems) {
      onSpendGems(rescuePriceForCurrentLevel);
      incrementRescueCount(level.id);
      trackEvent('extra_moves_purchased', { level: level.id, count: rescueCountForLevel + 1, payment: 'gems', cost: rescuePriceForCurrentLevel });
      setShowRescueOffer(false);
      setMoves(prev => prev + 5);
      setGameOver(false);
      setWon(false);
      hasPlayedEndSound.current = false;
      backgroundMusic.setScreen('game');
    }
  };

  const handleHammerClick = () => {
    if (isHammerActive) {
      setIsHammerActive(false);
      return;
    }
    if (hammers > 0 || gems >= 40) {
      setIsHammerActive(true);
    } else {
      toast.error(t('game.not_enough_gems') || "Necesitas 40 gemas para el Martillo");
    }
  };

  const handleShuffleClick = () => {
    const isPaid = shuffles === 0;
    if (!isPaid || gems >= 60) {
      if (isPaid) {
        onSpendGems?.(60);
      } else {
        onUseShuffle?.();
      }

      // Tracking ÚNICO y DETALLADO
      trackEvent('powerup_used', { 
        type: 'shuffle', 
        level: level.id, 
        payment: isPaid ? 'gems' : 'stock',
        cost: isPaid ? 60 : 0,
        gems_remaining: gems - (isPaid ? 60 : 0)
      });

      setShuffleTrigger(prev => prev + 1);
    } else {
      toast.error(t('game.not_enough_gems') || "Necesitas 60 gemas para Mezclar");
    }
  };

  const handleUndoClick = () => {
    const isPaid = undos === 0;
    if (!isPaid || gems >= 25) {
      if (isPaid) {
        onSpendGems?.(25);
      } else {
        onUseUndo?.();
      }

      // Tracking ÚNICO y DETALLADO
      trackEvent('powerup_used', { 
        type: 'undo', 
        level: level.id, 
        payment: isPaid ? 'gems' : 'stock',
        cost: isPaid ? 25 : 0,
        gems_remaining: gems - (isPaid ? 25 : 0)
      });

      setUndoTrigger(prev => prev + 1);
    } else {
      toast.error(t('game.not_enough_gems') || "Necesitas 25 gemas para Deshacer");
    }
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
            <Button onClick={handleQuit} variant="outline" size="sm">
              ← {t('menu.levels')}
            </Button>
            <h2 className="text-xl font-bold text-gold">
              {t('game.level')} {level.id}
            </h2>
            <button 
              onClick={handleQuit} 
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
          
          {/* OBJETIVO CLARO Y VISIBLE — CAMBIO 9: sin pulse en reintentos para arranque más ágil */}
          <div className={`mt-4 p-3 rounded-xl ${level.bonus ? 'bg-gradient-to-r from-yellow-500/30 via-amber-400/20 to-orange-500/30 border-2 border-yellow-400/60' : 'bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-2 border-primary/30'}`}>
            <div className="flex items-center justify-center gap-3">
              {level.bonus ? (
                <>
                  <Gift className="w-7 h-7 text-yellow-300" />
                  <span className="text-base font-bold text-yellow-100 uppercase tracking-wide">
                    Nivel Bonus · +{level.reward?.gems ?? 100} 💎 garantizadas
                  </span>
                </>
              ) : level.objective.type === 'collect' ? (
                <>
                  <span className="text-sm text-muted-foreground">{t('game.collect')}</span>
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-1">
                    {(() => {
                      const id = level.objective.target as TileType;
                      const photo = tileSkins[id];
                      return photo ? (
                        <img src={photo} alt="" className={`w-10 h-10 object-cover rounded-full ${isRetry.current ? '' : 'animate-pulse'}`} />
                      ) : (
                        <span className={`text-4xl ${isRetry.current ? '' : 'animate-pulse'}`}>{TILE_DEFAULT_EMOJIS[id] ?? level.objective.target}</span>
                      );
                    })()}
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
            levelId={level.id}
            isHammerActive={isHammerActive}
            onHammerUse={(row, col) => {
              const isPaid = hammers === 0;
              if (isPaid) {
                onSpendGems?.(40);
              } else {
                onUseHammer?.();
              }

              // Tracking ÚNICO y DETALLADO
              trackEvent('powerup_used', { 
                type: 'hammer', 
                level: level.id, 
                payment: isPaid ? 'gems' : 'stock',
                cost: isPaid ? 40 : 0,
                gems_remaining: gems - (isPaid ? 40 : 0)
              });

              setIsHammerActive(false);
            }}
            triggerShuffle={shuffleTrigger}
            triggerUndo={undoTrigger}
            onFirstValidMatch={() => setFirstMatchMade(true)}
            adaptiveBoost={
              consecutiveLossesOnLevel >= 3 ? 0.30
              : consecutiveLossesOnLevel === 2 ? 0.15
              : 0
            }
          />
        </div>

        {/* Power-ups UI */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={handleHammerClick}
            disabled={gameOver}
            className={`relative p-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 ${isHammerActive ? 'bg-accent/40 border-2 border-accent shadow-gold' : 'bg-muted/30 border border-white/10'}`}
          >
            <Hammer className={`w-6 h-6 ${isHammerActive ? 'text-accent animate-bounce' : 'text-foreground/70'}`} />
            <span className="text-[10px] font-bold uppercase">{t('game.hammer') || 'Martillo'}</span>
            <div className="absolute -top-2 -right-1 bg-background border border-accent/50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
              {hammers > 0 ? (
                <span className="text-[10px] font-bold text-accent">x{hammers}</span>
              ) : (
                <span className="text-[10px] font-bold text-yellow-400 flex items-center">40<Gem className="w-2 h-2 ml-0.5" /></span>
              )}
            </div>
          </button>

          <button
            onClick={handleShuffleClick}
            disabled={gameOver}
            className="relative p-3 rounded-2xl bg-muted/30 border border-white/10 flex flex-col items-center gap-1 transition-all active:scale-95 hover:bg-muted/40"
          >
            <RefreshCw className="w-6 h-6 text-foreground/70" />
            <span className="text-[10px] font-bold uppercase">{t('game.shuffle') || 'Mezclar'}</span>
            <div className="absolute -top-2 -right-1 bg-background border border-accent/50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
              {shuffles > 0 ? (
                <span className="text-[10px] font-bold text-accent">x{shuffles}</span>
              ) : (
                <span className="text-[10px] font-bold text-yellow-400 flex items-center">60<Gem className="w-2 h-2 ml-0.5" /></span>
              )}
            </div>
          </button>

          <button
            onClick={handleUndoClick}
            disabled={gameOver}
            className="relative p-3 rounded-2xl bg-muted/30 border border-white/10 flex flex-col items-center gap-1 transition-all active:scale-95 hover:bg-muted/40"
          >
            <RotateCcw className="w-6 h-6 text-foreground/70" />
            <span className="text-[10px] font-bold uppercase">{t('game.undo') || 'Deshacer'}</span>
            <div className="absolute -top-2 -right-1 bg-background border border-accent/50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
              {undos > 0 ? (
                <span className="text-[10px] font-bold text-accent">x{undos}</span>
              ) : (
                <span className="text-[10px] font-bold text-yellow-400 flex items-center">25<Gem className="w-2 h-2 ml-0.5" /></span>
              )}
            </div>
          </button>
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
        <SuperComboBanner maxMultiplier={superComboMax} onDone={() => setSuperComboMax(0)} />

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
            gems={gems}
            onBuyWithGems={handleRescueWithGems}
            gemCost={rescuePriceForCurrentLevel}
            rescueCount={rescueCountForLevel}
          />
        )}

        {/* Level 1 guided tutorial */}
        <Level1Tutorial
          levelId={level.id}
          firstMatchMade={firstMatchMade}
        />

        {/* Premium Win Celebration */}
        {gameOver && won && !showCloseDefeatOffer && !showFlashOffer && !showDefeatPacksOffer && !showBuyMovesOffer && !showLevel6Offer && !showRescueOffer && (
          <LevelCompleteCelebration
            levelId={level.id}
            gemsEarned={level.reward?.gems ?? 0}
            score={score}
            onContinue={() => onWin(1, level.reward)}
          />
        )}

        {/* Defeat Overlay */}
        {gameOver && !won && !showCloseDefeatOffer && !showFlashOffer && !showDefeatPacksOffer && !showBuyMovesOffer && !showLevel6Offer && !showRescueOffer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="gradient-card shadow-card rounded-2xl p-8 text-center max-w-sm mx-4">
              <h2 className="text-4xl font-bold mb-4 text-destructive">
                {t('game.lose')}
              </h2>
              <Button
                onClick={() => {
                  const target = level.bonus ? 0 : level.objective.count;
                  const progressAbs = level.objective.type === 'score'
                    ? score
                    : (collected[level.objective.target] || 0);
                  const progressPct = target > 0 ? Math.min(100, Math.round((progressAbs / target) * 100)) : 0;
                  onLose({
                    progress_pct: progressPct,
                    progress_abs: progressAbs,
                    target,
                    moves_left: moves,
                  });
                }}
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
