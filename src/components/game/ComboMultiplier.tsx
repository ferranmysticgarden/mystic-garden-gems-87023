import { useEffect, useState } from 'react';

// Audio para combos
let comboAudioCtx: AudioContext | null = null;
const getComboAudioContext = () => {
  if (!comboAudioCtx) {
    comboAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return comboAudioCtx;
};

const playComboSound = (combo: number) => {
  try {
    const ctx = getComboAudioContext();
    const baseFreq = 400 + (combo * 80);
    
    // Acorde ascendente épico
    [0, 0.05, 0.1].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = combo >= 7 ? 'sawtooth' : 'sine';
      osc.frequency.value = baseFreq + (i * 200);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
    
    // Brillo extra para combos altos
    if (combo >= 5) {
      setTimeout(() => {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        sparkle.type = 'sine';
        sparkle.frequency.value = 2000 + (combo * 200);
        sparkleGain.gain.setValueAtTime(0.08, ctx.currentTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        sparkle.start();
        sparkle.stop(ctx.currentTime + 0.15);
      }, 100);
    }
  } catch (e) {}
};

interface ComboMultiplierProps {
  combo: number;
  onComboEnd?: () => void;
}

export const ComboMultiplier = ({ combo, onComboEnd }: ComboMultiplierProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (combo >= 3) {
      setShow(true);
      playComboSound(combo); // Sonido de combo
      const timer = setTimeout(() => {
        setShow(false);
        onComboEnd?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [combo, onComboEnd]);

  if (!show || combo < 3) return null;

  const getMultiplierText = () => {
    if (combo >= 7) return '🔥x4';
    if (combo >= 5) return '⚡x3';
    if (combo >= 3) return '✨x2';
    return '';
  };

  const getColorClass = () => {
    if (combo >= 7) return 'from-red-500 to-orange-500';
    if (combo >= 5) return 'from-yellow-500 to-orange-500';
    return 'from-purple-500 to-pink-500';
  };

  // Ahora aparece en la esquina superior derecha, pequeño y sin bloquear
  return (
    <div className="fixed top-20 right-4 pointer-events-none z-40 animate-in slide-in-from-right duration-300">
      <div className={`bg-gradient-to-r ${getColorClass()} px-3 py-1.5 rounded-full shadow-lg`}>
        <p className="text-lg font-bold text-white drop-shadow">
          {getMultiplierText()}
        </p>
      </div>
    </div>
  );
};
