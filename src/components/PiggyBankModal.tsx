import { useState } from "react";
import { PiggyBank as PiggyBankIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePayment } from "@/hooks/usePayment";
import { OfferCountdownTimer } from "@/components/offers/OfferCountdownTimer";
import { DiscountPrice } from "@/components/offers/DiscountPrice";
import { trackEvent } from "@/lib/trackEvent";

interface PiggyBankModalProps {
  open: boolean;
  amount: number;
  cap: number;
  onClose: () => void;
  onPurchaseSuccess: () => void;
}

export const PiggyBankModal = ({
  open,
  amount,
  cap,
  onClose,
  onPurchaseSuccess,
}: PiggyBankModalProps) => {
  const { createPayment, loading } = usePayment();
  const processing = loading;
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const progress = Math.min(1, amount / cap);
  const isFull = amount >= cap;

  const handleBuy = async () => {
    setError(null);
    try {
      trackEvent("piggy_bank_purchase_start", { amount });
      const ok = await createPayment("piggy_bank_unlock", "piggy_bank_modal");
      if (ok) onPurchaseSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      trackEvent("piggy_bank_purchase_error", { error: msg });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-pink-900 to-purple-900 p-6 border-2 border-pink-400 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full bg-pink-500/30 mb-3 ${isFull ? "animate-bounce" : ""}`}>
            <PiggyBankIcon className="w-16 h-16 text-pink-300" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">🐷 Tu Hucha</h2>
          <p className="text-pink-200 text-sm mb-4">
            {isFull ? "¡LLENA! Desbloquéala para reclamar tu botín" : "Acumula gemas con cada victoria"}
          </p>

          {/* Progress bar */}
          <div className="w-full mb-4">
            <div className="flex justify-between text-sm text-white mb-1">
              <span className="font-bold">{amount}</span>
              <span className="text-pink-300">/ {cap} 💎</span>
            </div>
            <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-pink-400/30">
              <div
                className={`h-full transition-all ${isFull ? "bg-yellow-400" : "bg-gradient-to-r from-pink-400 to-purple-400"}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {isFull ? (
            <>
              <OfferCountdownTimer durationSeconds={300} offerType="piggy_bank_unlock" onExpire={onClose} />
              <div className="my-3">
                <DiscountPrice productId="piggy_bank_unlock" currentPrice="2,99 €" />
              </div>
              <Button
                onClick={handleBuy}
                disabled={processing}
                size="lg"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-lg"
              >
                {processing ? "Procesando..." : `🔓 Desbloquear y Reclamar ${amount} 💎`}
              </Button>
              {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
            </>
          ) : (
            <p className="text-xs text-pink-300/80">
              Sigue jugando — ganarás 5 💎 por victoria hasta llenarla.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
