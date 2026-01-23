import { useCallback, useRef } from 'react';

/**
 * Hook para reproducir sonidos de click suaves en botones
 * Usa Web Audio API para generar sonidos sintéticos
 */
export const useClickSound = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Soft click sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 800;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.setTargetAtTime(0.001, ctx.currentTime, 0.02);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Silently fail - sound is optional enhancement
    }
  }, [getAudioContext]);

  const playSuccess = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Two-tone success sound
      const notes = [523.25, 659.25]; // C5, E5
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.setTargetAtTime(0.001, startTime, 0.1);
        
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext]);

  const playError = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Low tone for error
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 200;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.setTargetAtTime(0.001, ctx.currentTime, 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Silently fail
    }
  }, [getAudioContext]);

  return {
    playClick,
    playSuccess,
    playError,
  };
};
