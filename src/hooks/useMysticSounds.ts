import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Mystical fairy-tale sounds for the game - AAA QUALITY
 * Style: magical garden, enchanted forest, soft bells, harp, chimes
 * Features: pitch variation, fade in/out, reverb, rate limiting, volume hierarchy
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
  if (typeof window !== 'undefined') {
    localStorage.setItem('mystic_sound_enabled', String(enabled));
  }
};

export const isSoundEnabled = () => globalSoundEnabled;

// Volume hierarchy (relative to master)
const VOLUME = {
  SELECT: 0.6,
  MATCH: 0.65,
  INVALID: 0.7,
  COMBO: 0.8,
  EXPLOSION: 1.0,
  VICTORY: 1.0,
  CHEST: 1.0,
  GEM: 0.7,
  TICK: 0.5,
  MILESTONE: 0.9,
  OFFER: 0.85,
};

// Master volume (adjust overall loudness)
const MASTER_VOLUME = 0.22;

// Rate limiting timestamps
const lastPlayTime: Record<string, number> = {};
const RATE_LIMITS = {
  select: 60,   // ms
  match: 100,   // ms
  invalid: 80,  // ms
  reward: 150,  // ms
};

// Check if enough time has passed since last play
const canPlay = (soundType: string): boolean => {
  const now = Date.now();
  const limit = RATE_LIMITS[soundType as keyof typeof RATE_LIMITS] || 50;
  if (lastPlayTime[soundType] && now - lastPlayTime[soundType] < limit) {
    return false;
  }
  lastPlayTime[soundType] = now;
  return true;
};

// ±2% random pitch variation for organic feel
const randomPitch = (baseFreq: number): number => {
  return baseFreq * (1 + (Math.random() * 0.04 - 0.02));
};

// Create smooth fade envelope (no clicks)
const createEnvelope = (
  gain: GainNode,
  ctx: AudioContext,
  volume: number,
  duration: number,
  fadeIn: number = 0.01,
  fadeOut: number = 0.03
) => {
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + fadeIn);
  gain.gain.setValueAtTime(volume, now + duration - fadeOut);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
};

// Create subtle convolver reverb
const createReverb = (ctx: AudioContext, wetAmount: number = 0.06): ConvolverNode | null => {
  try {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * 0.5; // 0.5s impulse
    const impulse = ctx.createBuffer(2, length, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5) * wetAmount;
      }
    }
    
    convolver.buffer = impulse;
    return convolver;
  } catch {
    return null;
  }
};

