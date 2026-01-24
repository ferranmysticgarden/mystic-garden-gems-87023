import { useEffect, useRef, useCallback } from 'react';

type Screen = 'menu' | 'levels' | 'shop' | 'game' | 'luckyspin' | 'chest' | 'pause' | 'victory' | 'defeat';

const VOLUME_MAP: Record<Screen, number> = {
  menu: 0.4,
  levels: 0.4,
  shop: 0.4,
  luckyspin: 0.25,
  chest: 0.35,
  pause: 0.4,
  game: 0.1,      // Muy bajita durante partida
  victory: 0,     // Silenciar para fanfarria
  defeat: 0,      // Silenciar para sonido corto
};

class BackgroundMusicManager {
  private static instance: BackgroundMusicManager | null = null;
  private audio: HTMLAudioElement | null = null;
  private currentVolume = 0.4;
  private targetVolume = 0.4;
  private isMuted = false;
  private isInitialized = false;
  private fadeInterval: number | null = null;

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
    this.audio.volume = this.currentVolume;
    this.isInitialized = true;
  }

  async play() {
    if (!this.audio) this.initialize();
    if (!this.audio) return;

    try {
      await this.audio.play();
    } catch (e) {
      // Autoplay blocked - will retry on user interaction
      console.log('Audio autoplay blocked, waiting for user interaction');
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  setVolume(volume: number, instant = false) {
    this.targetVolume = this.isMuted ? 0 : volume;
    
    if (instant || !this.audio) {
      this.currentVolume = this.targetVolume;
      if (this.audio) this.audio.volume = this.currentVolume;
      return;
    }

    // Smooth fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    this.fadeInterval = window.setInterval(() => {
      const diff = this.targetVolume - this.currentVolume;
      if (Math.abs(diff) < 0.02) {
        this.currentVolume = this.targetVolume;
        if (this.audio) this.audio.volume = this.currentVolume;
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        return;
      }
      this.currentVolume += diff * 0.15;
      if (this.audio) this.audio.volume = Math.max(0, Math.min(1, this.currentVolume));
    }, 50);
  }

  setScreen(screen: Screen) {
    const volume = VOLUME_MAP[screen] ?? 0.4;
    this.setVolume(volume);
  }

  mute() {
    this.isMuted = true;
    this.setVolume(0);
  }

  unmute() {
    this.isMuted = false;
    this.setVolume(this.targetVolume);
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

  // Temporarily duck music for important sounds
  duck(duration = 500) {
    if (!this.audio || this.isMuted) return;
    
    const originalVolume = this.currentVolume;
    this.audio.volume = originalVolume * 0.3;
    
    setTimeout(() => {
      if (this.audio && !this.isMuted) {
        this.audio.volume = originalVolume;
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

  return {
    setScreen,
    toggleMute,
    duck,
    isMuted,
  };
}
