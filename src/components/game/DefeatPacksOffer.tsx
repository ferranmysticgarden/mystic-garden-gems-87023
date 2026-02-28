import { useState } from 'react';
import { X, Zap, Shield, Crown, Star } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { usePayment } from '@/hooks/usePayment';
import { toast } from 'sonner';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface DefeatPacksOfferProps {
  progressPercent: number;
  onPurchase: () => void;
  onDismiss: () => void;
}

/**
 * DefeatPacksOffer - Modal con 3 packs de monetización multi-tier
 * Se muestra tras perder o quedarse a 1 movimiento
 * Destaca €0.99 como "MEJOR VALOR"
 */
export const DefeatPacksOffer = ({ 
  progressPercent, 
  onPurchase, 
  onDismiss 
}: DefeatPacksOfferProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { createPayment, getPrice } = usePayment();

  const handleBuy = async (productId: string) => {
    setLoading(productId);
    try {
      const success = await createPayment(productId);
      if (success) {
        console.log('[PURCHASE] success confirmed via DefeatPacksOffer');
        dispatchPurchaseCompleted(productId);
        console.log('[PURCHASE] gate unlocked');
        toast.success('¡Compra procesada!');
        onPurchase();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(null);
    }
  };

  // Emotional message based on progress
  const getMessage = () => {
    if (progressPercent >= 90) return "¡Estabas a un paso de la victoria!";
    if (progressPercent >= 70) return "¡Tan cerca de conseguirlo!";
    if (progressPercent >= 50) return "¡No te rindas ahora!";
    if (progressPercent >= 40) return "¡Buen intento! Un poco más y lo consigues";
    return "¡Vuelve más fuerte!";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-md mx-4 w-full">
        {/* Close button */}
        <button 
          onClick={onDismiss}
          className="absolute -top-2 -right-2 z-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 animate-scale-in">
          <div className="text-6xl mb-3">😢</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {getMessage()}
          </h2>
          <p className="text-gray-300">
            Completaste el <span className="text-yellow-400 font-bold">{Math.round(progressPercent)}%</span> del nivel
          </p>
        </div>

        {/* Packs Grid */}
        <div className="space-y-3">
          {/* Pack Impulso €0.99 - RECOMENDADO */}
          <div className="relative bg-gradient-to-r from-yellow-900/80 via-amber-900/80 to-orange-900/80 rounded-2xl p-4 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30">
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              MEJOR VALOR
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-bold text-white">Pack Impulso</span>
                </div>
                <div className="text-sm text-yellow-200 space-y-0.5">
                  <p>✨ +5 movimientos</p>
                  <p>🚀 +3 boosters</p>
                </div>
                <p className="text-xs text-yellow-400 mt-1 font-medium">
                  "La mejor opción"
                </p>
              </div>
              <div className="ml-4">
                <PremiumButton
                  onClick={() => handleBuy('pack_impulso')}
                  loading={loading === 'pack_impulso'}
                  variant="gold"
                  size="md"
                  className="whitespace-nowrap min-w-[100px]"
                >
                  {getPrice('pack_impulso', '€0.99')}
                </PremiumButton>
              </div>
            </div>
          </div>

          {/* Pack Experiencia €1.99 */}
          <div className="bg-gradient-to-r from-purple-900/70 via-violet-900/70 to-indigo-900/70 rounded-2xl p-4 border border-purple-500/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-lg font-bold text-white">Pack Experiencia</span>
                </div>
                <div className="text-sm text-purple-200 space-y-0.5">
                  <p>🛡️ Protección de racha</p>
                  <p>❤️ 2 vidas extra</p>
                  <p>🎰 1 giro ruleta</p>
                </div>
              </div>
              <div className="ml-4">
                <PremiumButton
                  onClick={() => handleBuy('pack_experiencia')}
                  loading={loading === 'pack_experiencia'}
                  variant="purple"
                  size="md"
                  className="whitespace-nowrap min-w-[100px]"
                >
                  {getPrice('pack_experiencia', '€1.99')}
                </PremiumButton>
              </div>
            </div>
          </div>

          {/* Pack Victoria Segura Pro €2.99 */}
          <div className="bg-gradient-to-r from-red-900/70 via-rose-900/70 to-pink-900/70 rounded-2xl p-4 border border-red-500/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-red-400" />
                  <span className="text-lg font-bold text-white">Pack Victoria Segura</span>
                </div>
                <div className="text-sm text-red-200 space-y-0.5">
                  <p>💪 +8 movimientos</p>
                  <p>🛡️ Protección de derrota</p>
                  <p>⚡ Boosters premium</p>
                </div>
              </div>
              <div className="ml-4">
                <PremiumButton
                  onClick={() => handleBuy('pack_victoria_segura_pro')}
                  loading={loading === 'pack_victoria_segura_pro'}
                  variant="red"
                  size="md"
                  className="whitespace-nowrap min-w-[100px]"
                >
                  {getPrice('pack_victoria_segura_pro', '€2.99')}
                </PremiumButton>
              </div>
            </div>
          </div>
        </div>

        {/* Dismiss link */}
        <div className="text-center mt-4">
          <button 
            onClick={onDismiss}
            className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
};
