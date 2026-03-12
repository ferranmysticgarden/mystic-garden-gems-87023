import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Lock, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';
import { toast } from 'sonner';

const TIERS = [
  { level: 1, free: '10 💎', premium: '50 💎 + 2 ❤️' },
  { level: 2, free: '5 💎', premium: '30 💎' },
  { level: 3, free: '15 💎', premium: '100 💎 + Power-up' },
  { level: 4, free: '10 💎', premium: '50 💎 + 3 ❤️' },
  { level: 5, free: '20 💎', premium: '200 💎 + Sin ads 7 días' },
];

interface BattlePassProps {
  onClose: () => void;
  hasPremiumAccess: boolean;
  onPurchaseSuccess?: () => void;
}

export const BattlePass = ({ onClose, hasPremiumAccess, onPurchaseSuccess }: BattlePassProps) => {
  const [currentTier, setCurrentTier] = useState(1);
  const [guestPremiumUnlocked, setGuestPremiumUnlocked] = useState(false);
  const { user } = useAuth();
  const { createPayment, loading } = usePayment();

  const isPremium = hasPremiumAccess || guestPremiumUnlocked;

  useEffect(() => {
    const loadProgress = async () => {
      // Only load from DB if authenticated
      if (user?.id) {
        const { data: gameState } = await supabase
          .from('game_progress')
          .select('completed_levels')
          .eq('user_id', user.id)
          .maybeSingle();

        if (gameState) {
          const completedCount = gameState.completed_levels?.length || 0;
          const tier = Math.min(Math.floor(completedCount / 10) + 1, 5);
          setCurrentTier(tier);
        }
      } else {
        // Guest: try to get progress from localStorage
        try {
          const guestProgress = localStorage.getItem('mystic_guest_progress');
          if (guestProgress) {
            const parsed = JSON.parse(guestProgress);
            const completedCount = parsed.completedLevels?.length || 0;
            const tier = Math.min(Math.floor(completedCount / 10) + 1, 5);
            setCurrentTier(tier);
          }
        } catch {
          // ignore
        }
      }
    };

    loadProgress();
  }, [user?.id]);

  const handleBuyPremium = async () => {
    if (loading) return;

    const success = await createPayment('garden_pass');
    if (!success) return;

    dispatchPurchaseCompleted('garden_pass');
    setGuestPremiumUnlocked(true);
    onPurchaseSuccess?.();
    toast.success('Battle Pass Premium activado');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-6 max-w-md w-full border-4 border-yellow-400 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-yellow-400">Battle Pass</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isPremium && (
              <Button
                onClick={handleBuyPremium}
                size="sm"
                disabled={loading}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold"
              >
                {loading ? 'Procesando...' : `Premium ${getPrice('garden_pass', '€9.99')}`}
              </Button>
            )}
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {TIERS.map((tier) => {
            const isUnlocked = currentTier >= tier.level;

            return (
              <div
                key={tier.level}
                className={`rounded-xl p-4 ${isUnlocked ? 'bg-purple-800/50' : 'bg-gray-800/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white flex items-center gap-2">
                    Nivel {tier.level}
                    {!isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg p-2 ${isUnlocked ? 'bg-green-500/20' : 'bg-gray-700/50'}`}>
                    <p className="text-xs text-gray-300">GRATIS</p>
                    <p className="text-white font-semibold">{tier.free}</p>
                  </div>

                  <div className={`rounded-lg p-2 ${isPremium && isUnlocked ? 'bg-yellow-500/20' : 'bg-gray-700/50'}`}>
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      PREMIUM {isPremium ? '✓' : '🔒'}
                    </p>
                    <p className={`font-semibold ${isPremium ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {tier.premium}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-purple-200 text-sm mt-4">
          Completa niveles para desbloquear recompensas
        </p>
      </div>
    </div>
  );
};
