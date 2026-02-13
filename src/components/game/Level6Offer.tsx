import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { emitAnalyticsEvent } from '@/lib/analytics';
import { Capacitor } from '@capacitor/core';

interface Level6OfferProps {
  onBuy: () => void;
  onDismiss: () => void;
  progressPercent?: number;
}

/**
 * Oferta ligera y neutra para el nivel 6.
 * Se muestra solo en la PRIMERA derrota con ≥80% de progreso.
 * Recompensa: +3 movimientos por €0.50
 */
export const Level6Offer = ({ onBuy, onDismiss, progressPercent = 85 }: Level6OfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();

  // Emitir evento al renderizarse
  useEffect(() => {
    emitAnalyticsEvent('debug_level6_reached');
    emitAnalyticsEvent('level6_popup_shown', { level: 6, progress: progressPercent });

    // DEBUG DIRECTO — nativo o web
    if (Capacitor.isNativePlatform()) {
      import("@capacitor-firebase/analytics").then(({ FirebaseAnalytics }) => {
        FirebaseAnalytics.logEvent({ name: "debug_level6_direct", params: {} })
          .then(() => console.log("[DEBUG] debug_level6_direct sent via NATIVE"))
          .catch(() => {});
      }).catch(() => {});
    }
  }, [progressPercent]);

  const handleBuy = async () => {
    const success = await createPayment('buy_moves');
    if (success) {
      emitAnalyticsEvent('level6_purchase_success');
      localStorage.setItem('level6_offer_dismissed', 'true');
      localStorage.setItem('first_purchase_completed', 'true');
      onBuy();
    }
  };

  const handleDismiss = () => {
    emitAnalyticsEvent('level6_popup_closed');
    localStorage.setItem('level6_offer_dismissed', 'true');
    onDismiss();
  };

  const price = getPrice('buy_moves', '€0.50');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-6 max-w-sm mx-4 border-2 border-purple-400/50 shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/50 hover:text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          {/* Emoji neutro */}
          <div className="text-5xl mb-3">🌿</div>

          {/* Título neutro */}
          <h2 className="text-xl font-semibold text-white mb-1">
            Estuviste muy cerca
          </h2>

          {/* Refuerzo emocional */}
          <p className="text-purple-300/90 text-xs mb-3 italic">
            Ya has hecho casi todo el trabajo
          </p>

          {/* Barra de progreso visual */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-purple-300 mb-1">
              <span>Tu progreso</span>
              <span className="font-bold text-amber-400">{Math.round(progressPercent)}%</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-4 bg-white/10 border border-white/10 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-amber-400"
            />
            <p className="text-purple-200 text-sm mt-2">
              Con unos pocos movimientos más lo superas
            </p>
          </div>

          {/* Beneficio */}
          <div className="bg-white/10 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-center gap-2 text-white">
              <span className="text-2xl">✨</span>
              <span className="text-lg font-medium">+3 movimientos</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-5 rounded-xl text-lg shadow-lg transition-all"
          >
            {loading ? '⏳ Procesando...' : 'Terminar este nivel'}
          </Button>

          {/* Precio visible debajo */}
          <p className="text-purple-300/80 text-sm mt-2">
            {price} · menos que un café
          </p>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/50 text-xs mt-4 transition-colors"
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
};
