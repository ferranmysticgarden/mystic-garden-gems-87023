import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMysticSounds } from '@/hooks/useMysticSounds';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

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

const SEGMENT_ANGLE = 360 / REWARDS.length;

export const LuckySpin = () => {
  const [show, setShow] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [extraSpinAvailable, setExtraSpinAvailable] = useState(false);
  const { user } = useAuth();

  // Detect pending extra_spin purchase from Stripe redirect
  useEffect(() => {
    if (!user?.id) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Check if the pending purchase was an extra_spin
      try {
        const saved = localStorage.getItem('pending_purchase_state');
        if (saved) {
          const state = JSON.parse(saved);
          if (state.productId === 'extra_spin') {
            console.log('[LUCKY_SPIN] Extra spin detected from Stripe redirect');
            setExtraSpinAvailable(true);
            setCanSpin(true);
            setShow(true);
            setReward(null); // Reset reward to allow new spin
            localStorage.removeItem('pending_purchase_state');
          }
        }
      } catch (e) {
        console.error('[LUCKY_SPIN] Error checking pending purchase:', e);
      }
    }
  }, [user?.id]);

  // Handler para giro extra
  const handleExtraSpin = () => {
    setCanSpin(true);
    setExtraSpinAvailable(false);
    setReward(null);
  };

  // Set music to lower volume when Lucky Spin is open
  useEffect(() => {
    if (show) {
      backgroundMusic.setScreen('luckyspin');
      return () => {
        backgroundMusic.setScreen('menu');
      };
    }
  }, [show]);

  // Lower music even more while spinning
  useEffect(() => {
    if (spinning) {
      backgroundMusic.setScreen('luckyspin_spinning');
    } else if (show) {
      backgroundMusic.setScreen('luckyspin');
    }
  }, [spinning, show]);
  
  const lastTickRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const startRotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const spinDurationRef = useRef(5000); // 5 seconds spin

  // Use mystical fairy sounds
  const { playTickSound, playVictorySound } = useMysticSounds();

  // Easing function - starts fast, slows down smoothly
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / spinDurationRef.current, 1);
    const easedProgress = easeOutCubic(progress);
    
    const totalRotation = targetRotationRef.current - startRotationRef.current;
    const currentRotation = startRotationRef.current + totalRotation * easedProgress;
    
    setRotation(currentRotation);

    // Calculate current speed (derivative of eased progress)
    const speed = 1 - progress; // Simplified speed calculation
    
    // Play tick sound when crossing segment boundary
    const currentSegment = Math.floor(currentRotation / SEGMENT_ANGLE);
    if (currentSegment !== lastTickRef.current && speed > 0.05) {
      lastTickRef.current = currentSegment;
      playTickSound(speed);
    }

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      setSpinning(false);
      playVictorySound();
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });
    }
  }, [playTickSound, playVictorySound]);

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
    
    // Calculate target: 3-4 full rotations + landing on the segment
    // We need to land so the pointer (at top) points to the segment
    // Pointer is at 0°, so segment 0 is at top when rotation is 0
    // To land on segment N, we rotate so segment N is at top
    const fullRotations = 360 * (3 + Math.random()); // 3-4 rotations
    const segmentOffset = randomIndex * SEGMENT_ANGLE;
    // Add half segment to land in center
    const targetAngle = fullRotations + (360 - segmentOffset) + SEGMENT_ANGLE / 2;
    
    startRotationRef.current = rotation;
    targetRotationRef.current = rotation + targetAngle;
    startTimeRef.current = 0;
    lastTickRef.current = Math.floor(rotation / SEGMENT_ANGLE);
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Save reward after animation
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
      setCanSpin(false);
    }, spinDurationRef.current + 100);
  };

  const handleClose = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setShow(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

        {/* Wheel container */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* Wheel with segments */}
          <div 
            className="w-full h-full rounded-full border-8 border-yellow-400 overflow-hidden shadow-xl"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(${REWARDS.map((r, i) => 
                `${r.color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`
              ).join(', ')})`
            }}
          >
            {REWARDS.map((rewardItem, index) => {
              const angle = SEGMENT_ANGLE * index + SEGMENT_ANGLE / 2;
              return (
                <div
                  key={index}
                  className="absolute w-full h-full flex items-start justify-center"
                  style={{ 
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <span 
                    className="text-sm font-bold text-white drop-shadow-lg mt-3"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {rewardItem.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-lg z-10 flex items-center justify-center">
            <span className="text-xl">🎰</span>
          </div>
          
          {/* Pointer arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>

          {/* Decorative lights */}
          {[...Array(12)].map((_, i) => {
            const lightAngle = (360 / 12) * i;
            return (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${lightAngle}deg) translateY(-125px) translateX(-6px)`,
                  background: spinning && i % 2 === Math.floor(Date.now() / 200) % 2 
                    ? '#FFD700' 
                    : '#FFA500',
                  boxShadow: '0 0 8px rgba(255, 215, 0, 0.8)'
                }}
              />
            );
          })}
        </div>

        {reward !== null && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-yellow-400 animate-pulse">
              ¡Ganaste {reward} gemas! 🎉
            </p>
          </div>
        )}

        <Button
          onClick={handleSpin}
          disabled={!canSpin || spinning}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 rounded-xl text-lg disabled:opacity-50 transform transition-transform active:scale-95"
        >
          {spinning ? '🎰 GIRANDO...' : reward !== null ? '✓ ¡COMPLETADO!' : '🎰 ¡GIRAR! (GRATIS)'}
        </Button>

        {/* Giro Extra de Pago - Solo después de usar el giro gratis */}
        {!canSpin && reward !== null && (
          <ExtraSpinOffer onBuy={handleExtraSpin} />
        )}

        <p className="text-center text-purple-200 text-sm mt-3">
          {canSpin ? 'Gira gratis 1 vez al día' : 'Vuelve mañana para girar de nuevo'}
        </p>
      </div>
    </div>
  );
};

