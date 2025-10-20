import { Tv, Gem } from 'lucide-react';
import { Button } from './ui/button';

interface NoLivesModalProps {
  gems: number;
  hasAdsDisabled: boolean;
  onWatchAd: () => void;
  onUseGems: () => void;
  onClose: () => void;
}

export const NoLivesModal = ({ gems, hasAdsDisabled, onWatchAd, onUseGems, onClose }: NoLivesModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="gradient-card shadow-card rounded-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-bold text-gold mb-2">Sin Vidas</h2>
          <p className="text-muted-foreground">Elige una opción para continuar jugando</p>
        </div>

        <div className="space-y-3">
          {!hasAdsDisabled && (
            <Button
              onClick={onWatchAd}
              className="w-full gradient-gold shadow-gold text-lg py-6"
              id="watch-ad-for-life"
            >
              <Tv className="w-6 h-6 mr-2" />
              Ver Anuncio (+1 Vida)
            </Button>
          )}

          <Button
            onClick={onUseGems}
            disabled={gems < 5}
            variant="outline"
            className="w-full text-lg py-6"
            id="use-gems-for-life"
          >
            <Gem className="w-6 h-6 mr-2" />
            Usar 5 Gemas {gems < 5 && '(No tienes suficientes)'}
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};
