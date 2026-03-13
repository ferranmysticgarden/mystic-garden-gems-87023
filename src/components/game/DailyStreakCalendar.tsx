import { useState, useEffect } from 'react';
import { X, Gift, Flame, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyStreak, DAILY_REWARDS } from '@/hooks/useDailyStreak';
import confetti from 'canvas-confetti';

interface DailyStreakCalendarProps {
  onClose: () => void;
  onRewardClaimed?: (gems: number, lives: number) => void;
}

export const DailyStreakCalendar = ({ onClose, onRewardClaimed }: DailyStreakCalendarProps) => {
  const { streakData, loading, claimDailyReward } = useDailyStreak();
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const handleClaim = async () => {
    if (!streakData.canClaimToday || claiming) return;
    
    setClaiming(true);
    const reward = await claimDailyReward();
    
    if (reward) {
      setJustClaimed(true);
      
      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      });

      if (onRewardClaimed) {
        onRewardClaimed(reward.gems, reward.lives);
      }
    }
    
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="animate-spin text-4xl">🔥</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="bg-gradient-to-b from-orange-900 via-red-900 to-purple-900 rounded-3xl p-6 max-w-md w-full border-4 border-orange-400 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-400 animate-pulse" />
            <h2 className="text-2xl font-bold text-orange-400">Racha Diaria</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Streak Display */}
        <div className="bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-2xl p-4 mb-4 text-center border border-orange-400/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="w-10 h-10 text-orange-400" />
            <span className="text-5xl font-bold text-white">{streakData.currentStreak}</span>
            <Flame className="w-10 h-10 text-orange-400" />
          </div>
          <p className="text-orange-200 text-sm">días consecutivos</p>
          <p className="text-orange-300/70 text-xs mt-1">Récord: {streakData.maxStreak} días</p>
        </div>

        {/* Reward Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAILY_REWARDS.map((reward, index) => {
            const dayNumber = index + 1;
            const isCompleted = streakData.currentStreak > dayNumber || 
              (streakData.currentStreak === dayNumber && !streakData.canClaimToday);
            const isToday = streakData.currentStreak === dayNumber && streakData.canClaimToday;
            const isFuture = streakData.currentStreak < dayNumber;
            
            return (
              <div
                key={dayNumber}
                className={`
                  relative rounded-xl p-2 text-center transition-all
                  ${isToday ? 'bg-gradient-to-b from-orange-400 to-red-500 scale-110 shadow-lg shadow-orange-500/50 border-2 border-yellow-300' : ''}
                  ${isCompleted ? 'bg-green-600/40 border border-green-400/50' : ''}
                  ${isFuture ? 'bg-gray-700/40 border border-gray-600/30' : ''}
                `}
              >
                <p className={`text-xs font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                  D{dayNumber}
                </p>
                
                <div className="text-xl my-1">
                  {isCompleted && <Check className="w-5 h-5 mx-auto text-green-400" />}
                  {isToday && <Gift className="w-5 h-5 mx-auto text-yellow-300 animate-bounce" />}
                  {isFuture && <Lock className="w-4 h-4 mx-auto text-gray-500" />}
                </div>
                
                <p className={`text-xs ${isToday ? 'text-yellow-100 font-bold' : 'text-gray-400'}`}>
                  {reward.gems}💎
                </p>
              </div>
            );
          })}
        </div>

        {/* Today's Reward Details */}
        <div className="bg-black/30 rounded-xl p-4 mb-4">
          <h3 className="text-center text-orange-300 font-semibold mb-2">
            {streakData.canClaimToday ? '🎁 Recompensa de Hoy' : '✅ Ya Reclamado Hoy'}
          </h3>
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg p-3 text-center border border-orange-400/30">
            <p className="text-2xl text-white font-bold">{streakData.todayReward.description}</p>
            <p className="text-orange-200/70 text-sm mt-1">
              Día {((streakData.currentStreak - 1) % 7) + 1} de 7
            </p>
          </div>
        </div>

        {/* Claim Button */}
        {streakData.canClaimToday && !justClaimed && (
          <Button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-6 text-xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 border-2 border-yellow-400 shadow-lg shadow-orange-500/30"
          >
            {claiming ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🎁</span> Reclamando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Gift className="w-6 h-6" /> ¡Reclamar Recompensa!
              </span>
            )}
          </Button>
        )}

        {justClaimed && (
          <div className="text-center py-4">
            <p className="text-2xl text-green-400 font-bold animate-pulse">
              🎉 ¡Recompensa Reclamada! 🎉
            </p>
            <p className="text-green-300/70 text-sm mt-2">
              Vuelve mañana para continuar tu racha
            </p>
          </div>
        )}

        {!streakData.canClaimToday && !justClaimed && (
          <div className="text-center py-4">
            <p className="text-orange-300/80">
              ⏰ Vuelve mañana para tu próxima recompensa
            </p>
          </div>
        )}

        {/* Warning Message */}
        <p className="text-center text-orange-300/60 text-xs mt-4">
          ⚠️ ¡No pierdas tu racha! Si no juegas un día, empezarás desde el día 1
        </p>
      </div>
    </div>
  );
};
