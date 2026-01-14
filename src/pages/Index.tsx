import { useState, useEffect, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { useAudio } from '@/hooks/useAudio';
import { useAchievements } from '@/hooks/useAchievements';
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
import { Button } from '@/components/ui/button';
import { LEVELS } from '@/data/levels';
import { PRODUCTS } from '@/data/products';
import { toast } from 'sonner';
import { Play, Grid3x3, ShoppingBag, LogOut, User, Volume2, VolumeX, Crown, Trophy } from 'lucide-react';

type Screen = 'menu' | 'game' | 'levels' | 'shop';

const Index = () => {
  const { t } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAdsDisabled, addPurchase } = usePurchases(user);
  const { isPlaying, isMuted, play, toggleMute } = useAudio(`${import.meta.env.BASE_URL}audio/background-music.mp3`);
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

  const handleWin = useCallback(async (stars: number, reward: { gems?: number }) => {
    completeLevel(currentLevel.id, reward);
    toast.success(`${t('game.win')}${reward.gems ? ` +${reward.gems} 💎` : ''}`);
    
    // Check achievements
    const completedCount = gameState.completedLevels.length + 1;
    await checkLevelAchievements(completedCount);
    if (reward.gems) {
      await checkGemsAchievements(gameState.gems + reward.gems);
    }
    
    setScreen('menu');
  }, [completeLevel, currentLevel.id, t, gameState.completedLevels.length, gameState.gems, checkLevelAchievements, checkGemsAchievements]);

  const handleLose = useCallback(() => {
    toast.error(t('game.lose'));
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
              onClick={signOut}
              variant="ghost"
              size="sm"
              id="logout-btn"
            >
              <LogOut className="w-4 h-4" />
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
          <Button
            onClick={() => setShowBattlePass(true)}
            variant="outline"
            className="w-full mt-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 hover:border-yellow-400"
          >
            <Crown className="w-5 h-5 mr-2 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Battle Pass</span>
          </Button>
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
    </div>
  );
};

export default Index;