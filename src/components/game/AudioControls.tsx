import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { setSoundEnabled, isSoundEnabled } from '@/hooks/useMysticSounds';

const SOUND_KEY = 'mystic_sound_enabled';
const MUSIC_KEY = 'mystic_music_enabled';

export const AudioControls = () => {
  const [soundOn, setSoundOn] = useState(() => {
    const saved = localStorage.getItem(SOUND_KEY);
    return saved === null ? true : saved === 'true';
  });
  
  const [musicOn, setMusicOn] = useState(() => {
    const saved = localStorage.getItem(MUSIC_KEY);
    return saved === null ? true : saved === 'true';
  });

  // Initialize states on mount
  useEffect(() => {
    setSoundEnabled(soundOn);
    if (!musicOn) {
      backgroundMusic.mute();
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setSoundEnabled(newState);
    localStorage.setItem(SOUND_KEY, String(newState));
  };

  const toggleMusic = () => {
    const newState = !musicOn;
    setMusicOn(newState);
    if (newState) {
      backgroundMusic.unmute();
    } else {
      backgroundMusic.mute();
    }
    localStorage.setItem(MUSIC_KEY, String(newState));
  };

  return (
    <div className="flex gap-1.5">
      {/* Sound Effects Button */}
      <button
        onClick={toggleSound}
        className={`
          relative w-10 h-10 rounded-xl flex items-center justify-center
          transition-all duration-300 transform hover:scale-105 active:scale-95
          ${soundOn 
            ? 'bg-gradient-to-br from-emerald-500/90 to-green-600/90 shadow-lg shadow-emerald-500/30 border border-emerald-400/50' 
            : 'bg-muted/60 border border-muted-foreground/20'
          }
        `}
        aria-label={soundOn ? 'Desactivar sonidos' : 'Activar sonidos'}
      >
        {soundOn ? (
          <Volume2 className="w-5 h-5 text-white drop-shadow-sm" />
        ) : (
          <VolumeX className="w-5 h-5 text-muted-foreground" />
        )}
        
        {/* Glow effect when active */}
        {soundOn && (
          <div className="absolute inset-0 rounded-xl bg-emerald-400/20 animate-pulse" />
        )}
      </button>

      {/* Music Button */}
      <button
        onClick={toggleMusic}
        className={`
          relative w-10 h-10 rounded-xl flex items-center justify-center
          transition-all duration-300 transform hover:scale-105 active:scale-95
          ${musicOn 
            ? 'bg-gradient-to-br from-purple-500/90 to-violet-600/90 shadow-lg shadow-purple-500/30 border border-purple-400/50' 
            : 'bg-muted/60 border border-muted-foreground/20'
          }
        `}
        aria-label={musicOn ? 'Desactivar música' : 'Activar música'}
      >
        {musicOn ? (
          <Music className="w-5 h-5 text-white drop-shadow-sm" />
        ) : (
          <Music2 className="w-5 h-5 text-muted-foreground opacity-50" />
        )}
        
        {/* Glow effect when active */}
        {musicOn && (
          <div className="absolute inset-0 rounded-xl bg-purple-400/20 animate-pulse" />
        )}
        
        {/* Muted line across icon */}
        {!musicOn && (
          <div className="absolute w-6 h-0.5 bg-muted-foreground/60 rotate-45" />
        )}
      </button>
    </div>
  );
};
