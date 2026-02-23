import { useState, useEffect, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { usePendingPurchase } from '@/hooks/usePendingPurchase';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePurchaseGate } from '@/hooks/usePurchaseGate';
import { AuthPage } from '@/components/AuthPage';
import { GameHeader } from '@/components/GameHeader';
import { GameScreen } from '@/components/GameScreen';
import { LevelSelect } from '@/components/LevelSelect';
import { Shop } from '@/components/Shop';
import { NoLivesModal } from '@/components/NoLivesModal';
import { FirstDayOffer } from '@/components/game/FirstDayOffer';
import { StarterPack } from '@/components/game/StarterPack';
import { LuckySpin } from '@/components/game/LuckySpin';
import { Tutorial } from '@/components/game/Tutorial';
import { ProgressionBar } from '@/components/game/ProgressionBar';
import { BattlePass } from '@/components/game/BattlePass';
import { RewardedAds } from '@/components/game/RewardedAds';
import { AchievementModal } from '@/components/game/AchievementModal';
import { DailyStreakCalendar } from '@/components/game/DailyStreakCalendar';
import { NotificationPrompt } from '@/components/game/NotificationPrompt';
import { ComeBackBanner } from '@/components/game/ComeBackBanner';
import { StreakReminderBanner } from '@/components/game/StreakReminderBanner';
import { ReviewRequestModal } from '@/components/game/ReviewRequestModal';
import { ExitConfirmModal } from '@/components/game/ExitConfirmModal';
import { Day2UnlockBanner } from '@/components/game/Day2UnlockBanner';
import { FirstWinCelebration } from '@/components/game/FirstWinCelebration';
import { FirstSessionReward } from '@/components/game/FirstSessionReward';
import { SharePrompt } from '@/components/game/SharePrompt';
import { DayCounter } from '@/components/game/DayCounter';
import { FlashOffer } from '@/components/game/FlashOffer';
import { PostVictoryOffer } from '@/components/game/PostVictoryOffer';
import { DailyMissions } from '@/components/game/DailyMissions';
import { LootChest } from '@/components/game/LootChest';
import { SpringEvent } from '@/components/game/SpringEvent';
import { PlayerRank } from '@/components/game/PlayerRank';
import { AudioControls } from '@/components/game/AudioControls';
import { VisualGarden } from '@/components/game/VisualGarden';
import { WelcomeOffer } from '@/components/game/WelcomeOffer';
import { Level4Reward } from '@/components/game/Level4Reward';
import { LoginPrompt } from '@/components/game/LoginPrompt';
import { hasSeenWelcomeOffer, canShowOfferToday, markOfferShown } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { LEVELS } from '@/data/levels';
import { PRODUCTS } from '@/data/products';
import { toast } from 'sonner';
import { Play, Grid3x3, ShoppingBag, User, Crown, Flame, DoorOpen, Gift, Target } from 'lucide-react';

type Screen = 'menu' | 'game' | 'levels' | 'shop';

