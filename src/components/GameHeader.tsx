import { Heart, Gem, Leaf } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface GameHeaderProps {
  lives: number;
  gems: number;
  leaves: number;
  hasUnlimitedLives: boolean;
  timeUntilNextLife: number;
  onShopClick: () => void;
}

export const GameHeader = ({ lives, gems, leaves, hasUnlimitedLives, timeUntilNextLife, onShopClick }: GameHeaderProps) => {
  const { t } = useLanguage();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="gradient-card shadow-card rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* Lives */}
        <div className="flex items-center gap-2 bg-destructive/20 rounded-xl px-4 py-2">
          <Heart className="w-5 h-5 text-destructive fill-destructive" />
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              {hasUnlimitedLives ? '∞' : lives}
            </span>
            {!hasUnlimitedLives && lives < 5 && timeUntilNextLife > 0 && (
              <span className="text-xs text-muted-foreground">
                {formatTime(timeUntilNextLife)}
              </span>
            )}
          </div>
        </div>

        {/* Gems */}
        <button
          onClick={onShopClick}
          className="flex items-center gap-2 gradient-gold shadow-gold rounded-xl px-4 py-2 hover:scale-105 transition-transform"
        >
          <Gem className="w-5 h-5 text-accent-foreground" />
          <span className="text-lg font-bold text-accent-foreground">{gems}</span>
        </button>

        {/* Leaves */}
        <div className="flex items-center gap-2 bg-secondary/20 rounded-xl px-4 py-2">
          <Leaf className="w-5 h-5 text-secondary" />
          <span className="text-lg font-bold">{leaves}</span>
        </div>
      </div>
    </header>
  );
};
