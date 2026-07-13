import { Lock, Check, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { type ThemeDefinition, SURPRISE_THEME_IDS } from '@/data/themes';

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

export const ThemeCard = ({ theme, unlocked, active, loading, onApply, onLockedClick }: ThemeCardProps) => {
  const { t } = useLanguage();
  const isSurprise = SURPRISE_THEME_IDS.includes(theme.id);
  const hideIcons = !unlocked && isSurprise;

  return (
    <div className={`border p-3 bg-card ${active ? 'ring-2 ring-primary' : ''}`} style={{ borderRadius: 8 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{hideIcons ? '❓' : theme.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {hideIcons ? t('themes.surprise_hidden') : t(theme.nameKey)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {unlocked
                ? t('themes.available_now')
                : theme.unlockLevel
                  ? `${t('themes.unlock_at_level')} ${theme.unlockLevel}`
                  : t('themes.locked')}
            </p>
          </div>
        </div>
        {active ? <Check className="w-4 h-4 text-primary" /> : !unlocked ? <Lock className="w-4 h-4 text-muted-foreground" /> : null}
      </div>

      <button onClick={unlocked ? onApply : onLockedClick} className="grid grid-cols-3 gap-1 mb-3 w-full" aria-label={hideIcons ? t('themes.surprise_hidden') : t(theme.nameKey)}>
        {hideIcons
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-square border bg-muted/40 flex items-center justify-center" style={{ borderRadius: 6 }}>
                <HelpCircle className="w-8 h-8 text-muted-foreground/60" />
              </div>
            ))
          : (theme.iconPaths.length ? theme.iconPaths : ['🌸','🌺','🌼','🍃','🌻','🌷']).map((asset, index) => (
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
      ) : (
        <Button variant="outline" className="w-full" onClick={onLockedClick} disabled>
          <Lock className="w-3 h-3 mr-1" />
          {theme.unlockLevel
            ? `${t('themes.unlock_at_level')} ${theme.unlockLevel}`
            : t('themes.locked')}
        </Button>
      )}
    </div>
  );
};
