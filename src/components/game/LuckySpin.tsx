import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

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

const SPIN_DURATION = 4500; // 4.5 seconds for full animation
const MIN_ROTATIONS = 2.5;
const MAX_ROTATIONS = 3.5;
const SKIP_DELAY = 1000; // Can skip after 1 second

// Audio context singleton
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Spinning clicks that slow down with the wheel
const playSpinningClicks = (duration: number, onComplete: () => void) => {
  const ctx = getAudioContext();
  const startTime = ctx.currentTime;
  const clicks: { time: number; freq: number }[] = [];
  
  // Generate click timings that match easing curve (fast → slow)
  let t = 0;
  let clickIndex = 0;
  while (t < duration / 1000) {
    // Exponential slowdown to match CSS easing
    const progress = t / (duration / 1000);
    const eased = 1 - Math.pow(1 - progress, 3);
    
    // Interval increases as wheel slows
    const baseInterval = 0.04;
    const maxInterval = 0.4;
    const interval = baseInterval + (maxInterval - baseInterval) * eased;
    
    clicks.push({
      time: startTime + t,
      freq: 600 + Math.random() * 300 + (1 - eased) * 400 // Higher pitch when fast
    });
    
    t += interval;
    clickIndex++;
    if (clickIndex > 100) break; // Safety limit
  }
  
  // Schedule all clicks
  clicks.forEach((click, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = click.freq;
    osc.type = 'square';
    
    // Quieter as it slows
    const volume = 0.08 * (1 - (i / clicks.length) * 0.5);
    gain.gain.setValueAtTime(volume, click.time);
    gain.gain.exponentialRampToValueAtTime(0.001, click.time + 0.03);
    
    osc.start(click.time);
    osc.stop(click.time + 0.03);
  });
  
  // Schedule completion callback
  setTimeout(onComplete, duration);
};

// Victory fanfare with drama
const playVictorySound = () => {
  const ctx = getAudioContext();
  const time = ctx.currentTime;
  
  // Dramatic pause then fanfare
  const fanfareStart = time + 0.3;
  
  // Rising chord
  const notes = [
    { freq: 523.25, delay: 0 },    // C5
    { freq: 659.25, delay: 0.05 }, // E5
    { freq: 783.99, delay: 0.1 },  // G5
    { freq: 1046.50, delay: 0.2 }, // C6
  ];
  
  notes.forEach(({ freq, delay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = freq;
    osc.type = 'sine';
    
    const noteTime = fanfareStart + delay;
    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.5);
    
    osc.start(noteTime);
    osc.stop(noteTime + 0.5);
  });
  
  // Sparkle overlay
  for (let i = 0; i < 15; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = 1500 + Math.random() * 3000;
    osc.type = 'sine';
    
    const sparkleTime = fanfareStart + 0.3 + i * 0.04;
    gain.gain.setValueAtTime(0.08, sparkleTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.08);
    
    osc.start(sparkleTime);
    osc.stop(sparkleTime + 0.08);
  }
};

