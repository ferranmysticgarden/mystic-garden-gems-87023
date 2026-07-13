import { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './Board';
import { Button } from './ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { LEVELS, Level } from '@/data/levels';
import { CloseDefeatOffer } from './game/CloseDefeatOffer';
import { GemsBanner } from './game/GemsBanner';
import { FlashOffer } from './game/FlashOffer';
import { ComboMultiplier } from './game/ComboMultiplier';
// SuperComboBanner eliminado — su rol lo absorbe ComboMultiplier (sello Candy-Crush centrado).
import { BuyMovesOffer } from './game/BuyMovesOffer';
import { DefeatPacksOffer } from './game/DefeatPacksOffer';
import { Level10Paywall } from './game/Level10Paywall';
import { Level6Offer } from './game/Level6Offer';
import { UltimateRescueOffer } from './game/UltimateRescueOffer';
import { LevelCompleteCelebration } from './effects/LevelCompleteCelebration';
import { Level1Tutorial } from './game/Level1Tutorial';
import { PowerupIntroModal } from './game/PowerupIntroModal';
import { shouldShowIntro, markIntroShown, shouldConfirmSpend, incrementConfirmCount, type PowerupType } from '@/utils/powerupTutorial';
import { ComboTipIntroModal } from './game/ComboTipIntroModal';
import { ComboTipDefeatBanner } from './game/ComboTipDefeatBanner';
import { FirstBigComboBanner } from './game/FirstBigComboBanner';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { TILE_DEFAULT_EMOJIS, type TileType } from '@/constants/tileTypes';
import { THEME_TILE_MAP } from '@/data/themes';
import { useTileSkin } from '@/hooks/useTileSkin';
import { useUserThemes } from '@/hooks/useUserThemes';
import { FirstMoveHint } from './game/FirstMoveHint';
import { useMysticSounds } from '@/hooks/useMysticSounds';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { usePurchaseGate } from '@/hooks/usePurchaseGate';
import { useAttemptTracker } from '@/hooks/useAttemptTracker';
import confetti from 'canvas-confetti';
import { usePendingPurchase } from '@/hooks/usePendingPurchase';
import { trackEvent } from "@/lib/trackEvent";
import { Hammer, RefreshCcw, RotateCcw, Gem, Gift } from 'lucide-react';
import { ChangeIconModal } from './game/ChangeIconModal';
import type { TileType as ChangeTileType } from '@/constants/tileTypes';
import { toast } from 'sonner';
import { gemPriceForRescue, incrementRescueCount, resetRescueCount, getRescueCount } from '@/utils/rescuePriceScale';
import { consumeWinStreakPowerup } from '@/utils/winStreakPowerup';
import { isRetryOfLevel, markLevelEntered } from '@/utils/retryTracker';
import { incrementMission } from '@/utils/missionTracker';

interface GameScreenProps {
  level: Level;
  onWin: (stars: number, reward: { gems?: number }, telemetry?: { score: number; moves_used: number }) => void;
  onLose: (payload?: { progress_pct: number; progress_abs: number; target: number; moves_left: number; score: number; moves_used: number }) => void;

  onBack: () => void;
  onQuit?: () => void;
  onShowExitModal: () => void;
  initialMoves?: number;
  initialScore?: number;
  initialCollected?: Record<string, number>;
  gems?: number;
  onSpendGems?: (amount: number) => void;
  hammers?: number;
  changes?: number;
  undos?: number;
  onUseHammer?: () => void;
  onUseChange?: () => void;
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
  changes = 0,
  undos = 0,
  onUseHammer,
  onUseChange,
  onUseUndo,
  consecutiveLossesOnLevel = 0,
}: GameScreenProps) => {
  const { t } = useLanguage();
  const tileSkins = useTileSkin();
  const { activeTheme } = useUserThemes();
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
  // superComboMax eliminado — ComboMultiplier centrado ya cubre x3+ con sus propios textos.
  const cascadeMaxRef = useRef(1);
  const cascadeTotalRef = useRef(0);
  const cascadeEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tips educativos
  const madeAnyComboOrBigRef = useRef(false);
  const [firstBigTrigger, setFirstBigTrigger] = useState(0);
  const [progressAtLoss, setProgressAtLoss] = useState(0);
  const [showNearWinMessage, setShowNearWinMessage] = useState(false);
  const [isHammerActive, setIsHammerActive] = useState(false);
  const [isChangeActive, setIsChangeActive] = useState(false);
  const [changeTilePending, setChangeTilePending] = useState<{ row: number; col: number } | null>(null);
  const [changeApply, setChangeApply] = useState<{ row: number; col: number; newType: string; seq: number } | null>(null);
  const changeSeqRef = useRef(0);
  // Guardamos si el próximo Cambio va a gastar gemas para cobrar solo al aplicar
  const changeWillSpendRef = useRef(false);
  const [undoTrigger, setUndoTrigger] = useState(0);
  // UX educativa power-ups: modal explicativo/confirmación antes de ejecutar
  const [pendingPowerup, setPendingPowerup] = useState<null | { type: PowerupType; mode: 'intro' | 'confirm'; willSpendGems: boolean }>(null);
  const [firstMatchMade, setFirstMatchMade] = useState(false);
  const hasPlayedEndSound = useRef(false);
  const hasShownFlashOffer = useRef(false);
  const hasShownBuyMoves = useRef(false);
  // FIX vidas — guard idempotente para asegurar que loseLife() se llama SIEMPRE 1 vez al finalizar derrota
  const defeatFinalizedRef = useRef(false);
  // BUG 2 fix — estado terminal único por partida ('win' | 'lose' | null).
  // Bloquea que se dispare el opuesto una vez fijado.
  const terminalStateRef = useRef<null | 'win' | 'lose'>(null);
  // BUG 5 fix — flag que desactiva adaptive difficulty tras compra de +movimientos.
  const [paidRescueActive, setPaidRescueActive] = useState(false);
  useEffect(() => {
    // reset del guard al cambiar de nivel
    defeatFinalizedRef.current = false;
    terminalStateRef.current = null;
    setPaidRescueActive(false);
  }, [level.id]);
  
  const { hasPurchasedOnce } = usePurchaseGate();
  const { savePendingState } = usePendingPurchase();
  const { getAttempts, incrementAttempt, resetAttempts } = useAttemptTracker();
  
  const { playVictorySound, playLoseSound } = useMysticSounds();

  const startTime = useRef(Date.now());

  // CAMBIO 9 — isRetry: si reentras al mismo nivel en la sesión, se considera reintento
  const isRetry = useRef<boolean>(isRetryOfLevel(level.id));

  // Resetear estado al cambiar de nivel
  useEffect(() => {
    setIsChangeActive(false);
    setChangeTilePending(null);
    setChangeApply(null);
    setUndoTrigger(0);
    setIsHammerActive(false);
    madeAnyComboOrBigRef.current = false;
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
        defeatFinalizedRef.current = false;
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
    // BUG 2 fix — WIN SIEMPRE tiene prioridad. Se comprueba primero y sella el terminalStateRef.
    if (checkWinCondition() && !gameOver && terminalStateRef.current !== 'lose') {
      terminalStateRef.current = 'win';
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
      return;
    }
    // Solo entramos en defeat si NO se ganó y el terminal aún no está sellado.
    if (moves === 0 && !checkWinCondition() && !gameOver && terminalStateRef.current !== 'win') {
      // Bonus levels never reach defeat path (checkWinCondition returns true at moves===0)
      if (level.bonus) return;
      terminalStateRef.current = 'lose';
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
      madeAnyComboOrBigRef.current = true;
      try {
        trackEvent('big_match_made', {
          size: biggestGroupSize >= 6 ? 6 : biggestGroupSize,
          level: level.id,
          score_earned: gained,
        });
      } catch {}
      // Tip 3 — primera vez en la vida del jugador con match-5+
      if (biggestGroupSize >= 5) {
        setFirstBigTrigger((n) => n + 1);
      }
    }
    if (mult >= 2) {
      madeAnyComboOrBigRef.current = true;
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
        setFirstBigTrigger((n) => n + 1);
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
    if (terminalStateRef.current === 'win' || won) {
      setShowCloseDefeatOffer(false);
      return;
    }
    setMoves(5);
    setGameOver(false);
    setShowCloseDefeatOffer(false);
    defeatFinalizedRef.current = false;
    // BUG 2 fix — permitir que gane si el objetivo ya estaba cumplido tras el último match.
    terminalStateRef.current = null;
    // BUG 5 fix — pagó, se desactiva adaptive difficulty.
    setPaidRescueActive(true);
  };

  // FIX vidas — finalizador único de derrota. Idempotente. Llama onLose (que en Index gasta 1 vida).
  const finalizeDefeat = useCallback((reason: string) => {
    if (defeatFinalizedRef.current) return;
    defeatFinalizedRef.current = true;
    const target = level.bonus ? 0 : level.objective.count;
    const progressAbs = level.objective.type === 'score'
      ? score
      : (collected[level.objective.target] || 0);
    const progressPct = target > 0 ? Math.min(100, Math.round((progressAbs / target) * 100)) : 0;
    trackEvent('defeat_finalized', { level: level.id, reason });
    if (!hasPlayedEndSound.current) {
      hasPlayedEndSound.current = true;
      backgroundMusic.setScreen('defeat');
      playLoseSound();
    }
    onLose({
      progress_pct: progressPct,
      progress_abs: progressAbs,
      target,
      moves_left: moves,
      score,
      moves_used: Math.max(0, (initialMoves ?? level.moves) - moves),
    });
  }, [level, score, collected, moves, initialMoves, onLose]);

  const handleCloseDefeatDismiss = () => {
    setShowCloseDefeatOffer(false);

    if (hasShownFlashOffer.current && !localStorage.getItem('flash_offer_shown_session')) {
      localStorage.setItem('flash_offer_shown_session', 'true');
      setShowFlashOffer(true);
      return;
    }
    finalizeDefeat('close_defeat_dismiss');
  };

  const handleFlashOfferClose = () => {
    setShowFlashOffer(false);
    finalizeDefeat('flash_offer_close');
  };

  const handleBuyMovesBuy = () => {
    if (terminalStateRef.current === 'win' || won) {
      setShowBuyMovesOffer(false);
      return;
    }
    setMoves(5);
    setShowBuyMovesOffer(false);
    hasShownBuyMoves.current = false;
    // BUG 2 + BUG 5
    terminalStateRef.current = null;
    defeatFinalizedRef.current = false;
    setGameOver(false);
    setPaidRescueActive(true);
  };

  const handleBuyMovesDismiss = () => {
    setShowBuyMovesOffer(false);
    setGameOver(true);
    setWon(false);

    const progress = getProgressPercentage();
    setProgressAtLoss(progress);

    if (progress >= 40) {
      emitAnalyticsEvent('defeat_pack_shown', { level: level.id, progress });
      setShowDefeatPacksOffer(true);
      return;
    }
    finalizeDefeat('buy_moves_dismiss');
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
      return;
    }
    finalizeDefeat('defeat_packs_exit');
  };

  const handleLevel10Purchase = () => {
    if (terminalStateRef.current === 'win' || won) {
      setShowLevel10Paywall(false);
      return;
    }
    setMoves(5);
    setShowLevel10Paywall(false);
    terminalStateRef.current = null;
    defeatFinalizedRef.current = false;
    setGameOver(false);
    setPaidRescueActive(true);
  };

  const handleLevel10Dismiss = () => {
    localStorage.setItem('level10_paywall_dismissed', 'true');
    setShowLevel10Paywall(false);
    setGameOver(true);
    setWon(false);
    finalizeDefeat('level10_dismiss');
  };

  const handleLevel6Purchase = () => {
    if (terminalStateRef.current === 'win' || won) {
      setShowLevel6Offer(false);
      return;
    }
    setMoves(3);
    setShowLevel6Offer(false);
    terminalStateRef.current = null;
    defeatFinalizedRef.current = false;
    setGameOver(false);
    setPaidRescueActive(true);
  };

  const handleLevel6Dismiss = () => {
    setShowLevel6Offer(false);
    setGameOver(true);
    setWon(false);
    finalizeDefeat('level6_dismiss');
  };

  // Handlers para UltimateRescueOffer — CAMBIO 6: contar y escalar gemas
  const rescuePriceForCurrentLevel = gemPriceForRescue(level.id);
  const rescueCountForLevel = getRescueCount(level.id);

  const handleRescueBuy = () => {
    if (terminalStateRef.current === 'win' || won) {
      setShowRescueOffer(false);
      return;
    }
    incrementRescueCount(level.id);
    trackEvent('extra_moves_purchased', { level: level.id, count: rescueCountForLevel + 1, payment: 'stripe' });
    setShowRescueOffer(false);
    setMoves(prev => prev + 5);
    setGameOver(false);
    setWon(false);
    hasPlayedEndSound.current = false;
    defeatFinalizedRef.current = false;
    terminalStateRef.current = null;
    setPaidRescueActive(true);
    backgroundMusic.setScreen('game');
  };

  const handleRescueWithGems = () => {
    if (terminalStateRef.current === 'win' || won) {
      setShowRescueOffer(false);
      return;
    }
    if (gems >= rescuePriceForCurrentLevel && onSpendGems) {
      onSpendGems(rescuePriceForCurrentLevel);
      incrementRescueCount(level.id);
      trackEvent('extra_moves_purchased', { level: level.id, count: rescueCountForLevel + 1, payment: 'gems', cost: rescuePriceForCurrentLevel });
      setShowRescueOffer(false);
      setMoves(prev => prev + 5);
      setGameOver(false);
      setWon(false);
      hasPlayedEndSound.current = false;
      defeatFinalizedRef.current = false;
      terminalStateRef.current = null;
      setPaidRescueActive(true);
      backgroundMusic.setScreen('game');
    }
  };

  /** Ejecuta la acción real del power-up (sin modales). Aquí NO se toca
   *  la lógica de coste/tracking existente, solo se segmenta para poder
   *  interceptar con intro/confirm sin duplicar código. */
  const executePowerup = (type: PowerupType) => {
    // BUG 4 fix — cada uso cuenta para la misión diaria (independiente de si gasta gemas o stock)
    try { incrementMission('powerups'); } catch {}
    if (type === 'hammer') {
      // Activa modo martillo. El gasto real de gemas ocurre al aplicar sobre una ficha
      // (lógica original en useHammer / onHammerUse), no aquí.
      setIsHammerActive(true);
      return;
    }
    if (type === 'change') {
      // Activa modo Cambio SIN cobrar aún. El coste se aplica cuando el usuario
      // elige un icono en el modal (handleChangeIconPick). Salir del modo con X = gratis.
      const isPaid = changes === 0;
      changeWillSpendRef.current = isPaid;
      setIsChangeActive(true);
      return;
    }
    if (type === 'undo') {
      const isPaid = undos === 0;
      if (isPaid) onSpendGems?.(25); else onUseUndo?.();
      trackEvent('powerup_used', {
        type: 'undo',
        level: level.id,
        payment: isPaid ? 'gems' : 'stock',
        cost: isPaid ? 25 : 0,
        gems_remaining: gems - (isPaid ? 25 : 0),
      });
      setUndoTrigger((p) => p + 1);
      return;
    }
  };

  /** Router común: primera vez → intro; siguientes 3 con gasto → confirm; luego directo. */
  const requestPowerup = (type: PowerupType, willSpendGems: boolean) => {
    if (shouldShowIntro(type)) {
      setPendingPowerup({ type, mode: 'intro', willSpendGems });
      return;
    }
    if (willSpendGems && shouldConfirmSpend(type)) {
      setPendingPowerup({ type, mode: 'confirm', willSpendGems });
      return;
    }
    executePowerup(type);
  };

  const handleHammerClick = () => {
    // Toggle: si ya está activo, desactivar sin modal
    if (isHammerActive) {
      setIsHammerActive(false);
      return;
    }
    const hasStock = hammers > 0;
    if (!hasStock && gems < 40) {
      toast.error(t('game.not_enough_gems') || 'Necesitas 40 gemas para el Martillo');
      return;
    }
    requestPowerup('hammer', !hasStock);
  };

  const handleShuffleClick = () => {
    const isPaid = shuffles === 0;
    if (isPaid && gems < 60) {
      toast.error(t('game.not_enough_gems') || 'Necesitas 60 gemas para Mezclar');
      return;
    }
    requestPowerup('shuffle', isPaid);
  };

  const handleUndoClick = () => {
    const isPaid = undos === 0;
    if (isPaid && gems < 25) {
      toast.error(t('game.not_enough_gems') || 'Necesitas 25 gemas para Deshacer');
      return;
    }
    requestPowerup('undo', isPaid);
  };

  const handlePowerupModalConfirm = () => {
    if (!pendingPowerup) return;
    const { type, mode, willSpendGems } = pendingPowerup;
    markIntroShown(type);
    if (mode === 'confirm' && willSpendGems) incrementConfirmCount(type);
    // Si venimos de "intro" y va a gastar gemas, contamos también este uso
    // como una de las 3 confirmaciones consumidas.
    if (mode === 'intro' && willSpendGems) incrementConfirmCount(type);
    setPendingPowerup(null);
    executePowerup(type);
  };

  const handlePowerupModalCancel = () => {
    if (pendingPowerup) markIntroShown(pendingPowerup.type);
    setPendingPowerup(null);
  };


  const handleRescueDismiss = () => {
    setShowRescueOffer(false);
    setGameOver(true);
    setWon(false);
    finalizeDefeat('rescue_dismiss');
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
                      if (photo) {
                        return <img src={photo} alt="" className={`w-10 h-10 object-cover rounded-full ${isRetry.current ? '' : 'animate-pulse'}`} />;
                      }
                      // Icono del tema activo; fallback al emoji default si el tema no define ese tile.
                      const themeAsset = THEME_TILE_MAP[activeTheme]?.[id];
                      if (typeof themeAsset === 'string' && themeAsset.startsWith('/')) {
                        return <img src={themeAsset} alt="" className={`w-10 h-10 object-contain ${isRetry.current ? '' : 'animate-pulse'}`} loading="eager" width={1024} height={1024} />;
                      }
                      return <span className={`text-4xl ${isRetry.current ? '' : 'animate-pulse'}`}>{themeAsset ?? TILE_DEFAULT_EMOJIS[id] ?? level.objective.target}</span>;
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
        <div className="relative flex-1 flex items-center justify-center">
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
              paidRescueActive ? 0
              : consecutiveLossesOnLevel >= 3 ? 0.30
              : consecutiveLossesOnLevel === 2 ? 0.15
              : 0
            }
          />
          {/* Sello combo estilo Candy Crush — centrado sobre el tablero, no bloquea clicks */}
          <ComboMultiplier combo={combo} onComboEnd={handleComboEnd} />
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
              <h2 className="text-3xl font-bold text-accent drop-shadow-lg">{t('nearwin.title')}</h2>
              <p className="text-xl text-foreground/90 mt-2">{t('nearwin.sub')}</p>
            </div>
          </div>
        )}

        {/* ComboMultiplier ahora se renderiza dentro del wrapper del Board (sello centrado). */}


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

        {/* Modal educativo / confirmación de gasto para los 3 power-ups */}
        {pendingPowerup && (
          <PowerupIntroModal
            open
            type={pendingPowerup.type}
            mode={pendingPowerup.mode}
            willSpendGems={pendingPowerup.willSpendGems}
            onConfirm={handlePowerupModalConfirm}
            onCancel={handlePowerupModalCancel}
          />
        )}

        {/* Tip 1 — Intro a combos antes del primer nivel score */}
        <ComboTipIntroModal
          levelId={level.id}
          isScoreLevel={level.objective.type === 'score' && !level.bonus}
        />

        {/* Tip 3 — Primera vez con match-5+ o combo x3+ */}
        <FirstBigComboBanner trigger={firstBigTrigger} levelId={level.id} />

        {/* Premium Win Celebration */}
        {gameOver && won && !showCloseDefeatOffer && !showFlashOffer && !showDefeatPacksOffer && !showBuyMovesOffer && !showLevel6Offer && !showRescueOffer && (
          <LevelCompleteCelebration
            levelId={level.id}
            gemsEarned={level.reward?.gems ?? 0}
            score={score}
            onContinue={() => onWin(1, level.reward, { score, moves_used: Math.max(0, (initialMoves ?? level.moves) - moves) })}
          />
        )}

        {/* Defeat Overlay */}
        {gameOver && !won && !showCloseDefeatOffer && !showFlashOffer && !showDefeatPacksOffer && !showBuyMovesOffer && !showLevel6Offer && !showRescueOffer && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="gradient-card shadow-card rounded-2xl p-8 text-center max-w-sm mx-4">
              <h2 className="text-4xl font-bold mb-4 text-destructive">
                {t('game.lose')}
              </h2>

              {/* Tip 2 — Banner educativo si perdió nivel score sin combos */}
              <ComboTipDefeatBanner
                levelId={level.id}
                shouldShow={
                  level.objective.type === 'score' &&
                  !level.bonus &&
                  !madeAnyComboOrBigRef.current
                }
              />

              <Button
                onClick={() => finalizeDefeat('overlay_button')}
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
