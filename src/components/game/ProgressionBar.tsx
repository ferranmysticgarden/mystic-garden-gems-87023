import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const ProgressionBar = () => {
  const [progress, setProgress] = useState(0);
  const [nextReward, setNextReward] = useState(10);
  const [completedLevels, setCompletedLevels] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const loadProgress = async () => {
      const { data: gameState } = await supabase
        .from('game_progress')
        .select('completed_levels')
        .eq('user_id', user.id)
        .maybeSingle();

      if (gameState) {
        const completed = gameState.completed_levels?.length || 0;
        const milestone = Math.floor(completed / 10) * 10 + 10;
        const progressPercent = ((completed % 10) / 10) * 100;
        
        setProgress(progressPercent);
        setNextReward(milestone);
        setCompletedLevels(completed);
      }
    };

    loadProgress();
  }, [user?.id]);

  return (
    <div className="bg-gradient-to-r from-purple-800/50 to-indigo-800/50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-sm font-medium">
          Progreso hasta nivel {nextReward}
        </span>
        <span className="text-purple-200 text-sm">
          {completedLevels}/{nextReward}
        </span>
      </div>
      
      <div className="h-3 bg-purple-900/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-purple-300 text-xs mt-2 text-center">
        🎁 Recompensa especial al llegar a nivel {nextReward}
      </p>
    </div>
  );
};