// Componente de giro extra de pago
interface ExtraSpinOfferProps {
  onBuy: () => void;
}

const ExtraSpinOffer = ({ onBuy }: ExtraSpinOfferProps) => {
  const { createPayment, loading, getPrice } = usePayment();
  const price = getPrice('extra_spin', '€0.50');

  const handleBuy = async () => {
    // Save pending state so LuckySpin can detect it on return from Stripe
    localStorage.setItem('pending_purchase_state', JSON.stringify({
      productId: 'extra_spin',
      timestamp: Date.now(),
      levelId: 0,
      moves: 0,
      score: 0,
      collected: {},
    }));
    
    const success = await createPayment('extra_spin');
    if (success) {
      console.log('[PURCHASE] success confirmed via ExtraSpin');
      dispatchPurchaseCompleted();
      console.log('[PURCHASE] gate unlocked');
      onBuy();
    }
  };

  return (
    <div className="mt-5 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl p-4 border-2 border-yellow-400/60 shadow-lg">
      <p className="text-center text-yellow-200 text-sm mb-3 font-medium">
        🎰 ¿Quieres otro giro con <span className="font-bold text-yellow-400">premio garantizado alto</span>?
      </p>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full relative font-bold text-slate-900 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 hover:from-yellow-300 hover:via-amber-300 hover:to-orange-400 py-4 px-6 rounded-xl text-lg shadow-xl shadow-yellow-500/40 border-2 border-yellow-300/70 transition-all duration-150 transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
        </div>
        
        <span className="relative flex items-center justify-center gap-2">
          {loading ? '⏳ Procesando...' : `🎰 Giro Extra - ${price}`}
        </span>
        
        {/* Price badge */}
        <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-yellow-400">
          {price}
        </span>
      </button>
    </div>
  );
};
