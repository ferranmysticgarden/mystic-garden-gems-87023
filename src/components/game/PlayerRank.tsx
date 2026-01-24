import { Crown, Leaf, Flower, Sparkles } from 'lucide-react';

interface PlayerRankProps {
  levelsCompleted: number;
}

const RANKS = [
  { min: 0, max: 9, name: 'Novato', emoji: '🌱', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { min: 10, max: 24, name: 'Aprendiz', emoji: '🌿', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  { min: 25, max: 39, name: 'Jardinero', emoji: '🌻', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { min: 40, max: 59, name: 'Maestro', emoji: '🌸', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  { min: 60, max: 79, name: 'Sabio', emoji: '🌺', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { min: 80, max: 99, name: 'Gran Maestro', emoji: '💐', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { min: 100, max: Infinity, name: 'Leyenda', emoji: '👑', color: 'text-yellow-300', bgColor: 'bg-yellow-400/30' }
];

export const PlayerRank = ({ levelsCompleted }: PlayerRankProps) => {
  const currentRank = RANKS.find(r => levelsCompleted >= r.min && levelsCompleted <= r.max) || RANKS[0];
  const nextRank = RANKS.find(r => r.min > levelsCompleted);
  
  const progressToNextRank = nextRank 
    ? ((levelsCompleted - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100;

  return (
    <div className={`${currentRank.bgColor} rounded-xl p-3 border border-white/10`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentRank.emoji}</span>
          <div>
            <p className={`font-bold ${currentRank.color}`}>{currentRank.name}</p>
            <p className="text-xs text-white/60">{levelsCompleted} niveles completados</p>
          </div>
        </div>
        
        {nextRank && (
          <div className="text-right">
            <p className="text-xs text-white/40">Próximo:</p>
            <p className="text-sm text-white/60">{nextRank.emoji} {nextRank.name}</p>
          </div>
        )}
      </div>
      
      {/* Progress bar to next rank */}
      {nextRank && (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${currentRank.bgColor.replace('/20', '')} transition-all duration-500`}
            style={{ width: `${progressToNextRank}%` }}
          />
        </div>
      )}
      
      {!nextRank && (
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-bold">¡Rango máximo alcanzado!</span>
          <Sparkles className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
