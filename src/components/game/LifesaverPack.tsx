import { Heart, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { usePayment } from '@/hooks/usePayment';

interface LifesaverPackProps {
  onBuy: () => void;
  onDismiss: () => void;
}

/**
 * Pack Salvavidas €0.49 - Cuando el usuario se queda sin vidas
 * 1 vida + 3 movimientos extra
 */
export const LifesaverPack = ({ onBuy, onDismiss }: LifesaverPackProps) => {
  const { createPayment, loading, getPrice } = usePayment();
  const { language } = useLanguage();

  const handleBuy = async () => {
    const success = await createPayment('lifesaver_pack');
    if (success) {
      onBuy();
    }
  };

  const price = getPrice('lifesaver_pack', '€0.50');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-red-900 via-pink-900 to-purple-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-red-400 shadow-2xl animate-scale-in">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          {/* Icono corazón roto animado */}
          <div className="text-7xl mb-4 animate-pulse drop-shadow-lg">💔</div>
          
          <h2 className="text-2xl font-bold text-red-300 mb-2 drop-shadow-lg">
            {language === 'es' ? '¡Sin vidas!' : 'No lives!'}
          </h2>
          
          <p className="text-red-200/90 mb-5">
            {language === 'es' 
              ? 'Pero puedes seguir jugando ahora mismo...'
              : 'But you can keep playing right now...'}
          </p>

          {/* Oferta destacada */}
          <div className="bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-2xl p-5 mb-5 border-2 border-red-400/50 shadow-inner">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="w-8 h-8 text-red-400 fill-red-400 drop-shadow-lg" />
              <span className="text-2xl font-bold text-white">
                {language === 'es' ? 'Pack Salvavidas' : 'Lifesaver Pack'}
              </span>
            </div>
            
            {/* Lo que incluye */}
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-4xl mb-1">❤️</div>
                <p className="text-sm font-semibold text-red-200">+1 vida</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-1">🎯</div>
                <p className="text-sm font-semibold text-red-200">+3 movs</p>
              </div>
            </div>
            
            <div className="text-5xl font-black text-white drop-shadow-lg">{price}</div>
            <p className="text-green-400 font-semibold mt-1">
              {language === 'es' ? '¡Sigue jugando ya!' : 'Keep playing now!'}
            </p>
          </div>

          <PremiumButton 
            onClick={handleBuy}
            loading={loading}
            variant="red"
            size="lg"
            className="mb-4"
          >
            <Heart className="w-6 h-6 fill-current" />
            {language === 'es' ? '¡REVIVIR AHORA!' : 'REVIVE NOW!'}
          </PremiumButton>

          <button 
            onClick={onDismiss}
            className="w-full text-white/40 hover:text-white/70 text-sm py-2 transition-colors"
          >
            {language === 'es' ? 'Esperar regeneración' : 'Wait for regeneration'}
          </button>
          
          <p className="text-red-300/40 text-xs mt-2">
            {language === 'es' ? '⏰ Próxima vida en ~35 min' : '⏰ Next life in ~35 min'}
          </p>
        </div>
      </div>
    </div>
  );
};
