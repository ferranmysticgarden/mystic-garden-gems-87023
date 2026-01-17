import { Flame, ChevronRight } from 'lucide-react';
import { useDailyStreak } from '@/hooks/useDailyStreak';

interface StreakReminderBannerProps {
  onClick: () => void;
}

export const StreakReminderBanner = ({ onClick }: StreakReminderBannerProps) => {
  const { streakData } = useDailyStreak();

  // Only show if user can claim today and has a streak to protect
  if (!streakData.canClaimToday) return null;

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-orange-500/90 via-red-500/90 to-pink-500/90 rounded-xl p-3 mb-3 flex items-center justify-between group hover:from-orange-600/90 hover:via-red-600/90 hover:to-pink-600/90 transition-all border border-yellow-400/50 shadow-lg shadow-orange-500/20 animate-pulse"
    >
      <div className="flex items-center gap-3">
        <div className="bg-yellow-400/20 rounded-full p-2">
          <Flame className="w-6 h-6 text-yellow-300" />
        </div>
        <div className="text-left">
          <p className="text-white font-bold text-sm">
            🔥 ¡Reclama tu Racha! Día {streakData.currentStreak || 1}
          </p>
          <p className="text-yellow-100/80 text-xs">
            {streakData.todayReward.description}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
    </button>
  );
};
