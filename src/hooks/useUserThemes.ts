import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LS_KEYS } from '@/constants/localStorageKeys';
import { DEFAULT_THEME_ID, THEME_LEVEL_UNLOCKS, THEME_MAP, THEMES, type ThemeId, type ThemeUnlockMethod } from '@/data/themes';
import { useAuth } from './useAuth';
import { useGameState } from './useGameState';
import { trackEvent } from '@/lib/trackEvent';

const ACTIVE_THEME_KEY = 'active_theme_v1';
const GUEST_UNLOCKS_KEY = 'guest_theme_unlocks_v1';

type ThemeUnlockMap = Record<ThemeId, ThemeUnlockMethod>;

const getGuestId = (): string | null => {
  try {
    return localStorage.getItem(LS_KEYS.GUEST_SESSION_ID);
  } catch {
    return null;
  }
};

const loadGuestUnlocks = (): ThemeUnlockMap => {
  try {
    const raw = localStorage.getItem(GUEST_UNLOCKS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { flowers: 'default', ...parsed };
  } catch {
    return { flowers: 'default' } as ThemeUnlockMap;
  }
};

const saveGuestUnlocks = (value: ThemeUnlockMap) => {
  localStorage.setItem(GUEST_UNLOCKS_KEY, JSON.stringify(value));
};

const loadActiveTheme = (): ThemeId => {
  try {
    const raw = localStorage.getItem(ACTIVE_THEME_KEY) as ThemeId | null;
    return raw && THEME_MAP[raw] ? raw : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
};

// Store módulo-nivel para activeTheme: garantiza que TODAS las instancias
// del hook (CustomizeScreen, Tile, GameHeader…) compartan el mismo valor
// y se re-rendericen cuando cambia. Patrón useSyncExternalStore, igual que
// tileSkinStore. Sin esto, cada componente tenía su copia local desincronizada.
let activeThemeSnapshot: ThemeId = loadActiveTheme();
const activeThemeListeners = new Set<() => void>();
const activeThemeStore = {
  getSnapshot: (): ThemeId => activeThemeSnapshot,
  subscribe: (listener: () => void) => {
    activeThemeListeners.add(listener);
    return () => activeThemeListeners.delete(listener);
  },
  set: (next: ThemeId) => {
    if (activeThemeSnapshot === next) return;
    activeThemeSnapshot = next;
    try { localStorage.setItem(ACTIVE_THEME_KEY, next); } catch { /* best effort */ }
    activeThemeListeners.forEach((l) => l());
  },
};

export const useUserThemes = () => {
  const { user } = useAuth();
  const { gameState } = useGameState();
  const [unlockMap, setUnlockMap] = useState<ThemeUnlockMap>(() => ({ flowers: 'default', ...loadGuestUnlocks() }));
  const activeTheme = useSyncExternalStore(activeThemeStore.subscribe, activeThemeStore.getSnapshot, activeThemeStore.getSnapshot);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnlockMap({ flowers: 'default', ...loadGuestUnlocks() });
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('user_themes')
      .select('theme_id, unlocked_method')
      .eq('user_id', user.id);

    if (error) {
      console.error('[themes] refresh error', error);
      setLoading(false);
      return;
    }

    const next: ThemeUnlockMap = { flowers: 'default' } as ThemeUnlockMap;
    for (const row of data ?? []) {
      if (row.theme_id in THEME_MAP) {
        next[row.theme_id as ThemeId] = row.unlocked_method as ThemeUnlockMethod;
      }
    }
    setUnlockMap(next);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    // Guard aflojado: solo reset si el tema NO existe en THEME_MAP (id inválido).
    // Antes se reseteaba también si no estaba en unlockMap, provocando carrera
    // con refresh() async y volviendo a 'flowers' un tema recién aplicado.
    if (!THEME_MAP[activeTheme]) {
      activeThemeStore.set(DEFAULT_THEME_ID);
    }
  }, [activeTheme]);

  const setActiveTheme = useCallback((themeId: ThemeId) => {
    if (!(themeId in unlockMap)) return false;
    activeThemeStore.set(themeId);
    trackEvent('theme_applied', { theme_id: themeId });
    return true;
  }, [unlockMap]);

  const unlockThemeLocal = useCallback((themeId: ThemeId, method: ThemeUnlockMethod) => {
    setUnlockMap((prev) => {
      const next = { ...prev, [themeId]: method };
      if (!user) saveGuestUnlocks(next);
      return next;
    });
  }, [user]);

  const unlockTheme = useCallback(async (themeId: ThemeId, method: Exclude<ThemeUnlockMethod, 'default'>, purchaseRef?: string) => {
    const guestSessionId = !user ? getGuestId() ?? undefined : undefined;
    const { data, error } = await supabase.functions.invoke('unlock-theme', {
      body: { themeId, method, guestSessionId, purchaseRef },
    });
    if (error) throw error;
    unlockThemeLocal(themeId, method);
    return data as { success: boolean; alreadyUnlocked?: boolean; themeId: ThemeId };
  }, [unlockThemeLocal, user]);

  const maybeAutoUnlockByLevel = useCallback(async (): Promise<ThemeId | null> => {
    const level = gameState.currentLevel;
    const candidate = (Object.entries(THEME_LEVEL_UNLOCKS).find(([, unlockLevel]) => unlockLevel === level)?.[0] ?? null) as ThemeId | null;
    if (!candidate) return null;
    if (unlockMap[candidate]) return null;
    try {
      await unlockTheme(candidate, 'level', `level_${level}`);
      trackEvent('theme_unlocked', { theme_id: candidate, unlock_method: 'level', level });
      return candidate;
    } catch (error) {
      console.error('[themes] auto unlock failed', error);
      return null;
    }
  }, [gameState.currentLevel, unlockMap, unlockTheme]);

  const unlockedThemeIds = useMemo(() => Object.keys(unlockMap).filter((id) => Boolean(unlockMap[id as ThemeId])) as ThemeId[], [unlockMap]);
  const unlockedThemes = useMemo(() => THEMES.filter((theme) => unlockedThemeIds.includes(theme.id)), [unlockedThemeIds]);

  return {
    themes: THEMES,
    themeMap: THEME_MAP,
    activeTheme,
    unlockedThemeIds,
    unlockedThemes,
    unlockMap,
    loading,
    setActiveTheme,
    unlockTheme,
    maybeAutoUnlockByLevel,
    isUnlocked: (themeId: ThemeId) => Boolean(unlockMap[themeId]),
  };
};
