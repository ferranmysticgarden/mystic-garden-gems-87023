import { useState, useEffect } from 'react';
import { Gift, Sparkles, Timer } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';
import confetti from 'canvas-confetti';

interface RewardDoublerProps {
  baseGems: number;
  onClose: () => void;
  onDouble: (newGems: number) => void;
}

export const RewardDoubler = ({ baseGems, onClose, onDouble }: RewardDoublerProps) => {
  const { createPayment, loading, getPrice } = usePayment();
  const [countdown, setCountdown] = useState(8);
  const [showPulse, setShowPulse] = useState(false);
  const doubledGems = baseGems * 2;

  const price = getPrice('reward_doubler', '€0.50');

  // Countdown timer with urgency
  useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }

    // Pulse effect at 3 seconds
    if (countdown <= 3) {
      setShowPulse(true);
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onClose]);

  // Entry confetti
  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#4ECDC4', '#FF6B6B'],
    });
  }, []);

  const handleBuy = async () => {
    const success = await createPayment('reward_doubler');
    if (success) {
      console.log('[PURCHASE] success confirmed via RewardDoubler');
      dispatchPurchaseCompleted('reward_doubler');
      console.log('[PURCHASE] gate unlocked');
      onDouble(doubledGems);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
      <div className={`relative bg-gradient-to-b from-amber-900 via-yellow-900 to-orange-900 rounded-3xl p-6 max-w-sm w-full border-4 ${showPulse ? 'border-red-400 animate-pulse' : 'border-yellow-400'} shadow-2xl shadow-yellow-500/30 animate-in zoom-in-95 duration-300`}>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#FFA500', '#FF6347'][i % 3],
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.7
              }}
            />
          ))}
        </div>

        {/* Timer badge - urgent style */}
        <div className={`absolute -top-3 right-4 ${countdown <= 3 ? 'bg-red-500 animate-bounce' : 'bg-orange-500'} text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-lg`}>
          <Timer className="w-4 h-4" />
          <span>{countdown}s</span>
        </div>

        {/* Header */}
        <div className="text-center mb-5 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <Gift className="w-12 h-12 text-yellow-300 animate-bounce" />
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 mb-2">
            ¡VICTORIA! 🎉
          </h2>
          <p className="text-yellow-100/90 text-lg">
            ¡Consigue un bonus de 50 gemas extra!
          </p>
        </div>

        {/* Reward visualization */}
        <div className="relative z-10 bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 rounded-2xl p-5 mb-5 border-2 border-yellow-400/40">
          <div className="flex items-center justify-center gap-6">
            {/* Current reward */}
            <div className="text-center">
              <p className="text-yellow-300/70 text-sm mb-1">Ganaste</p>
              <div className="flex items-center gap-1">
                <span className="text-3xl">💎</span>
                <span className="text-2xl font-bold text-white">{baseGems}</span>
              </div>
            </div>
            
            {/* Arrow animation */}
            <div className="text-4xl animate-pulse">➡️</div>
            
            {/* Doubled reward */}
            <div className="text-center transform scale-110">
              <p className="text-green-400 text-sm font-bold mb-1">x2</p>
              <div className="flex items-center gap-1">
                <span className="text-4xl">💎</span>
                <span className="text-3xl font-black text-green-400">{doubledGems}</span>
              </div>
            </div>
          </div>

          {/* Visual chests */}
          <div className="flex justify-center gap-4 mt-4">
            <div className="text-4xl animate-bounce" style={{ animationDelay: '0ms' }}>🎁</div>
            <div className="text-5xl animate-bounce" style={{ animationDelay: '150ms' }}>🎁</div>
            <div className="text-4xl animate-bounce" style={{ animationDelay: '300ms' }}>🎁</div>
          </div>
        </div>

        <div className="relative z-10">
          <PremiumButton
            onClick={handleBuy}
            loading={loading}
            variant="gold"
            size="lg"
            price={price}
            className="mb-3"
          >
            <Gift className="w-5 h-5 mr-2" />
            ¡DUPLICAR AHORA!
          </PremiumButton>

          <button
            onClick={onClose}
            className="w-full text-yellow-300/50 hover:text-yellow-300/80 text-sm py-2 transition-colors"
          >
            No gracias, solo quiero {baseGems} gemas
          </button>
        </div>
      </div>
    </div>
  );
};
