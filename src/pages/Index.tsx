import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useLanguage } from '@/hooks/useLanguage';
import { GameHeader } from '@/components/GameHeader';
import { GameScreen } from '@/components/GameScreen';
import { LevelSelect } from '@/components/LevelSelect';
import { Shop } from '@/components/Shop';
import { Button } from '@/components/ui/button';
import { LEVELS } from '@/data/levels';
import { toast } from 'sonner';
import { Play, Grid3x3, ShoppingBag, Tv } from 'lucide-react';

type Screen = 'menu' | 'game' | 'levels' | 'shop';

const Index = () => {
  const { t } = useLanguage();
  const {
    gameState,
    loseLife,
    addLives,
    addGems,
    addLeaves,
    completeLevel,
    selectLevel,
    activateUnlimitedLives,
    hasUnlimitedLives,
    getTimeUntilNextLife,
  } = useGameState();

  const [screen, setScreen] = useState<Screen>('menu');

  const currentLevel = LEVELS.find(l => l.id === gameState.currentLevel) || LEVELS[0];

  const handlePlayClick = () => {
    if (gameState.lives > 0 || hasUnlimitedLives()) {
      loseLife();
      setScreen('game');
    } else {
      toast.error(t('resources.lives') + ' = 0');
    }
  };

  const handleWin = (stars: number, reward: { leaves: number; gems?: number }) => {
    completeLevel(currentLevel.id, reward);
    toast.success(`${t('game.win')} +${reward.leaves} ${t('resources.leaves')}${reward.gems ? ` +${reward.gems} 💎` : ''}`);
    setScreen('menu');
  };

  const handleLose = () => {
    toast.error(t('game.lose'));
    setScreen('menu');
  };

  const handleSelectLevel = (levelId: number) => {
    if (gameState.lives > 0 || hasUnlimitedLives()) {
      selectLevel(levelId);
      loseLife();
      setScreen('game');
    } else {
      toast.error(t('resources.lives') + ' = 0');
    }
  };

  const handlePurchase = (productId: string) => {
    // Simulate purchases
    switch (productId) {
      case 'gems_100':
        addGems(100);
        break;
      case 'gems_550':
        addGems(550);
        break;
      case 'gems_1200':
        addGems(1200);
        break;
      case 'unlimited_lives':
        activateUnlimitedLives(1);
        break;
      case 'starter_pack':
        addGems(200);
        addLives(5);
        break;
      case 'garden_pass':
        addGems(50);
        break;
    }
    setScreen('menu');
  };

  const handleWatchAd = () => {
    toast.success('Ad watched! +1 life');
    addLives(1);
  };

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
    return (
      <LevelSelect
        unlockedLevels={gameState.unlockedLevels}
        onSelectLevel={handleSelectLevel}
        onBack={() => setScreen('menu')}
      />
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <GameHeader
          lives={gameState.lives}
          gems={gameState.gems}
          leaves={gameState.leaves}
          hasUnlimitedLives={hasUnlimitedLives()}
          timeUntilNextLife={getTimeUntilNextLife()}
          onShopClick={() => setScreen('shop')}
        />

        {/* Logo */}
        <div className="text-center mb-8 animate-float">
          <h1 className="text-5xl font-bold text-gold mb-2 drop-shadow-lg">
            {t('game.title')}
          </h1>
          <div className="text-6xl mb-4">🌸🌺🌼</div>
        </div>

        {/* Main Menu */}
        <div className="gradient-card shadow-card rounded-2xl p-6 mb-6">
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
            disabled={gameState.lives === 0 && !hasUnlimitedLives()}
            className="w-full gradient-gold shadow-gold text-xl py-6 hover:scale-105 transition-all mb-4"
          >
            <Play className="w-6 h-6 mr-2" />
            {t('game.play')}
          </Button>

          {gameState.lives === 0 && !hasUnlimitedLives() && (
            <Button
              onClick={handleWatchAd}
              variant="outline"
              className="w-full mb-2"
            >
              <Tv className="w-5 h-5 mr-2" />
              {t('game.watchAd')} (+1 ❤️)
            </Button>
          )}

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
        </div>

        {/* Progress */}
        <div className="gradient-card shadow-card rounded-2xl p-4 text-center">
          <div className="text-sm text-muted-foreground mb-2">
            {t('menu.levels')} {t('game.objective')}
          </div>
          <div className="flex justify-center gap-2">
            {[...Array(Math.min(5, gameState.unlockedLevels))].map((_, i) => (
              <div key={i} className="w-8 h-8 gradient-gold rounded-full flex items-center justify-center font-bold">
                {i + 1}
              </div>
            ))}
            {gameState.unlockedLevels < 50 && (
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                🔒
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shop Modal */}
      {screen === 'shop' && (
        <Shop
          onClose={() => setScreen('menu')}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
};

export default Index;
