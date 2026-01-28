import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { setSoundEnabled, isSoundEnabled, playUIClick } from '@/hooks/useMysticSounds';

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

  // Animation states for pop effect
  const [soundPop, setSoundPop] = useState(false);
  const [musicPop, setMusicPop] = useState(false);

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
    
    // Pop animation
    setSoundPop(true);
    setTimeout(() => setSoundPop(false), 150);
    
    // Play confirmation sound if turning ON
    if (newState) {
      setTimeout(() => playUIClick(), 50);
    }
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
    
    // Pop animation
    setMusicPop(true);
    setTimeout(() => setMusicPop(false), 150);
    
    // Play confirmation sound if turning ON (and sound is enabled)
    if (newState && soundOn) {
      setTimeout(() => playUIClick(), 50);
    }
  };

  return (
    <div className="flex gap-3">
      {/* Sound Effects Button */}
      <button
        onClick={toggleSound}
        className={`
          relative w-14 h-14 rounded-2xl flex items-center justify-center
          transition-all duration-150 ease-out
          ${soundPop ? 'scale-125' : 'hover:scale-110 active:scale-95'}
          ${soundOn 
            ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 shadow-xl shadow-emerald-500/40 border-2 border-emerald-300/70' 
            : 'bg-slate-800/80 border-2 border-slate-600/50 opacity-60'
          }
        `}
        aria-label={soundOn ? 'Desactivar sonidos' : 'Activar sonidos'}
      >
        {soundOn ? (
          <Volume2 className="w-7 h-7 text-white drop-shadow-lg" />
        ) : (
          <VolumeX className="w-7 h-7 text-slate-400" />
        )}
        
        {/* ON label */}
        {soundOn && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-300 bg-emerald-900/80 px-1.5 py-0.5 rounded-full">
            ON
          </span>
        )}
        
        {/* OFF label */}
        {!soundOn && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded-full">
            OFF
          </span>
        )}
        
        {/* Glow ring when active */}
        {soundOn && (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/50 animate-pulse pointer-events-none" />
        )}
      </button>

      {/* Music Button */}
      <button
        onClick={toggleMusic}
        className={`
          relative w-14 h-14 rounded-2xl flex items-center justify-center
          transition-all duration-150 ease-out
          ${musicPop ? 'scale-125' : 'hover:scale-110 active:scale-95'}
          ${musicOn 
            ? 'bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 shadow-xl shadow-purple-500/40 border-2 border-purple-300/70' 
            : 'bg-slate-800/80 border-2 border-slate-600/50 opacity-60'
          }
        `}
        aria-label={musicOn ? 'Desactivar música' : 'Activar música'}
      >
        {musicOn ? (
          <Music className="w-7 h-7 text-white drop-shadow-lg" />
        ) : (
          <Music2 className="w-7 h-7 text-slate-400" />
        )}
        
        {/* ON label */}
        {musicOn && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-300 bg-purple-900/80 px-1.5 py-0.5 rounded-full">
            ON
          </span>
        )}
        
        {/* OFF label */}
        {!musicOn && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded-full">
            OFF
          </span>
        )}
        
        {/* Glow ring when active */}
        {musicOn && (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-400/50 animate-pulse pointer-events-none" />
        )}
      </button>
    </div>
  );
};
