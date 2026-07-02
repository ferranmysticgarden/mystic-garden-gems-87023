import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { POWERUP_COST, POWERUP_EMOJI, type PowerupType } from '@/utils/powerupTutorial';

interface Props {
  open: boolean;
  type: PowerupType;
  /** Si true → modal en modo "confirmación de gasto" (coste destacado, texto breve).
   *  Si false → modal en modo "primera vez" (educativo). */
  mode: 'intro' | 'confirm';
  /** true si el uso va a gastar gemas; false si es gratis (stock/win-streak). */
  willSpendGems: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PowerupIntroModal = ({ open, type, mode, willSpendGems, onConfirm, onCancel }: Props) => {
  const { t } = useLanguage();
  const cost = POWERUP_COST[type];
  const emoji = POWERUP_EMOJI[type];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="text-center text-6xl mb-2">{emoji}</div>
          <DialogTitle className="text-center text-xl">
            {t(`powerup.intro.${type}.title`)}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {t(`powerup.intro.${type}.desc`)}
          </DialogDescription>
        </DialogHeader>

        {willSpendGems && (
          <div className="flex items-center justify-center gap-2 py-3 my-2 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">{t('powerup.intro.cost')}</span>
            <Gem className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-primary">{cost}</span>
          </div>
        )}

        {!willSpendGems && (
          <div className="text-center py-2 text-sm font-semibold text-emerald-500">
            {t('powerup.intro.free')}
          </div>
        )}

        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={onCancel}>
            {t('powerup.intro.cancel')}
          </Button>
          <Button onClick={onConfirm}>
            {mode === 'confirm' ? t('powerup.intro.confirm') : t('powerup.intro.use_now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
