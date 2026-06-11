// T6 — Streak bonus offer: appears at day 5 and day 7 of daily streak.

import { useState } from "react";
import { X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferCountdownTimer } from "@/components/offers/OfferCountdownTimer";
import { DiscountPrice } from "@/components/offers/DiscountPrice";
import { usePayment } from "@/hooks/usePayment";
import { trackEvent } from "@/lib/trackEvent";

interface StreakBonusOfferProps {
  streakDays: 5 | 7;
  onClose: () => void;
}

export const StreakBonusOffer = ({ streakDays, onClose }: StreakBonusOfferProps) => {
  const { createPayment, loading } = usePayment();
  const processing = loading;
  const [error, setError] = useState<string | null>(null);
  const productId = streakDays === 5 ? "streak_bonus_5days" : "streak_bonus_7days";
  const priceLabel = streakDays === 5 ? "3,99 €" : "5,99 €";
  const rewards =
    streakDays === 5
      ? { gems: 200, lives: 5 }
      : { gems: 400, lives: 10, powerups: 3 };

  const handleBuy = async () => {
    setError(null);
    try {
      trackEvent("streak_bonus_purchase_start", { streakDays });
      const ok = await createPayment(productId, "streak_bonus_offer");
      if (ok) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-orange-900 to-red-900 p-6 border-2 border-orange-400 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Flame className="w-16 h-16 text-orange-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">🔥 Racha de {streakDays} días!</h2>
          <p className="text-orange-200 text-sm mt-1 mb-4">
            ¡Increíble! Desbloquea este pack exclusivo de racha:
          </p>

          <ul className="text-left bg-black/30 rounded-lg p-3 mb-4 text-white text-sm space-y-1">
            {rewards.gems && <li>💎 {rewards.gems} Gemas</li>}
            {rewards.lives && <li>❤️ {rewards.lives} Vidas</li>}
            {rewards.powerups && <li>⚡ {rewards.powerups} Power-ups</li>}
          </ul>

          <OfferCountdownTimer durationSeconds={300} offerType={productId} onExpire={onClose} />
          <div className="my-3">
            <DiscountPrice productId={productId} currentPrice={priceLabel} />
          </div>

          <Button
            onClick={handleBuy}
            disabled={processing}
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold"
          >
            {processing ? "Procesando..." : "🔥 Reclamar Bono"}
          </Button>
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
};
