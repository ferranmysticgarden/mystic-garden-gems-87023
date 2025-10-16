import { useState, useEffect, useCallback } from 'react';

export interface GameState {
  lives: number;
  gems: number;
  leaves: number;
  currentLevel: number;
  unlockedLevels: number;
  hammers: number;
  bombs: number;
  lastLifeRefill: number;
  unlimitedLivesUntil: number | null;
}

const INITIAL_STATE: GameState = {
  lives: 5,
  gems: 0,
  leaves: 0,
  currentLevel: 1,
  unlockedLevels: 1,
  hammers: 0,
  bombs: 0,
  lastLifeRefill: Date.now(),
  unlimitedLivesUntil: null,
};

const LIFE_REFILL_TIME = 25 * 60 * 1000; // 25 minutes in milliseconds

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('mysticGardenState');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('mysticGardenState', JSON.stringify(gameState));
  }, [gameState]);

  // Life refill system
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const now = Date.now();
        const timeSinceLastRefill = now - prev.lastLifeRefill;
        
        // Check unlimited lives
        if (prev.unlimitedLivesUntil && now < prev.unlimitedLivesUntil) {
          return prev; // Don't refill when unlimited
        }
        
        // Remove expired unlimited lives
        if (prev.unlimitedLivesUntil && now >= prev.unlimitedLivesUntil) {
          return { ...prev, unlimitedLivesUntil: null };
        }
        
        // Refill lives
        if (prev.lives < 5 && timeSinceLastRefill >= LIFE_REFILL_TIME) {
          const livesToAdd = Math.floor(timeSinceLastRefill / LIFE_REFILL_TIME);
          const newLives = Math.min(5, prev.lives + livesToAdd);
          return {
            ...prev,
            lives: newLives,
            lastLifeRefill: now,
          };
        }
        
        return prev;
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  const loseLife = useCallback(() => {
    setGameState((prev) => {
      if (prev.unlimitedLivesUntil && Date.now() < prev.unlimitedLivesUntil) {
        return prev; // Don't lose life when unlimited
      }
      return { ...prev, lives: Math.max(0, prev.lives - 1) };
    });
  }, []);

  const addLives = useCallback((amount: number) => {
    setGameState((prev) => ({
      ...prev,
      lives: Math.min(5, prev.lives + amount),
      lastLifeRefill: Date.now(),
    }));
  }, []);

  const addGems = useCallback((amount: number) => {
    setGameState((prev) => ({ ...prev, gems: prev.gems + amount }));
  }, []);

  const addLeaves = useCallback((amount: number) => {
    setGameState((prev) => ({ ...prev, leaves: prev.leaves + amount }));
  }, []);

  const spendGems = useCallback((amount: number) => {
    setGameState((prev) => {
      if (prev.gems >= amount) {
        return { ...prev, gems: prev.gems - amount };
      }
      return prev;
    });
  }, []);

  const completeLevel = useCallback((levelId: number, reward: { leaves: number; gems?: number }) => {
    setGameState((prev) => ({
      ...prev,
      currentLevel: levelId + 1,
      unlockedLevels: Math.max(prev.unlockedLevels, levelId + 1),
      leaves: prev.leaves + reward.leaves,
      gems: prev.gems + (reward.gems || 0),
    }));
  }, []);

  const selectLevel = useCallback((levelId: number) => {
    setGameState((prev) => ({ ...prev, currentLevel: levelId }));
  }, []);

  const addHammer = useCallback(() => {
    setGameState((prev) => ({ ...prev, hammers: prev.hammers + 1 }));
  }, []);

  const addBomb = useCallback(() => {
    setGameState((prev) => ({ ...prev, bombs: prev.bombs + 1 }));
  }, []);

  const useHammer = useCallback(() => {
    setGameState((prev) => {
      if (prev.hammers > 0) {
        return { ...prev, hammers: prev.hammers - 1 };
      }
      return prev;
    });
  }, []);

  const useBomb = useCallback(() => {
    setGameState((prev) => {
      if (prev.bombs > 0) {
        return { ...prev, bombs: prev.bombs - 1 };
      }
      return prev;
    });
  }, []);

  const activateUnlimitedLives = useCallback((hours: number) => {
    setGameState((prev) => ({
      ...prev,
      unlimitedLivesUntil: Date.now() + hours * 60 * 60 * 1000,
    }));
  }, []);

  const hasUnlimitedLives = useCallback(() => {
    return gameState.unlimitedLivesUntil !== null && Date.now() < gameState.unlimitedLivesUntil;
  }, [gameState.unlimitedLivesUntil]);

  const getTimeUntilNextLife = useCallback(() => {
    if (hasUnlimitedLives() || gameState.lives >= 5) return 0;
    const timeSinceLastRefill = Date.now() - gameState.lastLifeRefill;
    const timeUntilNext = LIFE_REFILL_TIME - (timeSinceLastRefill % LIFE_REFILL_TIME);
    return Math.ceil(timeUntilNext / 1000); // Return in seconds
  }, [gameState.lastLifeRefill, gameState.lives, hasUnlimitedLives]);

  return {
    gameState,
    loseLife,
    addLives,
    addGems,
    addLeaves,
    spendGems,
    completeLevel,
    selectLevel,
    addHammer,
    addBomb,
    useHammer,
    useBomb,
    activateUnlimitedLives,
    hasUnlimitedLives,
    getTimeUntilNextLife,
  };
};
