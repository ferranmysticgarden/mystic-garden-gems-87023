import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { type ThemeDefinition } from '@/data/themes';

interface ThemeUnlockedModalProps {
  theme: ThemeDefinition | null;
  open: boolean;
  onUseNow: () => void;
  onClose: () => void;
}

export const ThemeUnlockedModal = ({ theme, open, onUseNow, onClose }: ThemeUnlockedModalProps) => {
  const { t } = useLanguage();
  if (!open || !theme) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center px-4">
      <div className="bg-card border w-full max-w-sm p-6 text-center" style={{ borderRadius: 8 }}>
        <div className="text-5xl mb-3">🧚✨</div>
        <h2 className="text-xl font-bold mb-2">{t('themes.unlocked_title')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('themes.unlocked_body')} {t(theme.nameKey)}</p>
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
