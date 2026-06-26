import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface StreakData {
  currentStreak: number;
  maxStreak: number;
  lastLoginDate: string | null;
  canClaimToday: boolean;
  todayReward: DailyReward;
}

export interface DailyReward {
  day: number;
  gems: number;
  lives: number;
  noAdsMinutes: number;
  description: string;
}

// Escalating rewards for 7 days - resets after Day 7
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gems: 10, lives: 1, noAdsMinutes: 0, description: '10 💎 + 1 ❤️' },
  { day: 2, gems: 20, lives: 2, noAdsMinutes: 0, description: '20 💎 + 2 ❤️' },
  { day: 3, gems: 30, lives: 2, noAdsMinutes: 30, description: '30 💎 + 2 ❤️ + 30min sin ads' },
  { day: 4, gems: 40, lives: 3, noAdsMinutes: 0, description: '40 💎 + 3 ❤️' },
  { day: 5, gems: 50, lives: 3, noAdsMinutes: 60, description: '50 💎 + 3 ❤️ + 1h sin ads' },
  { day: 6, gems: 75, lives: 4, noAdsMinutes: 0, description: '75 💎 + 4 ❤️' },
  { day: 7, gems: 100, lives: 5, noAdsMinutes: 60, description: '🔥 100 💎 + 5 ❤️ + 1h sin ads' },
];

export const useDailyStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    maxStreak: 0,
    lastLoginDate: null,
    canClaimToday: false,
    todayReward: DAILY_REWARDS[0],
  });
  const [loading, setLoading] = useState(true);

  const getRewardForDay = (streak: number): DailyReward => {
    const dayIndex = ((streak - 1) % 7);
    return DAILY_REWARDS[dayIndex >= 0 ? dayIndex : 0];
  };

  const checkStreak = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_progress')
        .select('current_streak, max_streak, last_login_date, streak_claimed_today')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let currentStreak = data?.current_streak || 0;
      let canClaimToday = false;
      const lastLoginDate = data?.last_login_date;
      const streakClaimedToday = data?.streak_claimed_today || false;

      if (lastLoginDate === today) {
        // Already logged in today - check if reward was claimed
        canClaimToday = !streakClaimedToday;
      } else if (lastLoginDate === yesterday) {
        // Consecutive day - streak continues, can claim
        canClaimToday = true;
        currentStreak += 1;
      } else if (!lastLoginDate) {
        // First time user
        canClaimToday = true;
        currentStreak = 1;
      } else {
        // Streak broken - reset but can start new streak
        canClaimToday = true;
        currentStreak = 1;
      }

      const todayReward = getRewardForDay(currentStreak > 0 ? currentStreak : 1);

      setStreakData({
        currentStreak: currentStreak > 0 ? currentStreak : (canClaimToday ? 1 : 0),
        maxStreak: Math.max(data?.max_streak || 0, currentStreak),
        lastLoginDate,
        canClaimToday,
        todayReward,
      });
    } catch (error) {
      console.error('Error checking streak:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const claimDailyReward = useCallback(async (): Promise<DailyReward | null> => {
    if (!user?.id || !streakData.canClaimToday) return null;

    try {
      // BUGFIX: el UPDATE directo a no_ads_until era bloqueado por
      // guard_game_progress_client_updates (días 3, 5, 7). Movemos
      // toda la lógica a la edge function con service-role.
      const { data, error } = await supabase.functions.invoke('claim-daily-streak', {
        body: {},
      });

      if (error) throw error;
      if (!data?.success) {
        console.error('Error claiming daily reward:', data?.error || 'unknown');
        return null;
      }

      const reward = data.reward as DailyReward;
      const today = new Date().toISOString().split('T')[0];

      setStreakData(prev => ({
        ...prev,
        canClaimToday: false,
        currentStreak: data.currentStreak ?? prev.currentStreak,
        maxStreak: data.maxStreak ?? prev.maxStreak,
        lastLoginDate: today,
      }));

      return reward;
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return null;
    }
  }, [user?.id, streakData.canClaimToday]);

  return {
    streakData,
    loading,
    claimDailyReward,
    refreshStreak: checkStreak,
    getRewardForDay,
    DAILY_REWARDS,
  };
};
