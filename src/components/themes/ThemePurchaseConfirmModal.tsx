import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { type ThemeDefinition } from '@/data/themes';

interface ThemePurchaseConfirmModalProps {
  theme: ThemeDefinition | null;
  open: boolean;
  mode: 'gems' | 'purchase';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ThemePurchaseConfirmModal = ({ theme, open, mode, onConfirm, onCancel }: ThemePurchaseConfirmModalProps) => {
  const { t } = useLanguage();
  if (!open || !theme) return null;

  const priceText = mode === 'gems' ? `${theme.gemPrice} 💎` : `€${theme.eurPrice?.toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-[85] bg-black/70 flex items-center justify-center px-4">
      <div className="bg-card border w-full max-w-sm p-6" style={{ borderRadius: 8 }}>
        <h2 className="text-lg font-bold mb-2">{t('themes.confirm_title')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('themes.confirm_body', { theme: t(theme.nameKey), price: priceText })}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onCancel}>{t('themes.cancel')}</Button>
          <Button onClick={onConfirm}>{t('themes.confirm')}</Button>
        </div>
      </div>
    </div>
  );
};
