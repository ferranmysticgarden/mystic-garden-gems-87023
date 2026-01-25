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

  // 🟢 SELECCIÓN DE GEMA - cristal tocado (50-80ms)
  const playSelectSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Click cristal agudo
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    vibrate(10);
  }, [getAudioContext, vibrate]);

  // ✨ MATCH NORMAL - nota arpa simple (100-150ms)
  // 🔥 COMBO - arpegio corto solo en combo (200-300ms)
  const playMatchSound = useCallback((comboLevel: number = 0) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    if (comboLevel === 0) {
      // Match normal: una sola nota de arpa
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      vibrate(15);
    } else {
      // Combo: arpegio corto que "canta"
      const notes = [880, 1100, 1320];
      const notesToPlay = Math.min(notes.length, 1 + comboLevel);
      
      notes.slice(0, notesToPlay).forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * (1 + comboLevel * 0.05), now + i * 0.05);
        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.1);
      });
      vibrate([15, 10, 15]);
    }
  }, [getAudioContext, vibrate]);

  // 🚫 MOVIMIENTO INVÁLIDO - seco, no musical (50ms)
  const playInvalidSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // "Nope" inmediato - square wave grave
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);

    vibrate(25);
  }, [getAudioContext, vibrate]);

  // 💥 EXPLOSIÓN / ELIMINAR FILA - físico, no musical (150ms)
  const playRewardSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // Ruido blanco filtrado (explosión)
    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);

    // Subgrave corto (90Hz)
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, now);
    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.12);

    vibrate([30, 15, 30]);
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

  // 🎉 VICTORIA - fanfarria compacta (1-1.5s total)
  const playVictorySound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    // === FANFARRIA CORTA (1s máximo) ===
    const fanfareNotes = [
      { freq: 523.25, time: 0, dur: 0.12 },      // C5 - pickup
      { freq: 659.25, time: 0.1, dur: 0.12 },    // E5
      { freq: 783.99, time: 0.2, dur: 0.12 },    // G5
      { freq: 1046.50, time: 0.35, dur: 0.5 },   // C6 - HOLD final
    ];

    fanfareNotes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.1, now + time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // === CHIMES CORTOS (0.5s) ===
    for (let i = 0; i < 4; i++) {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      const chimeFreq = 1800 + Math.random() * 1200;
      chime.frequency.setValueAtTime(chimeFreq, now + 0.85 + i * 0.06);
      chimeGain.gain.setValueAtTime(0.06, now + 0.85 + i * 0.06);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0 + i * 0.06);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 0.85 + i * 0.06);
      chime.stop(now + 1.1 + i * 0.06);
    }

    // === APLAUSOS MUY SUAVES (opcional, bajo volumen) ===
    for (let i = 0; i < 8; i++) {
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.2));
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2500;
      filter.Q.value = 0.5;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.015, now + 0.5 + Math.random() * 0.8);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now + 0.5 + Math.random() * 0.8);
    }

    vibrate([50, 30, 80]);
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
