import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { type ThemeDefinition, SURPRISE_THEME_IDS } from '@/data/themes';

interface ThemeUnlockedModalProps {
  theme: ThemeDefinition | null;
  open: boolean;
  onUseNow: () => void;
  onClose: () => void;
}

export const ThemeUnlockedModal = ({ theme, open, onUseNow, onClose }: ThemeUnlockedModalProps) => {
  const { t } = useLanguage();
  if (!open || !theme) return null;

  const isSurprise = SURPRISE_THEME_IDS.includes(theme.id);

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center px-4">
      <div
        className={`w-full max-w-sm p-6 text-center ${isSurprise ? 'border-4 border-yellow-400/70 animate-scale-in' : 'border bg-card'}`}
        style={{
          borderRadius: 12,
          ...(isSurprise
            ? {
                background: 'linear-gradient(160deg, hsl(280 60% 22%), hsl(340 60% 24%))',
                boxShadow: '0 0 50px rgba(255,215,0,0.55), 0 0 100px rgba(255,90,150,0.35)',
              }
            : {}),
        }}
      >
        <div className="text-5xl mb-3">{isSurprise ? '🎉🎁' : '🧚✨'}</div>
        <h2
          className={`text-xl font-extrabold mb-2 ${isSurprise ? 'tracking-wide' : ''}`}
          style={isSurprise ? {
            background: 'linear-gradient(90deg,#FFD700,#FFA500,#FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } : undefined}
        >
          {isSurprise ? t('themes.surprise_title') : t('themes.unlocked_title')}
        </h2>
        <p className={`text-sm mb-4 ${isSurprise ? 'text-yellow-100/90' : 'text-muted-foreground'}`}>
          {t('themes.unlocked_body')} {t(theme.nameKey)}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {theme.iconPaths.slice(0, 6).map((path, idx) => (
            <div key={idx} className="aspect-square border bg-muted/40 p-1" style={{ borderRadius: 6 }}>
              <img src={path} alt="" className="w-full h-full object-contain" loading="lazy" width={1024} height={1024} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose}>{t('themes.later')}</Button>
          <Button onClick={onUseNow}>{t('themes.use_now')}</Button>
        </div>
      </div>
    </div>
  );
};