const Index = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAdsDisabled, addPurchase } = usePurchases(user);
  const { setScreen: setMusicScreen } = useBackgroundMusic('menu');
  const {
    gameState,
    loading: gameLoading,
    loseLife,
    addLives,
    addGems,
    spendGems,
    completeLevel,
    selectLevel,
    activateUnlimitedLives,
    hasUnlimitedLives,
    getTimeUntilNextLife,
    setOnLivesFull,
  } = useGameState();
  
  const { 
    newlyUnlocked, 
    clearNewlyUnlocked, 
    checkLevelAchievements,
    checkGemsAchievements 
  } = useAchievements(user?.id);

  const [screen, setScreenState] = useState<Screen>('menu');
  
  // Sync music volume with screen changes
  const setScreen = useCallback((newScreen: Screen) => {
    setScreenState(newScreen);
    setMusicScreen(newScreen);
  }, [setMusicScreen]);
  const [showNoLivesModal, setShowNoLivesModal] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  
  // New monetization modals
  const [showFlashOffer, setShowFlashOffer] = useState(false);
  const [showPostVictoryOffer, setShowPostVictoryOffer] = useState(false);
  const [showDailyMissions, setShowDailyMissions] = useState(false);
  const [showLootChest, setShowLootChest] = useState(false);
  const [showSpringEvent, setShowSpringEvent] = useState(false);
  const [showStarterPack, setShowStarterPack] = useState(false);
  const [lastCompletedLevel, setLastCompletedLevel] = useState(0);
  const [lastWinGems, setLastWinGems] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  
  // Daily Streak & Push Notifications
  const { streakData, claimDailyReward } = useDailyStreak();
  const { scheduleLivesFullNotification, scheduleStreakReminder, sendLivesFullNotification } = usePushNotifications();
  
  // State for first session reward
  const [showFirstSessionReward, setShowFirstSessionReward] = useState(false);
  
  // State for welcome offer (post-level-1)
  const [showWelcomeOffer, setShowWelcomeOffer] = useState(false);

  // State for level 4 micro-reward
  const [showLevel4Reward, setShowLevel4Reward] = useState(false);

  // State for login prompt (guest mode)
  const [showLoginPrompt, setShowLoginPrompt] = useState<'purchase' | 'save_progress' | null>(null);

  // Purchase gate - bloquea shop hasta primera compra
  const { hasPurchasedOnce, isShopLocked } = usePurchaseGate();
  
  // Estado de pago pendiente (para restaurar después de Stripe)
  const { pendingState, paymentSuccess, clearPendingState } = usePendingPurchase();
  
  // Estado para restaurar el juego después de pago
  const [restoredGameState, setRestoredGameState] = useState<{
    moves: number;
    score: number;
    collected: Record<string, number>;
  } | null>(null);

  // Detectar pago exitoso y restaurar estado del nivel
  useEffect(() => {
    if (paymentSuccess && pendingState) {
      console.log('[Index] Pago exitoso detectado, restaurando nivel:', pendingState.levelId);
      
      // Seleccionar el nivel donde estaba
      selectLevel(pendingState.levelId);
      
      // Guardar estado para pasar a GameScreen
      setRestoredGameState({
        moves: 5, // +5 movimientos comprados
        score: pendingState.score,
        collected: pendingState.collected,
      });
      
      // Cambiar a pantalla de juego
      setScreen('game');
      
      // Limpiar estado pendiente
      clearPendingState();
      
      toast.success('¡Pago completado! +5 movimientos');
    }
  }, [paymentSuccess, pendingState, selectLevel, setScreen, clearPendingState]);

  // Auto-show streak calendar if reward available
  useEffect(() => {
    if (streakData.canClaimToday && user) {
      const timer = setTimeout(() => {
        setShowStreakCalendar(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [streakData.canClaimToday, user]);

  // Schedule streak reminder if user has a streak (at 20:30 prime time)
  useEffect(() => {
    if (streakData.currentStreak > 0 && !streakData.canClaimToday) {
      scheduleStreakReminder(streakData.currentStreak);
    }
  }, [streakData.currentStreak, streakData.canClaimToday, scheduleStreakReminder]);

  // Set up notification when lives become full
  useEffect(() => {
    setOnLivesFull(() => {
      sendLivesFullNotification();
    });
  }, [setOnLivesFull, sendLivesFullNotification]);

  // Listen for login requests from payment hooks (guest trying to buy)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setShowLoginPrompt(detail?.reason || 'purchase');
    };
    window.addEventListener('request_login', handler);
    return () => window.removeEventListener('request_login', handler);
  }, []);

  // Prompt save progress after level 5 for guests
  useEffect(() => {
    if (!user && gameState.completedLevels.length === 5) {
      const prompted = localStorage.getItem('save_progress_prompted');
      if (!prompted) {
        setTimeout(() => setShowLoginPrompt('save_progress'), 2000);
        localStorage.setItem('save_progress_prompted', 'true');
      }
    }
  }, [user, gameState.completedLevels.length]);

  // Music is now auto-started by useBackgroundMusic hook

  const currentLevel = LEVELS.find(l => l.id === gameState.currentLevel) || LEVELS[0];

  const handlePlayClick = () => {
    if (gameState.lives > 0 || hasUnlimitedLives()) {
      loseLife();
      setScreen('game');
    } else {
      setShowNoLivesModal(true);
    }
  };

  const handleWin = useCallback(async (stars: number, reward: { gems?: number }) => {
    completeLevel(currentLevel.id, reward);
    toast.success(`${t('game.win')}${reward.gems ? ` +${reward.gems} 💎` : ''}`);
    
    // Reset consecutive losses on win
    setConsecutiveLosses(0);
    
    // Track last completed level for starter pack
    setLastCompletedLevel(currentLevel.id);
    
    // Increment games played counter for review request
    setGamesPlayed(prev => prev + 1);
    
    // Check achievements
    const completedCount = gameState.completedLevels.length + 1;
    await checkLevelAchievements(completedCount);
    if (reward.gems) {
      await checkGemsAchievements(gameState.gems + reward.gems);
    }
    
    // Show first win celebration for level 1
    if (completedCount === 1) {
      setShowFirstWin(true);
    }

    // Show Starter Pack after level 2, 3 or 4 (only if welcome offer not active)
    if ((currentLevel.id === 2 || currentLevel.id === 3 || currentLevel.id === 4) && !showWelcomeOffer) {
      setTimeout(() => setShowStarterPack(true), 2000);
    }
    
    // Show post-victory offer for harder levels (level 6+)
    if (currentLevel.id >= 6 && reward.gems && reward.gems > 0) {
      setLastWinGems(reward.gems);
      setTimeout(() => setShowPostVictoryOffer(true), 1500);
    }
    
    setScreen('menu');
  }, [completeLevel, currentLevel.id, t, gameState.completedLevels.length, gameState.gems, checkLevelAchievements, checkGemsAchievements]);

  const handleLose = useCallback(() => {
    toast.error(t('game.lose'));
    // Increment games played counter for review request
    setGamesPlayed(prev => prev + 1);
    
    // Track consecutive losses for flash offer
    setConsecutiveLosses(prev => {
      const newCount = prev + 1;
      // Show flash offer after 2 consecutive losses
      if (newCount >= 2) {
        setTimeout(() => setShowFlashOffer(true), 1000);
      }
      return newCount;
    });

    // Show Welcome Offer on level 3+ defeat (if not seen)
    if (currentLevel.id >= 3 && !hasSeenWelcomeOffer() && canShowOfferToday()) {
      setTimeout(() => {
        setShowWelcomeOffer(true);
        markOfferShown();
      }, 1500);
    }
    
    setScreen('menu');
  }, [t, currentLevel.id]);

  const handleSelectLevel = (levelId: number) => {
    const maxUnlockedLevel = Math.max(1, ...gameState.completedLevels) + 1;
    if (levelId > maxUnlockedLevel) {
      toast.error('Nivel bloqueado. Completa niveles anteriores.');
      return;
    }

    if (gameState.lives > 0 || hasUnlimitedLives()) {
      selectLevel(levelId);
      loseLife();
      setScreen('game');
    } else {
      setShowNoLivesModal(true);
    }
  };

  const handlePurchase = async (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    if (product.amount) {
      addGems(product.amount);
    }
    if (product.instantGems) {
      addGems(product.instantGems);
    }

    if (product.noAdsDays) {
      await addPurchase(productId, product.noAdsDays);
    }
    if (product.noAdsForever) {
      await addPurchase(productId);
    }

    if (productId === 'garden_pass') {
      await addPurchase(productId, 30);
    }

    setScreen('menu');
  };

  const handleQuickLifePurchased = () => {
    setShowNoLivesModal(false);
  };

  const handleUseGemsForLife = () => {
    if (gameState.gems >= 5) {
      spendGems(5);
      addLives(1);
      toast.success('¡Usaste 5 gemas! +1 vida');
      setShowNoLivesModal(false);
    } else {
      toast.error('No tienes suficientes gemas');
    }
  };

  const handleRewardedAdEarned = (gems: number) => {
    toast.success(`¡Ganaste ${gems} gemas! 💎`);
  };

  if (authLoading || gameLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌸</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // NO auth wall — guests play immediately!

  if (screen === 'game') {
    // Si hay estado restaurado, pasarlo al GameScreen
    const restoredProps = restoredGameState ? {
      initialMoves: restoredGameState.moves,
      initialScore: restoredGameState.score,
      initialCollected: restoredGameState.collected,
    } : {};
    
    return (
      <GameScreen
        level={currentLevel}
        onWin={(stars, reward) => {
          setRestoredGameState(null); // Limpiar estado restaurado
          handleWin(stars, reward);
        }}
        onLose={() => {
          setRestoredGameState(null); // Limpiar estado restaurado
          handleLose();
        }}
        onBack={() => setScreen('menu')}
        onShowExitModal={() => setShowExitModal(true)}
        {...restoredProps}
      />
    );
  }

  if (screen === 'levels') {
    const maxUnlockedLevel = Math.max(1, ...gameState.completedLevels) + 1;
    return (
      <LevelSelect
        unlockedLevels={maxUnlockedLevel}
        onSelectLevel={handleSelectLevel}
        onBack={() => setScreen('menu')}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 relative z-10">
      <div className="max-w-md mx-auto">
        {/* User Info & Music Control */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <User className="w-4 h-4" />
            <span className="text-sm">
              {user ? user.email?.split('@')[0] : 'Invitado'}
            </span>
            {!user && (
              <button
                onClick={() => setShowLoginPrompt('save_progress')}
                className="text-xs text-primary underline ml-1"
              >
                Guardar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Audio Controls - Sound & Music */}
            <AudioControls />
            
            {/* Exit Button */}
            <button
              onClick={() => {
                if (user) {
                  setShowExitModal(true);
                } else {
                  // Guest: just show exit modal without signOut
                  setShowExitModal(true);
                }
              }}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-destructive/20 border-2 border-destructive/50 hover:bg-destructive/30 hover:scale-110 transition-all duration-150"
              aria-label="Salir del juego"
            >
              <DoorOpen className="w-6 h-6 text-destructive" />
            </button>
          </div>
        </div>

        {/* Header */}
        <GameHeader
          lives={gameState.lives}
          gems={gameState.gems}
          hasUnlimitedLives={hasUnlimitedLives()}
          timeUntilNextLife={getTimeUntilNextLife()}
          onShopClick={() => setScreen('shop')}
        />

        {/* Streak Reminder Banner - VISIBLE when can claim */}
        <StreakReminderBanner onClick={() => setShowStreakCalendar(true)} />

        {/* Day Counter - "Día X en Mystic Garden" */}
        <DayCounter currentStreak={streakData.currentStreak} />

        {/* Visual Garden - Emotional connection */}
        <div className="mb-4">
          <VisualGarden levelsCompleted={gameState.completedLevels.length} />
        </div>

        {/* Progression Bar */}
        <div className="mb-4">
          <ProgressionBar />
        </div>

        {/* Logo */}
        <div className="text-center mb-6 animate-float">
          <h1 className="text-5xl font-bold text-gold mb-2 drop-shadow-lg">
            {t('game.title')}
          </h1>
          <div className="text-6xl mb-4">🌸🌺🌼</div>
        </div>

        {/* Main Menu */}
        <div className="gradient-card shadow-card rounded-2xl p-6 mb-4">
          <div className="text-center mb-6">
            <div className="text-lg font-semibold mb-2">
              {t('game.level')} {gameState.currentLevel}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentLevel.objective.type === 'score' 
                ? `${t('game.collect')} ${currentLevel.objective.count} ${t('game.points')}`
                : `${t('game.collect')} ${currentLevel.objective.count} ${currentLevel.objective.target}`
              }
            </div>
          </div>

          <Button
            onClick={handlePlayClick}
            className="w-full gradient-gold shadow-gold text-xl py-6 hover:scale-105 transition-all mb-4"
            id="play-game-btn"
          >
            <Play className="w-6 h-6 mr-2" />
            {t('game.play')}
          </Button>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              onClick={() => setScreen('levels')}
              variant="outline"
              className="hover:scale-105 transition-transform"
            >
              <Grid3x3 className="w-5 h-5 mr-2" />
              {t('menu.levels')}
            </Button>
            
            {/* Shop button - SIEMPRE VISIBLE para generar deseo */}
              <Button
                onClick={() => setScreen('shop')}
                variant="outline"
                className="hover:scale-105 transition-transform"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {t('menu.shop')}
              </Button>
          </div>

          {/* Battle Pass Button */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Button
              onClick={() => setShowBattlePass(true)}
              variant="outline"
              className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 hover:border-yellow-400"
            >
              <Crown className="w-5 h-5 mr-2 text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">Battle Pass</span>
            </Button>

            {/* Daily Streak Button */}
            <Button
              onClick={() => setShowStreakCalendar(true)}
              variant="outline"
              className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50 hover:border-orange-400 relative"
            >
              <Flame className="w-5 h-5 mr-2 text-orange-400" />
              <span className="text-orange-400 font-semibold text-sm">
                Racha {streakData.currentStreak > 0 ? `🔥${streakData.currentStreak}` : ''}
              </span>
              {streakData.canClaimToday && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </Button>
          </div>

          {/* Daily Missions & Loot Chest buttons */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Button
              onClick={() => setShowDailyMissions(true)}
              variant="outline"
              className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 hover:border-blue-400"
            >
              <Target className="w-5 h-5 mr-2 text-blue-400" />
              <span className="text-blue-400 font-semibold text-sm">Misiones</span>
            </Button>

            {/* Loot Chest - SIEMPRE VISIBLE */}
              <Button
                onClick={() => setShowLootChest(true)}
                variant="outline"
                className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50 hover:border-amber-400"
              >
                <Gift className="w-5 h-5 mr-2 text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">Cofres</span>
              </Button>
          </div>

          {/* Player Rank Display */}
          <div className="mt-4">
            <PlayerRank levelsCompleted={gameState.completedLevels.length} />
          </div>
        </div>

        {/* Rewarded Ads Section */}
        <div className="mb-4">
          <RewardedAds onRewardEarned={handleRewardedAdEarned} />
        </div>
      </div>

      {/* Shop Modal - SIEMPRE ACCESIBLE */}
      {screen === 'shop' && (
        <Shop
          onClose={() => setScreen('menu')}
          onPurchase={handlePurchase}
        />
      )}

      {/* No Lives Modal */}
      {showNoLivesModal && (
        <NoLivesModal
          gems={gameState.gems}
          onUseGems={handleUseGemsForLife}
          onClose={() => setShowNoLivesModal(false)}
          onQuickLifePurchased={handleQuickLifePurchased}
        />
      )}

      {/* Battle Pass Modal */}
      {showBattlePass && (
        <BattlePass onClose={() => setShowBattlePass(false)} />
      )}

      {/* Daily Streak Calendar Modal */}
      {showStreakCalendar && (
        <DailyStreakCalendar 
          onClose={() => setShowStreakCalendar(false)}
          onRewardClaimed={(gems, lives) => {
            addGems(gems);
            addLives(lives);
            toast.success(`¡Racha reclamada! +${gems}💎 +${lives}❤️`);
          }}
        />
      )}

      {/* First Day Offer */}
      <FirstDayOffer />

      {/* Starter Pack - SIEMPRE visible (es herramienta de conversión temprana) */}
      {showStarterPack && (
        <StarterPack 
          levelJustCompleted={lastCompletedLevel}
          onClose={() => setShowStarterPack(false)}
        />
      )}

      {/* Lucky Spin */}
      <LuckySpin />

      {/* Tutorial */}
      <Tutorial onComplete={() => console.log('Tutorial completado')} />

      {/* Achievement Modal */}
      {newlyUnlocked && (
        <AchievementModal
          achievement={newlyUnlocked}
          onClose={clearNewlyUnlocked}
        />
      )}

      {/* Push Notification Prompt - after level 2+ victory */}
      <NotificationPrompt onClose={() => {}} levelsCompleted={gameState.completedLevels.length} />

      {/* Come Back Banner for returning users */}
      <ComeBackBanner 
        onClaimReward={(gems, lives) => {
          addGems(gems);
          addLives(lives);
          toast.success(`¡Bienvenido de vuelta! +${gems}💎 +${lives}❤️`);
        }}
      />

      {/* Review Request Modal - shows after 3 games */}
      <ReviewRequestModal gamesPlayed={gamesPlayed} />

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <ExitConfirmModal 
          onStay={() => setShowExitModal(false)}
          onExit={() => {
            setShowExitModal(false);
            if (user) signOut();
          }}
          streak={streakData.currentStreak}
        />
      )}

      {/* Login Prompt - for guest users needing auth */}
      {showLoginPrompt && (
        <LoginPrompt
          reason={showLoginPrompt}
          onClose={() => setShowLoginPrompt(null)}
          onSuccess={() => {
            setShowLoginPrompt(null);
            toast.success('¡Cuenta creada! Tu progreso se ha guardado en la nube ☁️');
          }}
        />
      )}

      {/* Day 2-3 Unlock Bonus - MEGA REWARD */}
      <Day2UnlockBanner 
        streak={streakData.currentStreak}
        onClaimReward={(gems, lives, powerUps) => {
          addGems(gems);
          addLives(lives);
          // Add hammers if included
          if (powerUps?.hammers) {
            // Note: Would need to add hammer tracking to gameState
            toast.success(`¡MEGA REGALO Día ${streakData.currentStreak}! +${gems}💎 +${lives}❤️ +${powerUps.hammers}🔨`);
          } else {
            toast.success(`¡Regalo Día ${streakData.currentStreak} reclamado! +${gems}💎 +${lives}❤️`);
          }
        }}
      />

      {/* First Win Celebration */}
      {showFirstWin && (
        <FirstWinCelebration 
          levelsCompleted={gameState.completedLevels.length}
          onClose={() => setShowFirstWin(false)}
        />
      )}

      {/* Welcome Offer - €0.49 after level 1 */}
      {showWelcomeOffer && (
        <WelcomeOffer
          onPurchase={() => {
            // Grant rewards: +5 moves handled by product, +3 boosters
            addLives(3);
            toast.success('¡Pack Bienvenida activado! +5 movimientos, +3 boosters, x2 monedas 30 min');
            setShowWelcomeOffer(false);
          }}
          onDismiss={() => setShowWelcomeOffer(false)}
        />
      )}

      {/* First Session Reward - dopamina temprana para retención */}
      <FirstSessionReward 
        levelJustCompleted={lastCompletedLevel}
        onClaim={(gems, lives) => {
          addGems(gems);
          addLives(lives);
          toast.success(`¡Bienvenido! +${gems}💎 +${lives}❤️`);
        }}
        onClose={() => {}}
      />

      {/* Level 4 Micro-Reward - refuerzo de progresión */}
      {showLevel4Reward && (
        <Level4Reward 
          open={showLevel4Reward}
          onClaim={() => {
            addGems(50);
            toast.success(`¡Nivel 4 completado! +50💎`);
            setShowLevel4Reward(false);
          }}
        />
      )}

      {/* Share Prompt - after 5 games or 1 day */}
      <SharePrompt 
        gamesPlayed={gamesPlayed}
        daysPlayed={streakData.currentStreak}
      />

      {/* Flash Offer - after 2 consecutive losses */}
      {showFlashOffer && (
        <FlashOffer 
          trigger="loss"
          onClose={() => {
            setShowFlashOffer(false);
            setConsecutiveLosses(0);
          }}
        />
      )}

      {/* Post Victory Offer - after winning harder levels */}
      {showPostVictoryOffer && lastWinGems > 0 && (
        <PostVictoryOffer 
          baseGems={lastWinGems}
          onClose={() => setShowPostVictoryOffer(false)}
          onMultiply={(newGems) => {
            addGems(newGems - lastWinGems); // Add the difference
            toast.success(`¡Gemas multiplicadas! +${newGems - lastWinGems}💎`);
          }}
        />
      )}

      {/* Daily Missions Modal */}
      {showDailyMissions && (
        <DailyMissions 
          onClose={() => setShowDailyMissions(false)}
          onRewardClaimed={(gems) => {
            addGems(gems);
            toast.success(`¡Misión completada! +${gems}💎`);
          }}
        />
      )}

      {/* Loot Chest Modal - SIEMPRE ACCESIBLE */}
      {showLootChest && (
        <LootChest 
          onClose={() => setShowLootChest(false)}
          onRewardClaimed={(gems, lives) => {
            addGems(gems);
            addLives(lives);
            toast.success(`¡Cofre abierto! +${gems}💎 +${lives}❤️`);
          }}
        />
      )}

      {/* Spring Event Banner */}
      <SpringEvent onClose={() => setShowSpringEvent(false)} />
    </div>
  );
};

export default Index;