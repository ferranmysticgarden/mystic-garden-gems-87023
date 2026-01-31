import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { usePayment } from '@/hooks/usePayment';

interface ChestType {
  id: string;
  name: string;
  emoji: string;
  price: number | 'free';
  cooldown?: number; // hours for free chest
  rewards: {
    gems: [number, number]; // min, max
    lives: [number, number];
    noAdsMins: [number, number];
  };
  color: string;
  borderColor: string;
}

const CHEST_TYPES: ChestType[] = [
  {
    id: 'wood',
    name: 'Cofre Madera',
    emoji: '🟤',
    price: 'free',
    cooldown: 6,
    rewards: { gems: [5, 15], lives: [1, 2], noAdsMins: [0, 5] },
    color: 'from-amber-900 to-amber-700',
    borderColor: 'border-amber-500'
  },
  {
    id: 'silver',
    name: 'Cofre Plata',
    emoji: '🟦',
    price: 0.99,
    rewards: { gems: [30, 60], lives: [3, 5], noAdsMins: [10, 20] },
    color: 'from-slate-600 to-slate-400',
    borderColor: 'border-slate-300'
  },
  {
    id: 'gold',
    name: 'Cofre Oro',
    emoji: '🟨',
    price: 2.99,
    rewards: { gems: [100, 200], lives: [5, 10], noAdsMins: [30, 60] },
    color: 'from-yellow-600 to-yellow-400',
    borderColor: 'border-yellow-300'
  }
];

interface LootChestProps {
  onClose: () => void;
  onRewardClaimed?: (gems: number, lives: number) => void;
}

export const LootChest = ({ onClose, onRewardClaimed }: LootChestProps) => {
  const { user } = useAuth();
  const { createPayment, loading: paymentLoading, getPrice } = usePayment();
  const [opening, setOpening] = useState<string | null>(null);
  const [freeChestAvailable, setFreeChestAvailable] = useState(false);
  const [freeChestTimeLeft, setFreeChestTimeLeft] = useState('');
  const [reward, setReward] = useState<{ gems: number; lives: number; noAdsMins: number } | null>(null);
  const [loadingChest, setLoadingChest] = useState<string | null>(null);

  // Set music to chest volume when open
  useEffect(() => {
    backgroundMusic.setScreen('chest');
    return () => {
      backgroundMusic.setScreen('menu');
    };
  }, []);

  useEffect(() => {
    checkFreeChest();
    const interval = setInterval(checkFreeChest, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const checkFreeChest = () => {
    if (!user?.id) return;
    
    const lastClaim = localStorage.getItem(`free-chest-${user.id}`);
    if (!lastClaim) {
      setFreeChestAvailable(true);
      setFreeChestTimeLeft('');
      return;
    }

    const lastClaimTime = new Date(lastClaim).getTime();
    const cooldownMs = 6 * 60 * 60 * 1000; // 6 hours
    const now = Date.now();
    const timeRemaining = (lastClaimTime + cooldownMs) - now;

    if (timeRemaining <= 0) {
      setFreeChestAvailable(true);
      setFreeChestTimeLeft('');
    } else {
      setFreeChestAvailable(false);
      const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
      const mins = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      setFreeChestTimeLeft(`${hours}h ${mins}m`);
    }
  };

  const getRandomReward = (chest: ChestType) => {
    const gems = Math.floor(Math.random() * (chest.rewards.gems[1] - chest.rewards.gems[0] + 1)) + chest.rewards.gems[0];
    const lives = Math.floor(Math.random() * (chest.rewards.lives[1] - chest.rewards.lives[0] + 1)) + chest.rewards.lives[0];
    const noAdsMins = Math.floor(Math.random() * (chest.rewards.noAdsMins[1] - chest.rewards.noAdsMins[0] + 1)) + chest.rewards.noAdsMins[0];
    return { gems, lives, noAdsMins };
  };

  const handleOpenChest = async (chest: ChestType) => {
    if (!user?.id) return;

    if (chest.price === 'free') {
      if (!freeChestAvailable) return;
      
      localStorage.setItem(`free-chest-${user.id}`, new Date().toISOString());
      setOpening(chest.id);
      
      setTimeout(() => {
        const rewardResult = getRandomReward(chest);
        setReward(rewardResult);
        if (onRewardClaimed) onRewardClaimed(rewardResult.gems, rewardResult.lives);
        setOpening(null);
        checkFreeChest();
        setOpening(null);
        checkFreeChest();
      }, 2000);
    } else {
      // Paid chest - use unified payment
      setLoadingChest(chest.id);
      const success = await createPayment(`chest_${chest.id}`);
      if (success) {
        // Payment initiated successfully
        setOpening(chest.id);
        setTimeout(() => {
          const rewardResult = getRandomReward(chest);
          setReward(rewardResult);
          if (onRewardClaimed) onRewardClaimed(rewardResult.gems, rewardResult.lives);
          setOpening(null);
        }, 2000);
      }
      setLoadingChest(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-6 max-w-md w-full border-4 border-purple-400 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎁</div>
          <h2 className="text-2xl font-bold text-purple-300">COFRES MÁGICOS</h2>
          <p className="text-purple-200/70 text-sm">Abre cofres para ganar premios</p>
        </div>

        {/* Reward reveal */}
        {reward && (
          <div className="bg-gradient-to-r from-yellow-500/30 to-green-500/30 rounded-xl p-4 mb-4 border border-yellow-400/50 animate-scale-in">
            <h3 className="text-center text-xl font-bold text-yellow-400 mb-3">🎉 ¡RECOMPENSA!</h3>
            <div className="flex justify-center gap-4 text-white">
              {reward.gems > 0 && <span className="text-lg">💎 {reward.gems}</span>}
              {reward.lives > 0 && <span className="text-lg">❤️ {reward.lives}</span>}
              {reward.noAdsMins > 0 && <span className="text-lg">🚫 {reward.noAdsMins}m</span>}
            </div>
            <Button 
              onClick={() => setReward(null)}
              className="w-full mt-3 bg-green-500 hover:bg-green-600"
            >
              ¡Genial!
            </Button>
          </div>
        )}

        {/* Chests */}
        <div className="space-y-4">
          {CHEST_TYPES.map((chest) => (
            <div 
              key={chest.id}
              className={`bg-gradient-to-r ${chest.color} rounded-xl p-4 border-2 ${chest.borderColor} transition-all hover:scale-[1.02] ${
                opening === chest.id ? 'animate-pulse' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{chest.emoji}</div>
                  <div>
                    <p className="font-bold text-white text-lg">{chest.name}</p>
                    <p className="text-white/70 text-sm">
                      💎 {chest.rewards.gems[0]}-{chest.rewards.gems[1]} | 
                      ❤️ {chest.rewards.lives[0]}-{chest.rewards.lives[1]}
                    </p>
                  </div>
                </div>
                
                <div>
                  {chest.price === 'free' ? (
                    freeChestAvailable ? (
                      <Button
                        onClick={() => handleOpenChest(chest)}
                        disabled={opening === chest.id}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold"
                      >
                        {opening === chest.id ? (
                          <Sparkles className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-1" />
                            GRATIS
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-center">
                        <p className="text-white/50 text-xs">Disponible en</p>
                        <p className="text-white font-mono">{freeChestTimeLeft}</p>
                      </div>
                    )
                  ) : (
                    <Button
                      onClick={() => handleOpenChest(chest)}
                      disabled={loadingChest === chest.id || paymentLoading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                    >
                      {loadingChest === chest.id ? '...' : `${getPrice(`chest_${chest.id}`, `€${chest.price}`)}`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
