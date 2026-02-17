import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GameState {
  lives: number;
  gems: number;
  currentLevel: number;
  completedLevels: number[];
  hammers: number;
  undos: number;
  shuffles: number;
  lastLifeRefill: number;
  unlimitedLivesUntil: number | null;
}

const INITIAL_STATE: GameState = {
  lives: 5,
  gems: 0,
  currentLevel: 1,
  completedLevels: [],
  hammers: 3,
  undos: 0,
  shuffles: 0,
  lastLifeRefill: Date.now(),
  unlimitedLivesUntil: null,
};

const LIFE_REFILL_TIME = 35 * 60 * 1000; // 35 minutes - más tiempo para que duela esperar

export const useGameState = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  // Load game progress from database
  useEffect(() => {
    if (!user) {
      setGameState(INITIAL_STATE);
      setLoading(false);
      return;
    }

    // CRITICAL: Set loading=true BEFORE async load to prevent
    // the save effect from overwriting DB data with INITIAL_STATE
    setLoading(true);

    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('game_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setGameState({
            lives: data.lives,
            gems: data.gems,
            currentLevel: data.current_level,
            completedLevels: data.completed_levels || [],
            hammers: data.hammer_count,
            undos: data.undo_count,
            shuffles: data.shuffle_count,
            lastLifeRefill: new Date(data.last_life_refill).getTime(),
            unlimitedLivesUntil: data.unlimited_lives_until ? new Date(data.unlimited_lives_until).getTime() : null,
          });
        }
      } catch (error) {
        console.error('Error loading game progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  // Save to database whenever state changes
  useEffect(() => {
    if (!user || loading) return;

    const saveProgress = async () => {
      try {
        console.log('[SAVE] Saving progress:', {
          level: gameState.currentLevel,
          completed: gameState.completedLevels,
          gems: gameState.gems,
          lives: gameState.lives,
        });
        const { error } = await supabase
          .from('game_progress')
          .upsert({
            user_id: user.id,
            lives: gameState.lives,
            gems: gameState.gems,
            current_level: gameState.currentLevel,
            completed_levels: gameState.completedLevels,
            hammer_count: gameState.hammers,
            undo_count: gameState.undos,
            shuffle_count: gameState.shuffles,
            last_life_refill: new Date(gameState.lastLifeRefill).toISOString(),
            unlimited_lives_until: gameState.unlimitedLivesUntil ? new Date(gameState.unlimitedLivesUntil).toISOString() : null,
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('[SAVE] ❌ FAILED:', error.message, error.code);
          throw error;
        } else {
          console.log('[SAVE] ✅ OK - level:', gameState.currentLevel, 'completed:', gameState.completedLevels);
        }
      } catch (error) {
        console.error('[SAVE] ❌ Error saving game progress:', error);
      }
    };

    saveProgress();
  }, [gameState, user, loading]);

  // Life refill system with notification callback
  const onLivesFullRef = useRef<(() => void) | null>(null);

  const setOnLivesFull = useCallback((callback: () => void) => {
    onLivesFullRef.current = callback;
  }, []);

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
          
          // Trigger notification when lives become full
          if (newLives === 5 && prev.lives < 5 && onLivesFullRef.current) {
            onLivesFullRef.current();
          }
          
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

  const spendGems = useCallback((amount: number) => {
    setGameState((prev) => {
      if (prev.gems >= amount) {
        return { ...prev, gems: prev.gems - amount };
      }
      return prev;
    });
  }, []);

  const completeLevel = useCallback((levelId: number, reward: { gems?: number }) => {
    console.log('[GAME] ✅ completeLevel called! levelId:', levelId, 'reward:', reward);
    setGameState((prev) => {
      const newCompletedLevels = prev.completedLevels.includes(levelId)
        ? prev.completedLevels
        : [...prev.completedLevels, levelId];
      
      console.log('[GAME] State update: currentLevel', prev.currentLevel, '→', levelId + 1, 'completed:', newCompletedLevels);
      return {
        ...prev,
        currentLevel: levelId + 1,
        completedLevels: newCompletedLevels,
        gems: prev.gems + (reward.gems || 0),
      };
    });
  }, []);

  const selectLevel = useCallback((levelId: number) => {
    setGameState((prev) => ({ ...prev, currentLevel: levelId }));
  }, []);

  const addHammer = useCallback(() => {
    setGameState((prev) => ({ ...prev, hammers: prev.hammers + 1 }));
  }, []);

  const addUndo = useCallback(() => {
    setGameState((prev) => ({ ...prev, undos: prev.undos + 1 }));
  }, []);

  const addShuffle = useCallback(() => {
    setGameState((prev) => ({ ...prev, shuffles: prev.shuffles + 1 }));
  }, []);

  const useHammer = useCallback(() => {
    setGameState((prev) => {
      if (prev.hammers > 0) {
        return { ...prev, hammers: prev.hammers - 1 };
      }
      return prev;
    });
  }, []);

  const useUndo = useCallback(() => {
    setGameState((prev) => {
      if (prev.undos > 0) {
        return { ...prev, undos: prev.undos - 1 };
      }
      return prev;
    });
  }, []);

  const useShuffle = useCallback(() => {
    setGameState((prev) => {
      if (prev.shuffles > 0) {
        return { ...prev, shuffles: prev.shuffles - 1 };
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
    loading,
    loseLife,
    addLives,
    addGems,
    spendGems,
    completeLevel,
    selectLevel,
    addHammer,
    addUndo,
    addShuffle,
    useHammer,
    useUndo,
    useShuffle,
    activateUnlimitedLives,
    hasUnlimitedLives,
    getTimeUntilNextLife,
    setOnLivesFull,
  };
};
