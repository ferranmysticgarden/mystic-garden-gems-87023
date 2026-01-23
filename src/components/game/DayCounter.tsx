import { Sparkles } from 'lucide-react';

interface DayCounterProps {
  currentStreak: number;
}

export const DayCounter = ({ currentStreak }: DayCounterProps) => {
  if (currentStreak < 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full px-4 py-2 border border-emerald-400/30 mb-4">
      <Sparkles className="w-4 h-4 text-emerald-400" />
      <span className="text-emerald-300 font-semibold text-sm">
        Día {currentStreak} en Mystic Garden
      </span>
      <span className="text-lg">🌱</span>
    </div>
  );
};
