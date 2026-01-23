import { useState, useEffect, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { useAudio } from '@/hooks/useAudio';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useClickSound } from '@/hooks/useClickSound';
import { AuthPage } from '@/components/AuthPage';
import { GameHeader } from '@/components/GameHeader';
import { GameScreen } from '@/components/GameScreen';
import { LevelSelect } from '@/components/LevelSelect';
import { Shop } from '@/components/Shop';
import { NoLivesModal } from '@/components/NoLivesModal';
import { FirstDayOffer } from '@/components/game/FirstDayOffer';
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
import { SharePrompt } from '@/components/game/SharePrompt';
import { DayCounter } from '@/components/game/DayCounter';
import { MotivationalMessage } from '@/components/game/MotivationalMessage';
import { AdBanner } from '@/components/ads/AdBanner';
import { Button } from '@/components/ui/button';
import { LEVELS } from '@/data/levels';
import { PRODUCTS } from '@/data/products';
import { toast } from 'sonner';
import { Play, Grid3x3, ShoppingBag, User, Volume2, VolumeX, Crown, Flame, DoorOpen } from 'lucide-react';

type Screen = 'menu' | 'game' | 'levels' | 'shop';

const Index = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAdsDisabled, addPurchase } = usePurchases(user);
  const { isPlaying, isMuted, play, toggleMute } = useAudio(`${import.meta.env.BASE_URL}audio/background-music.mp3`);
  const { playClick } = useClickSound();
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
  } = useGameState();
  
  const { 
    newlyUnlocked, 
    clearNewlyUnlocked, 
    checkLevelAchievements,
    checkGemsAchievements 
  } = useAchievements(user?.id);

  const [screen, setScreen] = useState<Screen>('menu');
  const [showNoLivesModal, setShowNoLivesModal] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFirstWin, setShowFirstWin] = useState(false);
  const [showMotivational, setShowMotivational] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [justWonClean, setJustWonClean] = useState(false);
  
  // Daily Streak & Push Notifications
  const { streakData, claimDailyReward } = useDailyStreak();
  const { scheduleLivesFullNotification, scheduleStreakReminder } = usePushNotifications();

  // Auto-show streak calendar if reward available
  useEffect(() => {
    if (streakData.canClaimToday && user) {
      const timer = setTimeout(() => {
        setShowStreakCalendar(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [streakData.canClaimToday, user]);

  // Schedule streak reminder if user has a streak
  useEffect(() => {
    if (streakData.currentStreak > 0 && !streakData.canClaimToday) {
      scheduleStreakReminder(streakData.currentStreak);
    }
  }, [streakData.currentStreak, streakData.canClaimToday, scheduleStreakReminder]);

  useEffect(() => {
    if (!user) return;

    const handleFirstInteraction = () => {
      if (!isPlaying) {
        play();
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [user, isPlaying, play]);

  const currentLevel = LEVELS.find(l => l.id === gameState.currentLevel) || LEVELS[0];

  const handlePlayClick = () => {
    if (gameState.lives > 0 || hasUnlimitedLives()) {
      loseLife();
      setScreen('game');
    } else {
      setShowNoLivesModal(true);
    }
  };

  const handleWin = useCallback(async (stars: number, reward: { gems?: number }, usedPowerups: boolean = false) => {
    completeLevel(currentLevel.id, reward);
    toast.success(`${t('game.win')}${reward.gems ? ` +${reward.gems} 💎` : ''}`);
    
    // Increment games played counter for review request
    setGamesPlayed(prev => prev + 1);
    
    // Track if won without using power-ups (for smart review gate)
    setJustWonClean(!usedPowerups);
    
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
    
    // Show motivational message after levels 3-4
    if (completedCount === 3 || completedCount === 4) {
      setTimeout(() => setShowMotivational(true), 1000);
    }
    
    setScreen('menu');
  }, [completeLevel, currentLevel.id, t, gameState.completedLevels.length, gameState.gems, checkLevelAchievements, checkGemsAchievements]);

  const handleLose = useCallback(() => {
    toast.error(t('game.lose'));
    // Increment games played counter for review request
    setGamesPlayed(prev => prev + 1);
    setScreen('menu');
  }, [t]);

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

  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  if (screen === 'game') {
    return (
      <GameScreen
        level={currentLevel}
        onWin={handleWin}
        onLose={handleLose}
        onBack={() => setScreen('menu')}
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
            <span className="text-sm">{user.email?.split('@')[0]}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              id="toggle-music-btn"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Button
              onClick={() => setShowExitModal(true)}
              variant="ghost"
              size="sm"
              id="exit-btn"
              className="text-red-400 hover:text-red-300"
            >
              <DoorOpen className="w-5 h-5" />
            </Button>
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
        </div>

        {/* Rewarded Ads Section */}
        <div className="mb-4">
          <RewardedAds onRewardEarned={handleRewardedAdEarned} />
        </div>
      </div>

      {/* Shop Modal */}
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

      {/* Push Notification Prompt */}
      <NotificationPrompt onClose={() => {}} />

      {/* Come Back Banner for returning users */}
      <ComeBackBanner 
        onClaimReward={(gems, lives) => {
          addGems(gems);
          addLives(lives);
          toast.success(`¡Bienvenido de vuelta! +${gems}💎 +${lives}❤️`);
        }}
      />

      {/* Smart Review Gate - shows after positive emotional moment */}
      <ReviewRequestModal 
        daysPlayed={streakData.maxStreak || streakData.currentStreak}
        currentStreak={streakData.currentStreak}
        justWonClean={justWonClean}
        onRespond={() => setJustWonClean(false)}
      />

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <ExitConfirmModal 
          onStay={() => setShowExitModal(false)}
          streak={streakData.currentStreak}
        />
      )}

      {/* Day 2-3 Unlock Bonus */}
      <Day2UnlockBanner 
        streak={streakData.currentStreak}
        onClaimReward={(gems, lives) => {
          addGems(gems);
          addLives(lives);
          toast.success(`¡Regalo Día ${streakData.currentStreak} reclamado! +${gems}💎 +${lives}❤️`);
        }}
      />

      {/* First Win Celebration */}
      {showFirstWin && (
        <FirstWinCelebration 
          levelsCompleted={gameState.completedLevels.length}
          onClose={() => setShowFirstWin(false)}
        />
      )}

      {/* Motivational Message - after levels 3-4 */}
      {showMotivational && (
        <MotivationalMessage 
          levelsCompleted={gameState.completedLevels.length}
          onClose={() => setShowMotivational(false)}
        />
      )}

      {/* Share Prompt - after 5 games or 1 day */}
      <SharePrompt 
        gamesPlayed={gamesPlayed}
        daysPlayed={streakData.currentStreak}
      />

      {/* Banner Ad - SOLO en menú principal */}
      <AdBanner visible={screen === 'menu'} />

      {/* Espacio para el banner */}
      <div className="h-[60px]" />
    </div>
  );
};

export default Index;