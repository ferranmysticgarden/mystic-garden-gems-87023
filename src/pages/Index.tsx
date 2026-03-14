import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useBackButton } from '@/hooks/useBackButton';
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
import { lovable } from '@/integrations/lovable';
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

import { LoginPrompt } from '@/components/game/LoginPrompt';
import { signInWithGoogleNative, signInWithGoogleWeb } from '@/lib/googleAuth';
import { hasSeenWelcomeOffer, canShowOfferToday, markOfferShown, emitAnalyticsEvent } from '@/lib/analytics';
import { trackEvent } from '@/lib/trackEvent';
import { Button } from '@/components/ui/button';
import { LEVELS } from '@/data/levels';
import { PRODUCTS } from '@/data/products';
import { toast } from 'sonner';
import { Play, Grid3x3, ShoppingBag, User, Crown, Flame, DoorOpen, Gift, Target } from 'lucide-react';

type Screen = 'menu' | 'game' | 'levels' | 'shop';

const Index = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasActiveProduct } = usePurchases(user);
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
    addHammer,
    addUndo,
    addShuffle,
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
  const [springEventDismissed, setSpringEventDismissed] = useState(false);
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


  // State for login prompt (guest mode)
  const [showLoginPrompt, setShowLoginPrompt] = useState<'purchase' | 'save_progress' | 'general' | null>(null);

  // Purchase gate - bloquea shop hasta primera compra
  const { hasPurchasedOnce, isShopLocked } = usePurchaseGate();

  // Evitar doble grant en Android autenticado: rewards persistentes solo backend
  const shouldApplyClientPersistentRewards = !(user && Capacitor.getPlatform() === 'android');

  // Android back button: navegación inmediata y salida solo en menú
  useBackButton(useCallback(() => {
    if (screen === 'shop' || screen === 'levels' || screen === 'game') {
      setScreen('menu');
      return false;
    }
    setShowExitModal(true);
    return false;
  }, [screen, setScreen]));

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

  // Auto-show streak calendar con control anti-bucle (una vez al día, después de nivel 5)
  useEffect(() => {
    if (!streakData.canClaimToday || !user || gameState.completedLevels.length < 5) return;

    const today = new Date().toISOString().split('T')[0];
    const autoShownKey = `streak-auto-shown-${user.id}-${today}`;
    if (localStorage.getItem(autoShownKey)) return;

    const timer = setTimeout(() => {
      setShowStreakCalendar(true);
      localStorage.setItem(autoShownKey, 'true');
    }, 1200);

    return () => clearTimeout(timer);
  }, [streakData.canClaimToday, user, gameState.completedLevels.length]);

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
      trackEvent('no_lives_modal_shown', { trigger: 'retry' });
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

    // Show Starter Pack ONLY after level 4 win (primera oferta del embudo)
    if (currentLevel.id === 4) {
      emitAnalyticsEvent('first_purchase_offer_shown', { product: 'starter_pack', level: 4 });
      trackEvent('offer_shown', { product: 'starter_pack', level: 4 });
      setTimeout(() => setShowStarterPack(true), 2000);
    }
    
    // Show post-victory offer ONLY after level 5+ win (no distracciones tempranas)
    if (currentLevel.id >= 5 && reward.gems && reward.gems > 0) {
      setLastWinGems(reward.gems);
      emitAnalyticsEvent('first_purchase_offer_shown', { product: 'victory_multiplier', level: currentLevel.id });
      trackEvent('offer_shown', { product: 'victory_multiplier', level: currentLevel.id });
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
      // Show flash offer after 3 consecutive losses (frustration pack), ONLY level 5+
      if (newCount >= 3 && currentLevel.id >= 5) {
        setTimeout(() => setShowFlashOffer(true), 1000);
      }
      return newCount;
    });

    // Show Welcome Offer ONLY on level 5+ defeat (no distracciones tempranas)
    if (currentLevel.id >= 5 && !hasSeenWelcomeOffer() && canShowOfferToday()) {
      setTimeout(() => {
        emitAnalyticsEvent('first_purchase_offer_shown', { product: 'welcome_pack', level: currentLevel.id });
        trackEvent('offer_shown', { product: 'welcome_pack', level: currentLevel.id });
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
      trackEvent('no_lives_modal_shown', { trigger: 'level_select' });
      setShowNoLivesModal(true);
    }
  };

  const handlePurchase = async (productId: string) => {
    // For authenticated users on Android, rewards are granted server-side.
    // Only apply local grants for:
    //  - Web Stripe purchases (redirects away, webhook handles DB, but we refresh state on return)
    //  - Guest purchases (no server-side DB to update)
    const isAndroidPlatform = Capacitor.getPlatform() === 'android';

    if (user && isAndroidPlatform) {
      // Authenticated Android: server already granted rewards in verify-google-purchase.
      // Just refresh game state from DB.
      console.log('[PURCHASE] Authenticated Android — rewards granted server-side, skipping local grants');
      setScreen('menu');
      return;
    }

    // Guest or Web: apply local grants
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    if (product.amount) addGems(product.amount);
    if (product.instantGems) addGems(product.instantGems);
    if (product.gems) addGems(product.gems);

    if (product.lives && product.lives !== 'unlimited') {
      addLives(product.lives);
    }
    if (product.lives === 'unlimited') {
      activateUnlimitedLives(0.5); // 30 minutes = 0.5 hours
    }

    if (product.powerups) {
      const perType = Math.floor(product.powerups / 3);
      const remainder = product.powerups % 3;
      for (let i = 0; i < perType; i++) {
        addHammer();
        addShuffle();
        addUndo();
      }
      if (remainder >= 1) addHammer();
      if (remainder >= 2) addShuffle();
    }

    setScreen('menu');
  };

  const handleQuickLifePurchased = ({ lives, gems }: { lives: number; gems: number }) => {
    if (lives > 0) addLives(lives);
    if (gems > 0) addGems(gems);
    toast.success(`¡Compra completada! +${lives}❤️ +${gems}💎`);
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

  const handleDirectGoogleSignIn = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithGoogleNative('select_account');
        return;
      }

      await signInWithGoogleWeb('/', 'select_account');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión con Google');
    }
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

  // ¿Es usuario nuevo? (menos de 5 niveles completados)
  const isNewUser = gameState.completedLevels.length < 5;

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
                  setShowExitModal(true);
                }
              }}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-destructive/20 border-2 border-destructive/50 hover:bg-destructive/30 active:scale-95 transition-transform duration-100"
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

        {/* Streak Reminder Banner - SOLO después de nivel 2 */}
        {!isNewUser && <StreakReminderBanner onClick={() => setShowStreakCalendar(true)} />}

        {/* Day Counter - SOLO después de nivel 2 */}
        {!isNewUser && <DayCounter currentStreak={streakData.currentStreak} />}

        {/* Visual Garden - SOLO después de nivel 3 */}
        {!isNewUser && (
          <div className="mb-4">
            <VisualGarden levelsCompleted={gameState.completedLevels.length} />
          </div>
        )}

        {/* Progression Bar - SOLO después de nivel 3 */}
        {!isNewUser && (
          <div className="mb-4">
            <ProgressionBar />
          </div>
        )}

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
            className="w-full gradient-gold shadow-gold text-xl py-6 hover:scale-105 transition-all mb-3"
            id="play-game-btn"
          >
            <Play className="w-6 h-6 mr-2" />
            {t('game.play')}
          </Button>

          <Button
            onClick={() => setScreen('shop')}
            variant="outline"
            className="w-full mb-2 hover:scale-105 active:scale-95 transition-transform duration-100"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Abrir tienda
          </Button>

          <p className="text-center text-xs text-muted-foreground mb-4">
            Si quieres comprar, pulsa <span className="font-semibold text-foreground">Abrir tienda</span> o el botón de <span className="font-semibold text-foreground">💎 gemas</span> arriba.
          </p>

          {!user && (
            <Button
              onClick={handleDirectGoogleSignIn}
              variant="outline"
              className="w-full mb-4 hover:scale-105 active:scale-95 transition-transform duration-100"
            >
              Continuar con Google
            </Button>
          )}

          {/* Botones secundarios - SOLO después de nivel 2 */}
          {!isNewUser && (
            <>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  onClick={() => setScreen('levels')}
                  variant="outline"
                  className="hover:scale-105 active:scale-95 transition-transform duration-100"
                >
                  <Grid3x3 className="w-5 h-5 mr-2" />
                  {t('menu.levels')}
                </Button>
                
                <Button
                  onClick={() => setScreen('shop')}
                  variant="outline"
                  className="hover:scale-105 active:scale-95 transition-transform duration-100"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {t('menu.shop')}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  onClick={() => setShowBattlePass(true)}
                  variant="outline"
                  className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 hover:border-yellow-400"
                >
                  <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-sm">Battle Pass</span>
                </Button>

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

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  onClick={() => setShowDailyMissions(true)}
                  variant="outline"
                  className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 hover:border-blue-400"
                >
                  <Target className="w-5 h-5 mr-2 text-blue-400" />
                  <span className="text-blue-400 font-semibold text-sm">Misiones</span>
                </Button>

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
            </>
          )}
        </div>

        {/* Rewarded Ads Section - SOLO después de nivel 3 */}
        {!isNewUser && (
          <div className="mb-4">
            <RewardedAds onRewardEarned={handleRewardedAdEarned} currentLevel={gameState.currentLevel} />
          </div>
        )}
      </div>

      {/* Shop Modal - SIEMPRE ACCESIBLE */}
      {screen === 'shop' && (
        <Shop
          onClose={() => setScreen('menu')}
          onPurchase={handlePurchase}
          isNewUser={isNewUser}
          hasPurchasedOnce={hasPurchasedOnce}
        />
      )}

      {/* No Lives Modal */}
      {showNoLivesModal && (
        <NoLivesModal
          gems={gameState.gems}
          onUseGems={handleUseGemsForLife}
          onClose={() => setShowNoLivesModal(false)}
          onUnlimitedLivesPurchased={() => {
            if (shouldApplyClientPersistentRewards) {
              activateUnlimitedLives(0.5); // 30 minutes
              toast.success('¡Vidas Infinitas activadas! 30 minutos ❤️∞');
            }
            setShowNoLivesModal(false);
          }}
          onQuickLifePurchased={handleQuickLifePurchased}
        />
      )}

      {/* Battle Pass Modal */}
      {showBattlePass && (
        <BattlePass
          onClose={() => setShowBattlePass(false)}
          hasPremiumAccess={hasActiveProduct('garden_pass')}
          onPurchaseSuccess={() => {
            if (shouldApplyClientPersistentRewards) {
              // garden_pass: 1000 gems, 30 days no ads
              addGems(1000);
              toast.success('¡Battle Pass Premium activado! +1000💎 +30 días sin ads');
            } else {
              toast.success('¡Battle Pass Premium activado!');
            }
          }}
        />
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

      {/* First Day Offer - after level 1 completion */}
      {gameState.completedLevels.length >= 1 && (
        <FirstDayOffer 
          levelJustCompleted={lastCompletedLevel}
          onPurchaseSuccess={() => {
            if (shouldApplyClientPersistentRewards) {
              // mega_pack_inicial: 500 gems, 10 lives, 3 powerups, 1 day no ads
              addGems(500);
              addLives(10);
              addHammer(); addShuffle(); addUndo();
            }
            toast.success('¡Mega Pack activado! +500💎 +10❤️ +3🔨 +24h sin ads');
          }}
        />
      )}

      {/* Starter Pack - después de nivel 4 win */}
      {showStarterPack && (
        <StarterPack 
          levelJustCompleted={lastCompletedLevel}
          onClose={() => setShowStarterPack(false)}
          onPurchaseSuccess={() => {
            if (shouldApplyClientPersistentRewards) {
              // starter_pack: 500 gems, 10 lives, 3 powerups
              addGems(500);
              addLives(10);
              addHammer(); addShuffle(); addUndo();
            }
            toast.success('¡Starter Pack activado! +500💎 +10❤️ +3🔨');
          }}
        />
      )}

      {/* Lucky Spin - SOLO después de nivel 5 */}
      {gameState.completedLevels.length >= 5 && <LuckySpin />}

      {/* Tutorial - auto-skip (desactivado) */}
      <Tutorial onComplete={() => console.log('Tutorial completado')} />

      {/* Achievement Modal */}
      {newlyUnlocked && (
        <AchievementModal
          achievement={newlyUnlocked}
          onClose={clearNewlyUnlocked}
        />
      )}

      {/* Push Notification Prompt - SOLO después de nivel 2 */}
      {!isNewUser && <NotificationPrompt onClose={() => {}} levelsCompleted={gameState.completedLevels.length} />}

      {/* Come Back Banner - SOLO después de nivel 2 */}
      {!isNewUser && (
        <ComeBackBanner 
          onClaimReward={(gems, lives) => {
            addGems(gems);
            addLives(lives);
            toast.success(`¡Bienvenido de vuelta! +${gems}💎 +${lives}❤️`);
          }}
        />
      )}

      {/* Review Request Modal - SOLO después de nivel 2 */}
      {!isNewUser && <ReviewRequestModal gamesPlayed={gamesPlayed} />}

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

      {/* Day 2-3 Unlock Bonus - SOLO después de nivel 2 */}
      {!isNewUser && (
        <Day2UnlockBanner 
          streak={streakData.currentStreak}
          onClaimReward={(gems, lives, powerUps) => {
            addGems(gems);
            addLives(lives);
            if (powerUps?.hammers) {
              toast.success(`¡MEGA REGALO Día ${streakData.currentStreak}! +${gems}💎 +${lives}❤️ +${powerUps.hammers}🔨`);
            } else {
              toast.success(`¡Regalo Día ${streakData.currentStreak} reclamado! +${gems}💎 +${lives}❤️`);
            }
          }}
        />
      )}

      {/* First Win Celebration - OK para nuevos */}
      {showFirstWin && (
        <FirstWinCelebration 
          levelsCompleted={gameState.completedLevels.length}
          onClose={() => setShowFirstWin(false)}
        />
      )}

      {/* Welcome Offer - €0.49 SOLO después de nivel 3 derrota */}
      {showWelcomeOffer && !isNewUser && (
        <WelcomeOffer
          onPurchase={() => {
            // welcome_pack: 5 powerups, 3 lives
            addLives(3);
            addHammer(); addHammer(); addShuffle(); addShuffle(); addUndo();
            toast.success('¡Pack Bienvenida activado! +5 movimientos, +3 boosters');
            setShowWelcomeOffer(false);
          }}
          onDismiss={() => setShowWelcomeOffer(false)}
        />
      )}

      {/* First Session Reward - SOLO después de nivel 2 */}
      {!isNewUser && (
        <FirstSessionReward 
          levelJustCompleted={lastCompletedLevel}
          onClaim={(gems, lives) => {
            addGems(gems);
            addLives(lives);
            toast.success(`¡Bienvenido! +${gems}💎 +${lives}❤️`);
          }}
          onClose={() => {}}
        />
      )}


      {/* Share Prompt - SOLO después de nivel 3 */}
      {!isNewUser && (
        <SharePrompt 
          gamesPlayed={gamesPlayed}
          daysPlayed={streakData.currentStreak}
        />
      )}

      {/* Flash Offer - after 2 consecutive losses */}
      {showFlashOffer && (
        <FlashOffer 
          trigger="loss"
          onClose={() => {
            setShowFlashOffer(false);
            setConsecutiveLosses(0);
          }}
          onPurchaseSuccess={() => {
            // flash_offer: 10 lives, 150 gems
            addLives(10);
            addGems(150);
            toast.success('¡Pack Relámpago activado! +10❤️ +150💎');
          }}
        />
      )}

      {/* Post Victory Offer - SOLO después de nivel 2 */}
      {showPostVictoryOffer && lastWinGems > 0 && !isNewUser && (
        <PostVictoryOffer 
          baseGems={lastWinGems}
          onClose={() => setShowPostVictoryOffer(false)}
          onMultiply={(newGems) => {
            addGems(newGems - lastWinGems);
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

      {/* Loot Chest Modal */}
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

      {/* Spring Event - SOLO después de nivel 8, respetar dismiss */}
      {gameState.completedLevels.length >= 8 && !springEventDismissed && <SpringEvent onClose={() => setSpringEventDismissed(true)} />}
    </div>
  );
};

export default Index;