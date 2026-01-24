import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

export const useGameSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Vibrate device (mobile only)
  const vibrate = useCallback((pattern: number | number[]) => {
    if (Capacitor.isNativePlatform() && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Reward sound - magical chime with rising notes
  const playRewardSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create multiple oscillators for a rich chime
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
    });

    // Add sparkle effect
    for (let i = 0; i < 5; i++) {
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(2000 + Math.random() * 2000, now + 0.3 + i * 0.05);
      
      sparkleGain.gain.setValueAtTime(0.1, now + 0.3 + i * 0.05);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5 + i * 0.05);
      
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      
      sparkle.start(now + 0.3 + i * 0.05);
      sparkle.stop(now + 0.5 + i * 0.05);
    }

    vibrate([50, 30, 50]);
  }, [getAudioContext, vibrate]);

  // Gem collect sound - quick satisfying pop
  const playGemCollectSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);

    vibrate(30);
  }, [getAudioContext, vibrate]);

  // Special offer sound - attention grabbing
  const playOfferSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Fanfare-like sound
    const notes = [
      { freq: 392, start: 0, dur: 0.15 },    // G4
      { freq: 523.25, start: 0.15, dur: 0.15 }, // C5
      { freq: 659.25, start: 0.3, dur: 0.3 },  // E5
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      
      gain.gain.setValueAtTime(0.4, now + note.start);
      gain.gain.linearRampToValueAtTime(0.3, now + note.start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    });

    vibrate([100, 50, 100]);
  }, [getAudioContext, vibrate]);

  // Chest open sound - magical reveal
  const playChestOpenSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Whoosh + sparkle
    const noise = ctx.createBufferSource();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
    noiseFilter.Q.value = 1;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.5);

    // Rising chime
    setTimeout(() => playRewardSound(), 200);

    vibrate([50, 30, 100, 30, 50]);
  }, [getAudioContext, playRewardSound, vibrate]);

  // Milestone sound - achievement unlock feeling
  const playMilestoneSound = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Triumphant chord
    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 1);
    });

    vibrate([100, 50, 100, 50, 200]);
  }, [getAudioContext, vibrate]);

  return {
    playRewardSound,
    playGemCollectSound,
    playOfferSound,
    playChestOpenSound,
    playMilestoneSound,
    vibrate
  };
};
