import { Lock, Gem, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { type ThemeDefinition } from '@/data/themes';

interface ThemeCardProps {
  theme: ThemeDefinition;
  unlocked: boolean;
  active: boolean;
  loading?: boolean;
  onApply: () => void;
  onUnlockWithGems?: () => void;
  onUnlockWithPurchase?: () => void;
  onLockedClick?: () => void;
}

export const ThemeCard = ({ theme, unlocked, active, loading, onApply, onUnlockWithGems, onUnlockWithPurchase, onLockedClick }: ThemeCardProps) => {
  const { t } = useLanguage();

  return (
    <div className={`border p-3 bg-card ${active ? 'ring-2 ring-primary' : ''}`} style={{ borderRadius: 8 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{theme.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{t(theme.nameKey)}</p>
            <p className="text-[11px] text-muted-foreground">
              {theme.tier === 'premium' ? t('themes.premium') : theme.unlockLevel ? `${t('themes.unlock_at_level')} ${theme.unlockLevel}` : t('themes.available_now')}

            </p>
          </div>
        </div>
        {active ? <Check className="w-4 h-4 text-primary" /> : !unlocked ? <Lock className="w-4 h-4 text-muted-foreground" /> : null}
      </div>

      <button onClick={unlocked ? onApply : onLockedClick} className="grid grid-cols-3 gap-1 mb-3 w-full" aria-label={t(theme.nameKey)}>
        {(theme.iconPaths.length ? theme.iconPaths : ['🌸','🌺','🌼','🍃','🌻','🌷']).map((asset, index) => (
          <div key={index} className="aspect-square border bg-muted/40 flex items-center justify-center overflow-hidden" style={{ borderRadius: 6 }}>
            {asset.startsWith('/') ? (
              <img src={asset} alt="" className="w-full h-full object-contain p-1" loading="lazy" width={1024} height={1024} />
            ) : (
              <span className="text-2xl">{asset}</span>
            )}
          </div>
        ))}
      </button>

      {unlocked ? (
        <Button className="w-full" onClick={onApply} disabled={loading}>
          {active ? t('themes.active') : t('themes.use_now')}
        </Button>
      ) : theme.tier === 'premium' ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onUnlockWithGems} disabled={loading} className="text-xs px-2">
            <Gem className="w-3 h-3 mr-1" /> {theme.gemPrice}
          </Button>
          <Button onClick={onUnlockWithPurchase} disabled={loading} className="text-xs px-2">
            <Crown className="w-3 h-3 mr-1" /> €{theme.eurPrice?.toFixed(2)}
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={onLockedClick} disabled={loading}>
          {t('themes.locked')}
        </Button>
      )}
    </div>
  );
};