export const LuckySpin = () => {
  const [show, setShow] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const { user } = useAuth();
  
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRewardRef = useRef<{ gems: number; index: number } | null>(null);

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

  const completeSpinWithReward = useCallback(async () => {
    if (!pendingRewardRef.current || !user?.id) return;
    
    const wonReward = pendingRewardRef.current;
    pendingRewardRef.current = null;
    
    // Clear any pending timeouts
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    
    setSpinning(false);
    setCanSkip(false);
    
    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);
    
    // Particles
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 2000);
    
    // Victory sound
    try {
      playVictorySound();
    } catch (e) {
      console.log('Audio not available');
    }
    
    // Confetti burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#AA96DA']
    });
    
    // Save to database
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
  }, [user?.id]);

  const handleSpin = async () => {
    if (!canSpin || spinning || !user?.id) return;

    setSpinning(true);
    setReward(null);
    setCanSkip(false);
    
    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    pendingRewardRef.current = { gems: REWARDS[randomIndex].gems, index: randomIndex };
    
    // Calculate rotation: 2.5-3.5 full rotations + landing position
    const fullRotations = (MIN_ROTATIONS + Math.random() * (MAX_ROTATIONS - MIN_ROTATIONS)) * 360;
    const segmentAngle = 360 / REWARDS.length;
    const landingAngle = segmentAngle * randomIndex + segmentAngle / 2;
    const totalRotation = fullRotations + (360 - landingAngle);
    
    setRotation(prev => prev + totalRotation);
    
    // Start spinning sound
    try {
      playSpinningClicks(SPIN_DURATION, () => {});
    } catch (e) {
      console.log('Audio not available');
    }
    
    // Enable skip after delay
    skipTimeoutRef.current = setTimeout(() => {
      setCanSkip(true);
    }, SKIP_DELAY);
    
    // Auto-complete after full duration
    spinTimeoutRef.current = setTimeout(() => {
      completeSpinWithReward();
    }, SPIN_DURATION);
  };

  const handleSkip = () => {
    if (!canSkip || !pendingRewardRef.current) return;
    
    // Instantly complete the animation
    const wonReward = pendingRewardRef.current;
    const segmentAngle = 360 / REWARDS.length;
    const landingAngle = segmentAngle * wonReward.index + segmentAngle / 2;
    
    // Snap to final position
    setRotation(prev => {
      const currentRotations = Math.floor(prev / 360);
      return (currentRotations + 3) * 360 + (360 - landingAngle);
    });
    
    completeSpinWithReward();
  };

  const handleClose = () => {
    setShow(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    };
  }, []);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={spinning && canSkip ? handleSkip : undefined}
    >
      {/* Flash effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-yellow-400/50 animate-pulse z-40 pointer-events-none" />
      )}
      
      {/* Floating particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
          ))}
        </div>
      )}
      
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
          {/* Wheel */}
          <div 
            className="absolute inset-0 w-full h-full rounded-full border-8 border-yellow-400 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.4)]"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: spinning 
                ? `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.80, 0.20, 1.00)` 
                : 'none'
            }}
          >
            {/* SVG segments */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {REWARDS.map((reward, index) => {
                const angle = (360 / REWARDS.length) * index;
                const startAngle = (angle - 90) * (Math.PI / 180);
                const endAngle = (angle + 360 / REWARDS.length - 90) * (Math.PI / 180);
                const x1 = 50 + 48 * Math.cos(startAngle);
                const y1 = 50 + 48 * Math.sin(startAngle);
                const x2 = 50 + 48 * Math.cos(endAngle);
                const y2 = 50 + 48 * Math.sin(endAngle);
                
                return (
                  <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A 48 48 0 0 1 ${x2} ${y2} Z`}
                    fill={reward.color}
                    stroke="#1a1a2e"
                    strokeWidth="0.5"
                  />
                );
              })}
            </svg>
            
            {/* Labels */}
            {REWARDS.map((reward, index) => {
              const angle = (360 / REWARDS.length) * index + (360 / REWARDS.length / 2);
              return (
                <div
                  key={index}
                  className="absolute w-full h-full flex items-start justify-center pt-3"
                  style={{ 
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  <span 
                    className="text-sm font-bold text-white drop-shadow-lg"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {reward.label}
                  </span>
                </div>
              );
            })}
            
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border-4 border-yellow-700 shadow-lg" />
          </div>
          
          {/* Glowing arrow pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div 
              className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400"
              style={{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))' }}
            />
          </div>
        </div>

        {/* Skip hint */}
        {spinning && canSkip && (
          <p className="text-center text-yellow-300/80 text-xs mb-2 animate-pulse">
            👆 Toca para saltar
          </p>
        )}

        {/* Reward display */}
        {reward !== null && (
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-yellow-400 animate-bounce">
              ¡+{reward} gemas! 🎉
            </p>
            <p className="text-purple-200 text-sm mt-1">¡Enhorabuena!</p>
          </div>
        )}

        <Button
          onClick={handleSpin}
          disabled={!canSpin || spinning}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 rounded-xl text-lg disabled:opacity-50 shadow-lg"
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
