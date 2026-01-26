import { useEffect, useRef, useCallback } from 'react';

type Screen = 'menu' | 'levels' | 'shop' | 'game' | 'luckyspin' | 'luckyspin_spinning' | 'chest' | 'pause' | 'victory' | 'defeat';

// Professional mobile game audio values
// Base max: 0.25, SFX: 0.9-1.0
const VOLUME_MAP: Record<Screen, number> = {
  menu: 0.22,              // Protagonista aquí
  levels: 0.18,            // Un poco más bajo
  shop: 0.18,              // No compite con efectos
  luckyspin: 0.18,         // Normal
  luckyspin_spinning: 0.12, // Mientras gira la ruleta
  chest: 0.18,             // Igual que tienda
  pause: 0.15,             // Ambiente suave
  game: 0.07,              // Casi imperceptible, SFX protagonistas
  victory: 0,              // Mute para fanfarria limpia
  defeat: 0.05,            // Muy bajo para sonido de derrota
};

// Volume to return to after victory/defeat
const POST_EVENT_VOLUME = 0.15;

class BackgroundMusicManager {
  private static instance: BackgroundMusicManager | null = null;
  private audio: HTMLAudioElement | null = null;
  private currentVolume = 0.22;
  private targetVolume = 0.22;
  private baseVolume = 0.22; // Track base volume for returns
  private isMuted = false;
  private isInitialized = false;
  private fadeInterval: number | null = null;
  private loopFadeTimeout: number | null = null;

  private constructor() {}

  static getInstance(): BackgroundMusicManager {
    if (!BackgroundMusicManager.instance) {
      BackgroundMusicManager.instance = new BackgroundMusicManager();
    }
    return BackgroundMusicManager.instance;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.audio = new Audio('/audio/background-music.mp3');
    this.audio.loop = true;
    this.audio.volume = 0; // Start at 0 for fade-in
    this.isInitialized = true;

    // Setup loop fade handling
    this.setupLoopFade();
  }

  // Fade in/out at loop boundaries (1.5s each) to hide repetition
  private setupLoopFade() {
    if (!this.audio) return;

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio || this.isMuted) return;
      
      const duration = this.audio.duration;
      const currentTime = this.audio.currentTime;
      const fadeTime = 1.5;

      if (!isNaN(duration)) {
        // Fade out near end of loop
        if (currentTime > duration - fadeTime) {
          const fadeProgress = (duration - currentTime) / fadeTime;
          const fadeVolume = this.targetVolume * fadeProgress;
          this.audio.volume = Math.max(0, fadeVolume);
        }
        // Fade in at start of loop
        else if (currentTime < fadeTime) {
          const fadeProgress = currentTime / fadeTime;
          const fadeVolume = this.targetVolume * fadeProgress;
          this.audio.volume = Math.min(this.targetVolume, fadeVolume);
        }
        // Normal volume in middle
        else if (Math.abs(this.audio.volume - this.targetVolume) > 0.01) {
          // Only adjust if we're not in a fade transition
          if (!this.fadeInterval) {
            this.audio.volume = this.targetVolume;
          }
        }
      }
    });
  }

  async play() {
    if (!this.audio) this.initialize();
    if (!this.audio) return;

    try {
      // Start with fade-in
      this.audio.volume = 0;
      await this.audio.play();
      this.fadeToVolume(this.targetVolume, 1500);
    } catch (e) {
      console.log('Audio autoplay blocked, waiting for user interaction');
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  private fadeToVolume(targetVol: number, duration: number) {
    if (!this.audio) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = this.currentVolume;
    const volumeDiff = targetVol - startVolume;
    const steps = duration / 50; // 50ms intervals
    const volumeStep = volumeDiff / steps;
    let currentStep = 0;

    this.fadeInterval = window.setInterval(() => {
      currentStep++;
      this.currentVolume = startVolume + (volumeStep * currentStep);
      
      if (this.audio) {
        this.audio.volume = Math.max(0, Math.min(1, this.currentVolume));
      }

      if (currentStep >= steps) {
        this.currentVolume = targetVol;
        if (this.audio) this.audio.volume = targetVol;
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, 50);
  }

  setVolume(volume: number, instant = false) {
    this.targetVolume = this.isMuted ? 0 : volume;
    
    if (instant || !this.audio) {
      this.currentVolume = this.targetVolume;
      if (this.audio) this.audio.volume = this.currentVolume;
      return;
    }

    // Smooth fade over 300ms for screen transitions
    this.fadeToVolume(this.targetVolume, 300);
  }

  setScreen(screen: Screen) {
    const volume = VOLUME_MAP[screen] ?? 0.18;
    
    // Track base volume for non-event screens
    if (screen !== 'victory' && screen !== 'defeat') {
      this.baseVolume = volume;
    }
    
    this.setVolume(volume);
  }

  // Return to base volume after victory/defeat events
  returnToBase(delay = 2000) {
    setTimeout(() => {
      if (!this.isMuted) {
        this.setVolume(POST_EVENT_VOLUME);
      }
    }, delay);
  }

  mute() {
    this.isMuted = true;
    this.fadeToVolume(0, 200);
  }

  unmute() {
    this.isMuted = false;
    this.fadeToVolume(this.baseVolume, 200);
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return !this.isMuted;
  }

  getIsMuted() {
    return this.isMuted;
  }

  // Duck music for important sounds (reduced multiplier for cleaner SFX)
  duck(duration = 800) {
    if (!this.audio || this.isMuted) return;
    
    const duckVolume = this.currentVolume * 0.2; // Duck to 20%
    this.audio.volume = duckVolume;
    
    setTimeout(() => {
      if (this.audio && !this.isMuted && !this.fadeInterval) {
        this.fadeToVolume(this.targetVolume, 400);
      }
    }, duration);
  }
}

export const backgroundMusic = BackgroundMusicManager.getInstance();

export function useBackgroundMusic(screen?: Screen) {
  const hasInteracted = useRef(false);

  // Start music on first user interaction
  useEffect(() => {
    const startMusic = () => {
      if (!hasInteracted.current) {
        hasInteracted.current = true;
        backgroundMusic.initialize();
        backgroundMusic.play();
      }
    };

    // Try to start immediately
    backgroundMusic.initialize();
    backgroundMusic.play();

    // Also listen for user interaction as fallback
    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('touchstart', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });

    return () => {
      document.removeEventListener('click', startMusic);
      document.removeEventListener('touchstart', startMusic);
      document.removeEventListener('keydown', startMusic);
    };
  }, []);

  // Update volume based on screen
  useEffect(() => {
    if (screen) {
      backgroundMusic.setScreen(screen);
    }
  }, [screen]);

  const setScreen = useCallback((newScreen: Screen) => {
    backgroundMusic.setScreen(newScreen);
  }, []);

  const toggleMute = useCallback(() => {
    return backgroundMusic.toggleMute();
  }, []);

  const duck = useCallback((duration?: number) => {
    backgroundMusic.duck(duration);
  }, []);

  const isMuted = useCallback(() => {
    return backgroundMusic.getIsMuted();
  }, []);

  const returnToBase = useCallback((delay?: number) => {
    backgroundMusic.returnToBase(delay);
  }, []);

  return {
    setScreen,
    toggleMute,
    duck,
    isMuted,
    returnToBase,
  };
}
