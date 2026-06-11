// T9 — Win streak offer: appears after 3 consecutive wins.

import { useState } from "react";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferCountdownTimer } from "@/components/offers/OfferCountdownTimer";
import { DiscountPrice } from "@/components/offers/DiscountPrice";
import { usePayment } from "@/hooks/usePayment";
import { trackEvent } from "@/lib/trackEvent";

interface WinStreakOfferProps {
  streakCount: number;
  onClose: () => void;
}

export const WinStreakOffer = ({ streakCount, onClose }: WinStreakOfferProps) => {
  const { createPayment, loading } = usePayment();
  const processing = loading;
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    setError(null);
    try {
      trackEvent("win_streak_purchase_start", { streakCount });
      const ok = await createPayment("streak_3wins_bonus", "win_streak_offer");
      if (ok) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-emerald-900 to-cyan-900 p-6 border-2 border-emerald-400 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-2 animate-bounce" />
          <h2 className="text-2xl font-bold text-white">⚡ ¡{streakCount} victorias seguidas!</h2>
          <p className="text-emerald-200 text-sm mt-1 mb-4">
            Mantén tu racha imparable con este pack:
          </p>

          <ul className="text-left bg-black/30 rounded-lg p-3 mb-4 text-white text-sm space-y-1">
            <li>💎 100 Gemas</li>
            <li>❤️ 3 Vidas</li>
            <li>⚡ 2 Power-ups</li>
          </ul>

          <OfferCountdownTimer durationSeconds={300} offerType="streak_3wins_bonus" onExpire={onClose} />
          <div className="my-3">
            <DiscountPrice productId="streak_3wins_bonus" currentPrice="1,99 €" />
          </div>

          <Button
            onClick={handleBuy}
            disabled={processing}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold"
          >
            {processing ? "Procesando..." : "🏆 Reclamar Bono Victoria"}
          </Button>
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
};
