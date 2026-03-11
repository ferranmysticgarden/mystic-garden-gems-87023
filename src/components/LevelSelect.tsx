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
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= unlockedLevels;
            
            return (
              <button
                key={level.id}
                onClick={() => isUnlocked && onSelectLevel(level.id)}
                disabled={!isUnlocked}
                className={`
                  gradient-card shadow-card rounded-xl p-3
                  flex flex-col items-center justify-center gap-1
                  min-h-[100px]
                  ${isUnlocked 
                    ? 'hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-xl font-bold text-gold">{level.id}</span>
                    
                    {/* OBJETIVO DEL NIVEL - MUY CLARO */}
                    <div className="bg-background/50 rounded-lg px-2 py-1 flex items-center gap-1">
                      {level.objective.type === 'collect' ? (
                        <>
                          <span className="text-2xl">{level.objective.target}</span>
                          <span className="text-xs font-bold text-primary">×{level.objective.count}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">⭐</span>
                          <span className="text-xs font-bold text-primary">{level.objective.count}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className="w-3 h-3 text-accent fill-accent"
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">{level.id}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