export const useMysticSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!globalSoundEnabled) return null;
    
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    // Create reverb if not exists
    if (!reverbRef.current && audioContextRef.current) {
      reverbRef.current = createReverb(audioContextRef.current, 0.06);
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
    if (!canPlay('select')) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.SELECT;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(randomPitch(1400), now);
    osc.frequency.exponentialRampToValueAtTime(randomPitch(2200), now + 0.06);
    
    // Smooth envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    vibrate(10);
  }, [getAudioContext, vibrate]);

  // ✨ MATCH NORMAL & 🔥 COMBO
  const playMatchSound = useCallback((comboLevel: number = 0) => {
    if (!canPlay('match')) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    if (comboLevel === 0) {
      // Match normal: single harp note
      const vol = MASTER_VOLUME * VOLUME.MATCH;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(randomPitch(880), now);
      
      // Smooth envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      vibrate(15);
    } else {
      // Combo: progressive volume arpeggio
      const baseVol = MASTER_VOLUME * VOLUME.COMBO;
      const volumeBoost = comboLevel >= 2 ? (comboLevel - 1) * 0.1 : 0;
      const comboVolume = Math.min(baseVol * (1 + volumeBoost), MASTER_VOLUME * 1.1);
      
      const notes = [880, 1100, 1320];
      const notesToPlay = Math.min(notes.length, 1 + comboLevel);
      
      notes.slice(0, notesToPlay).forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(randomPitch(freq) * (1 + comboLevel * 0.05), now + i * 0.05);
        
        // Smooth envelope per note
        const noteStart = now + i * 0.05;
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(comboVolume, noteStart + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.1);
      });
      vibrate([15, 10, 15]);
    }
  }, [getAudioContext, vibrate]);

  // 🚫 MOVIMIENTO INVÁLIDO
  const playInvalidSound = useCallback(() => {
    if (!canPlay('invalid')) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.INVALID;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(randomPitch(120), now);
    osc.frequency.exponentialRampToValueAtTime(randomPitch(80), now + 0.05);
    
    // Smooth envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);

    vibrate(25);
  }, [getAudioContext, vibrate]);

  // 💥 EXPLOSIÓN / ELIMINAR FILA - físico (150ms)
  const playRewardSound = useCallback(() => {
    if (!canPlay('reward')) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.EXPLOSION;

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
    filter.frequency.setValueAtTime(randomPitch(800), now);
    filter.frequency.exponentialRampToValueAtTime(randomPitch(200), now + 0.15);
    
    const noiseGain = ctx.createGain();
    // Smooth envelope
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(vol, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);

    // Subgrave corto (90Hz)
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(randomPitch(90), now);
    
    // Smooth envelope
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(vol * 1.2, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
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
    const vol = MASTER_VOLUME * VOLUME.GEM;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(randomPitch(698.46), now);
    osc.frequency.exponentialRampToValueAtTime(randomPitch(1046.50), now + 0.1);
    
    // Smooth envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Tiny sparkle
    const spark = ctx.createOscillator();
    const sparkGain = ctx.createGain();
    spark.type = 'sine';
    spark.frequency.setValueAtTime(randomPitch(2093), now + 0.05);
    sparkGain.gain.setValueAtTime(0, now + 0.05);
    sparkGain.gain.linearRampToValueAtTime(vol * 0.5, now + 0.058);
    sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    spark.connect(sparkGain);
    sparkGain.connect(ctx.destination);
    spark.start(now + 0.05);
    spark.stop(now + 0.12);

    vibrate(25);
  }, [getAudioContext, vibrate]);

  // 🎁 Chest open - magical reveal with shimmer + REVERB
  const playChestOpenSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.CHEST;
    const reverb = reverbRef.current;

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
    filter.frequency.setValueAtTime(randomPitch(800), now);
    filter.frequency.exponentialRampToValueAtTime(randomPitch(3000), now + 0.3);
    filter.Q.value = 2;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    if (reverb) {
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.08; // 8% wet reverb
      noiseGain.connect(reverb);
      reverb.connect(wetGain);
      wetGain.connect(ctx.destination);
    }
    noise.start(now);
    noise.stop(now + 0.4);

    // Magical chord reveal with reverb
    const chordNotes = [523.25, 659.25, 783.99, 1046.50];
    chordNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(randomPitch(freq), now + 0.15 + i * 0.03);
      
      const noteStart = now + 0.15 + i * 0.03;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(vol * 0.55, noteStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (reverb) {
        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.08;
        gain.connect(reverb);
        reverb.connect(wetGain);
        wetGain.connect(ctx.destination);
      }
      osc.start(noteStart);
      osc.stop(now + 0.8);
    });

    vibrate([30, 20, 60, 20, 40]);
  }, [getAudioContext, vibrate]);

  // 🎉 VICTORIA - fanfarria compacta (1-1.5s total) + REVERB
  const playVictorySound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.VICTORY;
    const reverb = reverbRef.current;

    // === FANFARRIA CORTA (1s máximo) ===
    const fanfareNotes = [
      { freq: 523.25, time: 0, dur: 0.12 },
      { freq: 659.25, time: 0.1, dur: 0.12 },
      { freq: 783.99, time: 0.2, dur: 0.12 },
      { freq: 1046.50, time: 0.35, dur: 0.5 },
    ];

    fanfareNotes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(randomPitch(freq), now + time);
      
      // Smooth envelope
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(vol * 0.45, now + time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (reverb) {
        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.06;
        gain.connect(reverb);
        reverb.connect(wetGain);
        wetGain.connect(ctx.destination);
      }
      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // === CHIMES CORTOS (0.5s) ===
    for (let i = 0; i < 4; i++) {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      const chimeFreq = randomPitch(1800 + Math.random() * 1200);
      const chimeStart = now + 0.85 + i * 0.06;
      chime.frequency.setValueAtTime(chimeFreq, chimeStart);
      
      chimeGain.gain.setValueAtTime(0, chimeStart);
      chimeGain.gain.linearRampToValueAtTime(vol * 0.28, chimeStart + 0.008);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0 + i * 0.06);
      
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(chimeStart);
      chime.stop(now + 1.1 + i * 0.06);
    }

    // === APLAUSOS MUY SUAVES ===
    for (let i = 0; i < 6; i++) {
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
      const startTime = now + 0.5 + Math.random() * 0.8;
      gain.gain.setValueAtTime(vol * 0.07, startTime);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(startTime);
    }

    vibrate([50, 30, 80]);
  }, [getAudioContext, vibrate]);

  // 😢 Lose sound - gentle, not harsh (descending lullaby)
  const playLoseSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.MATCH; // Softer

    const notes = [659.25, 587.33, 523.25, 493.88];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomPitch(freq), now + i * 0.2);
      
      // Smooth envelope
      const noteStart = now + i * 0.2;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(vol * 0.55, noteStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 0.4);
    });

    vibrate([100, 50, 100]);
  }, [getAudioContext, vibrate]);

  // 🎰 Roulette tick - soft bell + REVERB for Lucky Spin
  const playTickSound = useCallback((speed: number = 1) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.TICK;
    const reverb = reverbRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const freq = randomPitch(1200 + speed * 400);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    
    // Smooth envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (reverb) {
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.05;
      gain.connect(reverb);
      reverb.connect(wetGain);
      wetGain.connect(ctx.destination);
    }
    osc.start(now);
    osc.stop(now + 0.05);
  }, [getAudioContext]);

  // 🌟 Milestone/achievement - grand magical moment + REVERB
  const playMilestoneSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.MILESTONE;
    const reverb = reverbRef.current;

    const chord = [523.25, 659.25, 783.99, 1046.50];
    
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(randomPitch(freq), now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.01);
      gain.gain.linearRampToValueAtTime(vol * 0.45, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (reverb) {
        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.08;
        gain.connect(reverb);
        reverb.connect(wetGain);
        wetGain.connect(ctx.destination);
      }
      osc.start(now);
      osc.stop(now + 1.2);
    });

    // Cascading sparkles
    for (let i = 0; i < 8; i++) {
      const sparkle = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkle.type = 'sine';
      const sparkleStart = now + 0.3 + i * 0.08;
      sparkle.frequency.setValueAtTime(randomPitch(1800 + Math.random() * 2000), sparkleStart);
      
      sparkleGain.gain.setValueAtTime(0, sparkleStart);
      sparkleGain.gain.linearRampToValueAtTime(vol * 0.32, sparkleStart + 0.008);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.08);
      
      sparkle.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);
      sparkle.start(sparkleStart);
      sparkle.stop(now + 0.6 + i * 0.08);
    }

    vibrate([60, 30, 60, 30, 120]);
  }, [getAudioContext, vibrate]);

  // 💫 Offer/special sound - attention but magical
  const playOfferSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const vol = MASTER_VOLUME * VOLUME.OFFER;

    const notes = [
      { freq: 783.99, time: 0 },
      { freq: 1046.50, time: 0.12 },
      { freq: 1318.51, time: 0.24 },
    ];

    notes.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(randomPitch(freq), now + time);
      
      const noteStart = now + time;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(vol * 0.8, noteStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 0.35);
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
