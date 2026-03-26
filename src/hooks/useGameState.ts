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

const LOCAL_STORAGE_KEY = 'mystic_guest_progress';
const LIFE_REFILL_TIME = 35 * 60 * 1000; // 35 minutes

/** Load guest progress from localStorage */
const loadLocalProgress = (): GameState | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

/** Save guest progress to localStorage */
const saveLocalProgress = (state: GameState) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

export const useGameState = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>(() => {
    // On first render, load from localStorage immediately (guest mode)
    return loadLocalProgress() || INITIAL_STATE;
  });
  const [loading, setLoading] = useState(true);

  // Track if we've loaded from DB at least once
  const hasLoadedRef = useRef(false);

  // Block saves during reload to prevent race conditions
  const blockSaveRef = useRef(false);
  // Load game progress — from DB if logged in, from localStorage if guest
  useEffect(() => {
    if (!user) {
      // Guest mode: load from localStorage (already done in useState init)
      const local = loadLocalProgress();
      if (local) {
        setGameState(local);
      }
      setLoading(false);
      hasLoadedRef.current = true;
      return;
    }

    // Logged in: load from DB
    setLoading(true);
    hasLoadedRef.current = false;

    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('game_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const dbState: GameState = {
            lives: data.lives,
            gems: data.gems,
            currentLevel: data.current_level,
            completedLevels: data.completed_levels || [],
            hammers: data.hammer_count,
            undos: data.undo_count,
            shuffles: data.shuffle_count,
            lastLifeRefill: new Date(data.last_life_refill).getTime(),
            unlimitedLivesUntil: data.unlimited_lives_until ? new Date(data.unlimited_lives_until).getTime() : null,
          };

          // Merge: if guest played further, keep the better progress
          const local = loadLocalProgress();
          if (local && local.currentLevel > dbState.currentLevel) {
            // Guest progress is ahead — merge it
            const merged: GameState = {
              ...dbState,
              currentLevel: Math.max(dbState.currentLevel, local.currentLevel),
              completedLevels: [...new Set([...dbState.completedLevels, ...local.completedLevels])],
              gems: dbState.gems + local.gems,
              lives: Math.max(dbState.lives, local.lives),
              hammers: dbState.hammers + local.hammers,
              undos: dbState.undos + local.undos,
              shuffles: dbState.shuffles + local.shuffles,
            };
            setGameState(merged);
            // Clear guest progress after merge
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            console.log('[GAME] ✅ Guest progress merged with cloud');
          } else {
            setGameState(dbState);
            // Clear local since DB is ahead
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } else {
          // No DB data — check if there's guest progress to migrate
          const local = loadLocalProgress();
          if (local) {
            setGameState(local);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            console.log('[GAME] ✅ Guest progress migrated to new account');
          }
        }
        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading game progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  // Save progress whenever state changes (debounced to prevent race conditions)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading || !hasLoadedRef.current) return;

      if (blockSaveRef.current) return; // 🔒 Don't save if blocked
    if (user) {
      // Debounce DB saves by 400ms to prevent concurrent upserts
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (blockSaveRef.current) {
          console.log('[SAVE] Skipped because reloadFromDB is in progress');
          return;
        }

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
      }, 400);
    } else {
      // Guest: save to localStorage (instant, no debounce needed)
      saveLocalProgress(gameState);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
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
        
        if (prev.unlimitedLivesUntil && now < prev.unlimitedLivesUntil) {
          return prev;
        }
        
        if (prev.unlimitedLivesUntil && now >= prev.unlimitedLivesUntil) {
          return { ...prev, unlimitedLivesUntil: null };
        }
        
        if (prev.lives < 5 && timeSinceLastRefill >= LIFE_REFILL_TIME) {
          const livesToAdd = Math.floor(timeSinceLastRefill / LIFE_REFILL_TIME);
          const newLives = Math.min(5, prev.lives + livesToAdd);
          
          if (newLives === 5 && prev.lives < 5 && onLivesFullRef.current) {
            onLivesFullRef.current();
          }
          
          // Keep remainder time instead of resetting to now
          const consumedTime = livesToAdd * LIFE_REFILL_TIME;
          return {
            ...prev,
            lives: newLives,
            lastLifeRefill: prev.lastLifeRefill + consumedTime,
          };
        }
        
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loseLife = useCallback(() => {
    setGameState((prev) => {
      if (prev.unlimitedLivesUntil && Date.now() < prev.unlimitedLivesUntil) {
        return prev;
      }
      return { ...prev, lives: Math.max(0, prev.lives - 1) };
    });
  }, []);

  const addLives = useCallback((amount: number) => {
    setGameState((prev) => ({
      ...prev,
      lives: Math.min(99, prev.lives + amount),
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
    return Math.ceil(timeUntilNext / 1000);
  }, [gameState.lastLifeRefill, gameState.lives, hasUnlimitedLives]);

  const reloadFromDB = useCallback(async () => {
    if (!user) return;
    blockSaveRef.current = true;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const dbState: GameState = {
          lives: data.lives,
          gems: data.gems,
          currentLevel: data.current_level,
          completedLevels: data.completed_levels || [],
          hammers: data.hammer_count,
          undos: data.undo_count,
          shuffles: data.shuffle_count,
          lastLifeRefill: new Date(data.last_life_refill).getTime(),
          unlimitedLivesUntil: data.unlimited_lives_until ? new Date(data.unlimited_lives_until).getTime() : null,
        };
        setGameState(dbState);
        console.log('[GAME] 🔄 Reloaded from DB after purchase:', dbState);
      }
    } catch (error) {
      console.error('Error reloading from DB:', error);
    } finally {
      setTimeout(() => { blockSaveRef.current = false; }, 4000);
    }
  }, [user]);
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
    reloadFromDB,
    setOnLivesFull,
  };
};
