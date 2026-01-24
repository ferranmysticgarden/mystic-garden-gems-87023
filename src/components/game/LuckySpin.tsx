import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

const REWARDS = [
  { gems: 10, color: '#FF6B6B', label: '10 💎' },
  { gems: 5, color: '#4ECDC4', label: '5 💎' },
  { gems: 20, color: '#FFE66D', label: '20 💎' },
  { gems: 5, color: '#95E1D3', label: '5 💎' },
  { gems: 50, color: '#F38181', label: '50 💎' },
  { gems: 5, color: '#AA96DA', label: '5 💎' },
  { gems: 15, color: '#FCBAD3', label: '15 💎' },
  { gems: 5, color: '#A8E6CF', label: '5 💎' }
];

export const LuckySpin = () => {
  const [show, setShow] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const checkAvailability = async () => {
      const lastSpin = localStorage.getItem(`last-spin-${user.id}`);
      if (!lastSpin) {
        setCanSpin(true);
        setShow(true);
        return;
      }

      const lastSpinDate = new Date(lastSpin);
      const now = new Date();
      const diffHours = (now.getTime() - lastSpinDate.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 24) {
        setCanSpin(true);
        setShow(true);
      }
    };

    checkAvailability();
  }, [user?.id]);

  const handleSpin = async () => {
    if (!canSpin || spinning || !user?.id) return;

    setSpinning(true);
    setReward(null);
    
    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    const extraRotation = 360 * 5;
    const targetRotation = extraRotation + (randomIndex * (360 / REWARDS.length));
    
    setRotation(prev => prev + targetRotation);

    setTimeout(async () => {
      const wonReward = REWARDS[randomIndex];
      
      const { data: gameState } = await supabase
        .from('game_progress')
        .select('gems')
        .eq('user_id', user.id)
        .maybeSingle();

      if (gameState) {
        await supabase
          .from('game_progress')
          .update({
            gems: (gameState.gems || 0) + wonReward.gems
          })
          .eq('user_id', user.id);
      }

      localStorage.setItem(`last-spin-${user.id}`, new Date().toISOString());
      
      setReward(wonReward.gems);
      setSpinning(false);
      setCanSpin(false);
    }, 4000);
  };

  const handleClose = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-6 max-w-sm mx-4 border-4 border-yellow-400 shadow-2xl">
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-4">
          🎰 RULETA DE LA SUERTE
        </h2>

        <div className="relative w-64 h-64 mx-auto mb-6">
          <div 
            className="w-full h-full rounded-full border-8 border-yellow-400 overflow-hidden transition-transform duration-[4000ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {REWARDS.map((reward, index) => {
              const angle = (360 / REWARDS.length) * index;
              return (
                <div
                  key={index}
                  className="absolute w-full h-full flex items-start justify-center pt-4"
                  style={{ 
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <span className="text-lg font-bold text-white drop-shadow-lg">
                    {reward.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400" />
          </div>
        </div>

        {reward !== null && (
          <div className="text-center mb-4 animate-bounce">
            <p className="text-2xl font-bold text-yellow-400">
              ¡Ganaste {reward} gemas! 🎉
            </p>
          </div>
        )}

        <Button
          onClick={handleSpin}
          disabled={!canSpin || spinning}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 rounded-xl text-lg disabled:opacity-50"
        >
          {spinning ? '🎰 GIRANDO...' : reward !== null ? '✓ ¡COMPLETADO!' : '🎰 ¡GIRAR! (GRATIS)'}
        </Button>

        <p className="text-center text-purple-200 text-sm mt-3">
          {canSpin ? 'Gira gratis 1 vez al día' : 'Vuelve mañana para girar de nuevo'}
        </p>
      </div>
    </div>
  );
};
