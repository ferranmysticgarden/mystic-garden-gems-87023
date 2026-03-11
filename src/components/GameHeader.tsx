import { Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface GameHeaderProps {
  lives: number;
  gems: number;
  hasUnlimitedLives: boolean;
  timeUntilNextLife: number;
  onShopClick: () => void;
}

export const GameHeader = ({ lives, gems, hasUnlimitedLives, timeUntilNextLife, onShopClick }: GameHeaderProps) => {
  const { t } = useLanguage();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="gradient-card shadow-card rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* Lives - MÁS VISUAL */}
        <div className="flex items-center gap-2 bg-destructive/20 rounded-xl px-4 py-3 border border-destructive/30">
          <div className="flex items-center gap-1">
            {hasUnlimitedLives ? (
              <>
                <Heart className="w-6 h-6 text-destructive fill-destructive animate-pulse" />
                <span className="text-2xl font-bold text-destructive">∞</span>
              </>
            ) : (
              <>
                {/* Mostrar corazones visuales */}
                {[...Array(5)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-5 h-5 transition-all ${
                      i < lives 
                        ? 'text-destructive fill-destructive' 
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </>
            )}
          </div>
          {!hasUnlimitedLives && lives < 5 && timeUntilNextLife > 0 && (
            <div className="flex flex-col ml-2 border-l border-destructive/30 pl-2">
              <span className="text-xs text-muted-foreground">+1</span>
              <span className="text-sm font-bold text-destructive">
                {formatTime(timeUntilNextLife)}
              </span>
            </div>
          )}
        </div>

        {/* Gems */}
        <button
          onClick={onShopClick}
          className="flex items-center gap-2 gradient-gold shadow-gold rounded-xl px-4 py-3 hover:scale-105 transition-transform border border-accent/30"
          aria-label="Abrir tienda"
          title="Abrir tienda"
        >

      </div>
    </header>
  );
};
