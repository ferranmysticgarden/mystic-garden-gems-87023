import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Achievement } from "@/types/achievements";
import { useLanguage } from "@/hooks/useLanguage";

interface AchievementModalProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementModal = ({ achievement, onClose }: AchievementModalProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl animate-scale-in">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-400 rounded-full p-4">
            <Trophy className="w-8 h-8 text-yellow-900" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-4">
          {t('achievements.unlocked')}
        </h2>
        
        <div className="text-6xl text-center mb-4">
          {achievement.icon}
        </div>
        
        <h3 className="text-xl font-semibold text-center text-white mb-2">
          {t(achievement.nameKey)}
        </h3>
        
        <p className="text-center text-purple-200 mb-6">
          {t(achievement.descriptionKey)}
        </p>
        
        <div className="bg-purple-800/50 rounded-xl p-4 mb-6 text-center">
          <span className="text-2xl font-bold text-yellow-400">
            +{achievement.rewardGems} 💎
          </span>
          <p className="text-purple-200 text-sm mt-1">
            {t('achievements.reward')}
          </p>
        </div>
        
        <Button 
          onClick={onClose}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-3 rounded-xl"
        >
          ¡GENIAL! 🎉
        </Button>
      </div>
    </div>
  );
};
