import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ACHIEVEMENTS, Achievement } from '@/types/achievements';

export const useAchievements = (userId: string | undefined) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadAchievements = async () => {
      try {
        const { data } = await supabase
          .from('achievements')
          .select('achievement_id')
          .eq('user_id', userId);

        if (data) {
          setUnlockedAchievements(data.map(a => a.achievement_id));
        }
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [userId]);

  const checkAndUnlockAchievement = useCallback(async (
    achievementId: string,
    currentValue: number
  ): Promise<boolean> => {
    if (!userId) return false;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return false;
    if (unlockedAchievements.includes(achievementId)) return false;
    if (currentValue < achievement.requirement) return false;

    try {
      await supabase
        .from('achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString()
        });

      const { data: gameState } = await supabase
        .from('game_progress')
        .select('gems')
        .eq('user_id', userId)
        .maybeSingle();

      if (gameState) {
        await supabase
          .from('game_progress')
          .update({
            gems: (gameState.gems || 0) + achievement.rewardGems
          })
          .eq('user_id', userId);
      }

      setUnlockedAchievements(prev => [...prev, achievementId]);
      setNewlyUnlocked(achievement);

      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }, [userId, unlockedAchievements]);

  const checkLevelAchievements = useCallback(async (levelsCompleted: number) => {
    await checkAndUnlockAchievement('first_win', levelsCompleted);
    await checkAndUnlockAchievement('level_10', levelsCompleted);
    await checkAndUnlockAchievement('level_25', levelsCompleted);
    await checkAndUnlockAchievement('level_50', levelsCompleted);
  }, [checkAndUnlockAchievement]);

  const checkStreakAchievements = useCallback(async (streak: number) => {
    await checkAndUnlockAchievement('streak_3', streak);
    await checkAndUnlockAchievement('streak_7', streak);
    await checkAndUnlockAchievement('streak_14', streak);
  }, [checkAndUnlockAchievement]);

  const checkGemsAchievements = useCallback(async (totalGems: number) => {
    await checkAndUnlockAchievement('gems_100', totalGems);
    await checkAndUnlockAchievement('gems_500', totalGems);
  }, [checkAndUnlockAchievement]);

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked(null);
  }, []);

  return {
    unlockedAchievements,
    newlyUnlocked,
    loading,
    checkLevelAchievements,
    checkStreakAchievements,
    checkGemsAchievements,
    clearNewlyUnlocked
  };
};
