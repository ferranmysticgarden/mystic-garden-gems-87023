import { useState, useEffect, useRef } from 'react';
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

// Simple audio synthesis for spinning sound
const playSpinSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let time = audioContext.currentTime;
  
  // Create clicking sounds that slow down over time
  for (let i = 0; i < 40; i++) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800 + Math.random() * 400;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    oscillator.start(time);
    oscillator.stop(time + 0.05);
    
    // Clicks slow down exponentially
    const delay = 0.05 + (i * i * 0.003);
    time += delay;
  }
  
  return audioContext;
};

// Celebration sound
const playCelebrationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const time = audioContext.currentTime;
  
  // Play ascending notes
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const noteTime = time + i * 0.15;
    gainNode.gain.setValueAtTime(0.3, noteTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.4);
    
    oscillator.start(noteTime);
    oscillator.stop(noteTime + 0.4);
  });
  
  // Add a sparkle effect
  for (let i = 0; i < 10; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.value = 2000 + Math.random() * 2000;
    osc.type = 'sine';
    
    const sparkleTime = time + 0.6 + i * 0.05;
    gain.gain.setValueAtTime(0.1, sparkleTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.1);
    
    osc.start(sparkleTime);
    osc.stop(sparkleTime + 0.1);
  }
};

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
    
    // Play spinning sound
    try {
      playSpinSound();
    } catch (e) {
      console.log('Audio not available');
    }
    
    const randomIndex = Math.floor(Math.random() * REWARDS.length);
    
    // Calculate rotation: 2-3 full rotations + landing position
    const fullRotations = (2 + Math.random()) * 360; // 2-3 full rotations (720-1080 degrees)
    const segmentAngle = 360 / REWARDS.length; // 45 degrees per segment
    // We need to land on the segment pointed by the arrow (top)
    // The arrow points to 0 degrees, so we need to rotate to align the winning segment
    const landingAngle = segmentAngle * randomIndex + segmentAngle / 2;
    const totalRotation = fullRotations + (360 - landingAngle);
    
    // Add to previous rotation (always moving forward)
    setRotation(prev => prev + totalRotation);

    setTimeout(async () => {
      // Play celebration sound
      try {
        playCelebrationSound();
      } catch (e) {
        console.log('Audio not available');
      }
      
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
          {/* Wheel segments background */}
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
          
          {/* Rotating wheel with labels */}
          <div 
            className="absolute inset-0 w-full h-full rounded-full border-8 border-yellow-400 overflow-hidden"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-yellow-400 border-4 border-yellow-600 shadow-lg" />
          </div>
          
          {/* Arrow pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
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
