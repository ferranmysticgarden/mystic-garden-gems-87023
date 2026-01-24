import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Gift, Check, Target, Play, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  icon: React.ReactNode;
}

interface DailyMissionsProps {
  onClose: () => void;
  onClaimReward: (gems: number) => void;
  levelsCompleted: number;
  powerupsUsed: number;
  adsWatched: number;
}

export const DailyMissions = ({ 
  onClose, 
  onClaimReward, 
  levelsCompleted, 
  powerupsUsed, 
  adsWatched 
}: DailyMissionsProps) => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [mysteryChestClaimed, setMysteryChestClaimed] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(`daily-missions-${user?.id}`);
    const today = new Date().toDateString();
    
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (parsed.date === today) {
        // Update progress for today's missions
        const updatedMissions = parsed.missions.map((m: Mission) => ({
          ...m,
          current: m.id === 'levels' ? levelsCompleted : 
                   m.id === 'powerups' ? powerupsUsed : 
                   m.id === 'ads' ? adsWatched : m.current,
          completed: (m.id === 'levels' ? levelsCompleted : 
                      m.id === 'powerups' ? powerupsUsed : 
                      m.id === 'ads' ? adsWatched : m.current) >= m.target
        }));
        setMissions(updatedMissions);
        setMysteryChestClaimed(parsed.mysteryChestClaimed || false);
        return;
      }
    }

    // New day, reset missions
    const newMissions: Mission[] = [
      {
        id: 'levels',
        title: 'Maestro de Niveles',
        description: 'Completa 2 niveles',
        reward: 10,
        target: 2,
        current: levelsCompleted,
        completed: levelsCompleted >= 2,
        claimed: false,
        icon: <Target className="w-5 h-5" />
      },
      {
        id: 'powerups',
        title: 'Poder Mágico',
        description: 'Usa un power-up',
        reward: 5,
        target: 1,
        current: powerupsUsed,
        completed: powerupsUsed >= 1,
        claimed: false,
        icon: <Zap className="w-5 h-5" />
      },
      {
        id: 'ads',
        title: 'Apoyo al Jardín',
        description: 'Ve un anuncio',
        reward: 10,
        target: 1,
        current: adsWatched,
        completed: adsWatched >= 1,
        claimed: false,
        icon: <Play className="w-5 h-5" />
      }
    ];

    setMissions(newMissions);
    setMysteryChestClaimed(false);
    
    localStorage.setItem(`daily-missions-${user?.id}`, JSON.stringify({
      date: today,
      missions: newMissions,
      mysteryChestClaimed: false
    }));
  }, [user?.id, levelsCompleted, powerupsUsed, adsWatched]);

  const handleClaimMission = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return;

    const updatedMissions = missions.map(m => 
      m.id === missionId ? { ...m, claimed: true } : m
    );
    setMissions(updatedMissions);
    onClaimReward(mission.reward);

    localStorage.setItem(`daily-missions-${user?.id}`, JSON.stringify({
      date: new Date().toDateString(),
      missions: updatedMissions,
      mysteryChestClaimed
    }));
  };

  const allMissionsClaimed = missions.every(m => m.claimed);
  const canClaimChest = allMissionsClaimed && !mysteryChestClaimed;

  const handleClaimChest = () => {
    if (!canClaimChest) return;
    
    const chestReward = 25 + Math.floor(Math.random() * 26); // 25-50 gems
    onClaimReward(chestReward);
    setMysteryChestClaimed(true);

    localStorage.setItem(`daily-missions-${user?.id}`, JSON.stringify({
      date: new Date().toDateString(),
      missions,
      mysteryChestClaimed: true
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-6 max-w-sm w-full border-4 border-blue-400 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📋</div>
          <h2 className="text-2xl font-bold text-blue-300">MISIONES DIARIAS</h2>
          <p className="text-blue-200/70 text-sm">Completa las 3 para un cofre sorpresa</p>
        </div>

        <div className="space-y-3 mb-6">
          {missions.map((mission) => (
            <div 
              key={mission.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                mission.claimed 
                  ? 'bg-green-500/20 border-green-500/50' 
                  : mission.completed 
                    ? 'bg-yellow-500/20 border-yellow-500/50 animate-pulse' 
                    : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    mission.claimed ? 'bg-green-500' : 'bg-blue-500/30'
                  }`}>
                    {mission.claimed ? <Check className="w-5 h-5 text-white" /> : mission.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{mission.title}</p>
                    <p className="text-sm text-white/60">{mission.description}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {mission.claimed ? (
                    <span className="text-green-400 font-bold">✓</span>
                  ) : mission.completed ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaimMission(mission.id)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      +{mission.reward}💎
                    </Button>
                  ) : (
                    <span className="text-white/60 text-sm">
                      {mission.current}/{mission.target}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              {!mission.claimed && (
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      mission.completed ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}
                    style={{ width: `${Math.min(100, (mission.current / mission.target) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mystery Chest */}
        <div className={`p-4 rounded-xl border-2 text-center ${
          mysteryChestClaimed 
            ? 'bg-gray-500/20 border-gray-500/30' 
            : canClaimChest 
              ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-400 animate-pulse' 
              : 'bg-white/5 border-white/10'
        }`}>
          <div className="text-3xl mb-2">
            {mysteryChestClaimed ? '📦' : '🎁'}
          </div>
          <p className="font-bold text-white mb-2">
            {mysteryChestClaimed ? 'Cofre Reclamado' : 'Cofre Sorpresa'}
          </p>
          
          {mysteryChestClaimed ? (
            <p className="text-green-400 text-sm">¡Vuelve mañana!</p>
          ) : canClaimChest ? (
            <Button
              onClick={handleClaimChest}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold"
            >
              <Gift className="w-4 h-4 mr-2" />
              ¡ABRIR COFRE!
            </Button>
          ) : (
            <p className="text-white/50 text-sm">Completa las 3 misiones</p>
          )}
        </div>
      </div>
    </div>
  );
};
