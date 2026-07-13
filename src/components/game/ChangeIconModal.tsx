import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useTileSkin } from '@/hooks/useTileSkin';
import { useUserThemes } from '@/hooks/useUserThemes';
import { THEME_TILE_MAP } from '@/data/themes';
import { TILE_TYPES, TILE_DEFAULT_EMOJIS, type TileType } from '@/constants/tileTypes';

interface Props {
  open: boolean;
  onPick: (tileType: TileType) => void;
  onCancel: () => void;
}

/**
 * Modal del power-up "Cambio": muestra los 6 iconos del tema activo en grid 3x2.
 * El usuario elige uno y la ficha seleccionada del tablero se transforma en ese icono.
 * Cerrar con X = cancela sin gastar gemas.
 */
export const ChangeIconModal = ({ open, onPick, onCancel }: Props) => {
  const { t } = useLanguage();
  const tileSkins = useTileSkin();
  const { activeTheme } = useUserThemes();
  const themeAssets = THEME_TILE_MAP[activeTheme] ?? {};

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <div className="text-center text-5xl mb-1">🔄</div>
          <DialogTitle className="text-center text-lg">
            {t('powerup.change.pick_icon') || 'Elige un icono'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-3">
          {TILE_TYPES.map((id) => {
            const photo = tileSkins[id];
            const themeAsset = themeAssets[id];
            return (
              <button
                key={id}
                onClick={() => onPick(id as TileType)}
                className="aspect-square rounded-xl bg-muted/60 border-2 border-white/10 hover:border-primary hover:bg-primary/20 active:scale-90 transition-all flex items-center justify-center overflow-hidden"
                aria-label={`Cambiar a ${id}`}
              >
                {photo ? (
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                ) : typeof themeAsset === 'string' && themeAsset.startsWith('/') ? (
                  <img src={themeAsset} alt="" className="w-4/5 h-4/5 object-contain" />
                ) : (
                  <span className="text-4xl">{themeAsset ?? TILE_DEFAULT_EMOJIS[id]}</span>
                )}
              </button>
            );
          })}
        </div>
        <Button variant="outline" onClick={onCancel} className="w-full mt-1">
          {t('powerup.intro.cancel') || 'Cancelar'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
