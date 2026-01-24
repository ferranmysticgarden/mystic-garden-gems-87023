import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Mystical fairy-tale sounds for the game
 * Style: magical garden, enchanted forest, soft bells, harp, chimes
 * NO harsh sounds, NO dark tones - pure magical fairy vibes
 */

// Global sound enabled state
let globalSoundEnabled = true;

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('mystic_sound_enabled');
  globalSoundEnabled = saved === null ? true : saved === 'true';
}

export const setSoundEnabled = (enabled: boolean) => {
  globalSoundEnabled = enabled;
};

export const isSoundEnabled = () => globalSoundEnabled;

export const useMysticSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!globalSoundEnabled) return null;
    
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Soft vibration for mobile
  const vibrate = useCallback((pattern: number | number[]) => {
    if (!globalSoundEnabled) return;
    if (Capacitor.isNativePlatform() && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // ✨ Magical chime - tile selection (soft bell + sparkle)
  const playSelectSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Soft bell tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5 - high, bright
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    // Add sparkle overtone
    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(1760, now); // A6 - fairy sparkle
    sparkleGain.gain.setValueAtTime(0.08, now);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkle.start(now);
    sparkle.stop(now + 0.2);

    vibrate(15);
  }, [getAudioContext, vibrate]);

  // 🎵 Harp arpeggio - match sound (increases with combo)
  const playMatchSound = useCallback((comboLevel: number = 0) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Pentatonic scale for magical feel: C, D, E, G, A
    const baseNotes = [523.25, 587.33, 659.25, 783.99, 880]; // C5, D5, E5, G5, A5
    const noteCount = Math.min(3 + comboLevel, 5);

    baseNotes.slice(0, noteCount).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Triangle wave for soft harp-like tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * (1 + comboLevel * 0.1), now + i * 0.06);
      
      gain.gain.setValueAtTime(0.2, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.4);
    });

    // Add shimmer for higher combos
    if (comboLevel >= 2) {
      for (let i = 0; i < comboLevel; i++) {
        const shimmer = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(2000 + Math.random() * 1500, now + 0.2 + i * 0.05);
        shimmerGain.gain.setValueAtTime(0.06, now + 0.2 + i * 0.05);
        shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4 + i * 0.05);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(ctx.destination);
        shimmer.start(now + 0.2 + i * 0.05);
        shimmer.stop(now + 0.4 + i * 0.05);
      }
    }

    vibrate([20, 10, 20]);
  }, [getAudioContext, vibrate]);

  // 🌸 Soft wind chime - invalid move (gentle, not harsh)
  const playInvalidSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Two descending soft tones (like a gentle "nope")
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now); // A4
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(392, now + 0.1); // G4 - descending
    gain2.gain.setValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.3);

    vibrate(30);
  }, [getAudioContext, vibrate]);

  // ✨ Fairy dust reward sound - magical ascending chimes
  const playRewardSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Ascending fairy scale
    const notes = [659.25, 783.99, 880, 1046.50, 1318.51]; // E5, G5, A5, C6, E6
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.5);
    });

    // Add magical sparkles at the end
    for (let i = 0; i < 6; i++) {
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(1500 + Math.random() * 2000, now + 0.35 + i * 0.04);
      
      sparkleGain.gain.setValueAtTime(0.08, now + 0.35 + i * 0.04);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55 + i * 0.04);
      
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkle.start(now + 0.35 + i * 0.04);
      sparkle.stop(now + 0.55 + i * 0.04);
    }

    vibrate([40, 20, 40, 20, 60]);
  }, [getAudioContext, vibrate]);

  // 💎 Gem collect - quick magical pop
  const playGemCollectSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(698.46, now); // F5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1); // Rise to C6
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Tiny sparkle
    const spark = ctx.createOscillator();
    const sparkGain = ctx.createGain();
    spark.type = 'sine';
    spark.frequency.setValueAtTime(2093, now + 0.05); // C7
    sparkGain.gain.setValueAtTime(0.1, now + 0.05);
    sparkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    spark.connect(sparkGain);
    sparkGain.connect(ctx.destination);
    spark.start(now + 0.05);
    spark.stop(now + 0.12);

    vibrate(25);
  }, [getAudioContext, vibrate]);

  // 🎁 Chest open - magical reveal with shimmer
  const playChestOpenSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Soft whoosh using filtered noise
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
    filter.Q.value = 2;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);

    // Magical chord reveal
    const chordNotes = [523.25, 659.25, 783.99, 1046.50]; // C major spread
    chordNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.15 + i * 0.03);
      gain.gain.setValueAtTime(0.12, now + 0.15 + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.15 + i * 0.03);
      osc.stop(now + 0.8);
    });

    vibrate([30, 20, 60, 20, 40]);
  }, [getAudioContext, vibrate]);

  // 🏆 Victory fanfare - triumphant but magical
  const playVictorySound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Ascending triumphant arpeggio
    const notes = [
      { freq: 523.25, time: 0, dur: 0.3 },      // C5
      { freq: 659.25, time: 0.15, dur: 0.3 },   // E5
      { freq: 783.99, time: 0.3, dur: 0.3 },    // G5
      { freq: 1046.50, time: 0.45, dur: 0.6 },  // C6 (held)
      { freq: 1318.51, time: 0.6, dur: 0.5 },   // E6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.2, now + time);
      gain.gain.linearRampToValueAtTime(0.15, now + time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Sparkle shower at the end
    for (let i = 0; i < 10; i++) {
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(1500 + Math.random() * 2500, now + 0.8 + i * 0.05);
      sparkleGain.gain.setValueAtTime(0.06, now + 0.8 + i * 0.05);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 1.1 + i * 0.05);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkle.start(now + 0.8 + i * 0.05);
      sparkle.stop(now + 1.1 + i * 0.05);
    }

    vibrate([80, 40, 80, 40, 150]);
  }, [getAudioContext, vibrate]);

  // 😢 Lose sound - gentle, not harsh (descending lullaby)
  const playLoseSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Soft descending notes
    const notes = [659.25, 587.33, 523.25, 493.88]; // E5, D5, C5, B4
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.2);
      gain.gain.setValueAtTime(0.12, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.4);
    });

    vibrate([100, 50, 100]);
  }, [getAudioContext, vibrate]);

  // 🎰 Roulette tick - soft bell
  const playTickSound = useCallback((speed: number = 1) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Higher pitch when faster
    const freq = 1200 + speed * 400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }, [getAudioContext]);

  // 🌟 Milestone/achievement - grand magical moment
  const playMilestoneSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Magical chord with shimmer
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C major
    
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    });

    // Cascading sparkles
    for (let i = 0; i < 12; i++) {
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(1800 + Math.random() * 2000, now + 0.3 + i * 0.08);
      sparkleGain.gain.setValueAtTime(0.07, now + 0.3 + i * 0.08);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6 + i * 0.08);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkle.start(now + 0.3 + i * 0.08);
      sparkle.stop(now + 0.6 + i * 0.08);
    }

    vibrate([60, 30, 60, 30, 120]);
  }, [getAudioContext, vibrate]);

  // 💫 Offer/special sound - attention but magical
  const playOfferSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Bright fanfare notes
    const notes = [
      { freq: 783.99, time: 0 },      // G5
      { freq: 1046.50, time: 0.12 },  // C6
      { freq: 1318.51, time: 0.24 },  // E6
    ];

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.18, now + time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + 0.35);
    });

    vibrate([50, 30, 80]);
  }, [getAudioContext, vibrate]);

  return {
    playSelectSound,
    playMatchSound,
    playInvalidSound,
    playRewardSound,
    playGemCollectSound,
    playChestOpenSound,
    playVictorySound,
    playLoseSound,
    playTickSound,
    playMilestoneSound,
    playOfferSound,
    vibrate
  };
};
