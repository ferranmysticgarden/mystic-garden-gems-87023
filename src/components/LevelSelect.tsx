import { Lock, Star } from 'lucide-react';
import { LEVELS } from '@/data/levels';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from './ui/button';

interface LevelSelectProps {
  unlockedLevels: number;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export const LevelSelect = ({ unlockedLevels, onSelectLevel, onBack }: LevelSelectProps) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen p-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="outline" className="mb-6">
          ← {t('menu.levels')}
        </Button>
        
        <h2 className="text-3xl font-bold text-center mb-8 text-gold">
          {t('menu.levels')}
        </h2>
        
        <div className="grid grid-cols-5 gap-4">
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= unlockedLevels;
            
            return (
              <button
                key={level.id}
                onClick={() => isUnlocked && onSelectLevel(level.id)}
                disabled={!isUnlocked}
                className={`
                  gradient-card shadow-card rounded-xl p-4 aspect-square
                  flex flex-col items-center justify-center gap-2
                  transition-all duration-300
                  ${isUnlocked 
                    ? 'hover:scale-110 hover:shadow-gold cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-2xl font-bold text-gold">{level.id}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className="w-3 h-3 text-accent fill-accent"
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
