import { useState, useEffect } from 'react';
import { Star, Sparkles, Trophy, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface LevelWinCelebrationProps {
  levelId: number;
  score: number;
  stars: number;
  reward?: { gems?: number };
  onContinue: () => void;
}

const CELEBRATION_TEXTS = [
  '¡INCREÍBLE! 🎉',
  '¡FANTÁSTICO! ✨',
  '¡BRILLANTE! 💫',
  '¡GENIAL! 🌟',
  '¡PERFECTO! 🎊',
  '¡ESPECTACULAR! 🔥',
];

export const LevelWinCelebration = ({ 
  levelId, 
  score, 
  stars, 
  reward, 
  onContinue 
}: LevelWinCelebrationProps) => {
  const [showContent, setShowContent] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [celebrationText] = useState(
    CELEBRATION_TEXTS[Math.floor(Math.random() * CELEBRATION_TEXTS.length)]
  );

  useEffect(() => {
    // Sequence of animations
    const timers: NodeJS.Timeout[] = [];

    // Flash effect
    const flashEl = document.createElement('div');
    flashEl.className = 'fixed inset-0 bg-white z-[100] pointer-events-none';
    flashEl.style.animation = 'flash-out 0.5s ease-out forwards';
    document.body.appendChild(flashEl);
    timers.push(setTimeout(() => flashEl.remove(), 500));

    // Show content after flash
    timers.push(setTimeout(() => setShowContent(true), 300));

    // Show stars one by one
    timers.push(setTimeout(() => setShowStars(true), 600));

    // Show reward
    timers.push(setTimeout(() => setShowReward(true), 1200));

    // Confetti burst
    timers.push(setTimeout(() => {
      // Multiple confetti bursts
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.3, y: 0.5 },
        colors: ['#FFD700', '#4ECDC4', '#FF6B6B', '#9B59B6', '#F39C12'],
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.7, y: 0.5 },
        colors: ['#FFD700', '#4ECDC4', '#FF6B6B', '#9B59B6', '#F39C12'],
      });
    }, 400));

    // Second confetti wave
    timers.push(setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.7 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B'],
      });
    }, 800));

    // Play victory sound
    playVictorySound();

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const playVictorySound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 1. APLAUSOS - ruido blanco filtrado con ritmo
      const playApplause = () => {
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 1);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
        noise.stop(audioCtx.currentTime + 2);
      };
      
      // 2. PETARDOS - explosiones cortas
      const playFirework = (delay: number) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
          
          // Crackle después del boom
          setTimeout(() => {
            for (let i = 0; i < 8; i++) {
              setTimeout(() => {
                const crackle = audioCtx.createOscillator();
                const crackleGain = audioCtx.createGain();
                crackle.frequency.value = 800 + Math.random() * 2000;
                crackle.type = 'square';
                crackleGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                crackleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
                crackle.connect(crackleGain);
                crackleGain.connect(audioCtx.destination);
                crackle.start();
                crackle.stop(audioCtx.currentTime + 0.05);
              }, i * 30);
            }
          }, 100);
        }, delay);
      };
      
      // 3. SILBIDOS - frecuencias altas ascendentes
      const playWhistle = (delay: number) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(2500, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        }, delay);
      };
      
      // Ejecutar todo
      playApplause();
      playFirework(0);
      playFirework(300);
      playFirework(700);
      playWhistle(150);
      playWhistle(500);
      playWhistle(900);
      
    } catch (e) {
      console.log('Victory sound failed:', e);
    }
  };

  return (
    <>
      {/* Flash animation style */}
      <style>{`
        @keyframes flash-out {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes star-pop {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes slide-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
        }
        @keyframes bounce-text {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div 
          className={`
            bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 
            rounded-3xl p-6 max-w-sm w-full 
            border-4 border-yellow-400/60 
            shadow-2xl
            transition-all duration-500
            ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          `}
          style={{ animation: showContent ? 'pulse-glow 2s ease-in-out infinite' : 'none' }}
        >
          {/* Trophy */}
          <div className="text-center mb-4">
            <div className="relative inline-block">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto drop-shadow-lg" />
              <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -bottom-1 -left-2 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>

          {/* Celebration text */}
          <h2 
            className="text-3xl font-bold text-center mb-2"
            style={{ 
              background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: showContent ? 'bounce-text 1s ease-in-out infinite' : 'none'
            }}
          >
            {celebrationText}
          </h2>

          <p className="text-center text-emerald-200 text-lg mb-4">
            ¡Nivel {levelId} completado!
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3].map((starNum) => (
              <div
                key={starNum}
                style={{
                  animation: showStars 
                    ? `star-pop 0.5s ease-out ${starNum * 0.2}s both` 
                    : 'none'
                }}
              >
                <Star 
                  className={`w-12 h-12 ${starNum <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 fill-gray-600'} drop-shadow-lg`}
                />
              </div>
            ))}
          </div>

          {/* Score */}
          <div 
            className="bg-emerald-500/20 rounded-xl p-4 mb-4 border border-emerald-400/30"
            style={{ animation: showReward ? 'slide-up 0.5s ease-out' : 'none', opacity: showReward ? 1 : 0 }}
          >
            <p className="text-center text-emerald-100 text-lg">
              Puntuación: <span className="text-2xl font-bold text-yellow-300">{score}</span>
            </p>
          </div>

          {/* Reward */}
          {reward?.gems && (
            <div 
              className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-xl p-4 mb-6 border border-purple-400/40 flex items-center justify-center gap-3"
              style={{ animation: showReward ? 'slide-up 0.5s ease-out 0.2s both' : 'none' }}
            >
              <Gift className="w-6 h-6 text-purple-300" />
              <span className="text-xl font-bold text-purple-200">+{reward.gems} 💎</span>
            </div>
          )}

          {/* Continue button */}
          <Button
            onClick={onContinue}
            className="w-full py-6 text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-yellow-300 shadow-lg transform hover:scale-105 transition-all active:scale-95"
            style={{ animation: showReward ? 'slide-up 0.5s ease-out 0.4s both' : 'none' }}
          >
            🌸 ¡Continuar! 🌸
          </Button>
        </div>
      </div>
    </>
  );
};
