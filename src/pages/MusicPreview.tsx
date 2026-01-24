import { useState, useRef } from 'react';
import { Play, Pause, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MusicOption {
  id: string;
  name: string;
  description: string;
  url: string;
}

const MUSIC_OPTIONS: MusicOption[] = [
  {
    id: 'magical-forest',
    name: '🌿 Magical Forest',
    description: 'Arpa suave, campanillas, ambiente de bosque encantado. Muy relajante.',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3'
  },
  {
    id: 'fairy-garden',
    name: '🧚 Fairy Garden',
    description: 'Flauta ligera, pads etéreos, sensación de jardín de hadas.',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c5.mp3'
  },
  {
    id: 'enchanted-bells',
    name: '✨ Enchanted Bells',
    description: 'Campanillas mágicas, melodía suave, muy "fantasy casual".',
    url: 'https://cdn.pixabay.com/download/audio/2021/04/07/audio_dda8810eb9.mp3'
  }
];

export default function MusicPreview() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  const handlePlay = (option: MusicOption) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playing === option.id) {
      setPlaying(null);
      return;
    }

    // Play new audio
    const audio = new Audio(option.url);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(console.error);
    audioRef.current = audio;
    setPlaying(option.id);
  };

  const handleSelect = (id: string) => {
    setSelected(id);
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 p-6">
      <div className="max-w-lg mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            navigate('/');
          }}
          className="text-white/70 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al juego
        </Button>

        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          🎵 Elige la Música de Fondo
        </h1>
        <p className="text-purple-200 text-center mb-8">
          Escucha cada opción y elige la que más te guste para tu jardín místico
        </p>

        <div className="space-y-4">
          {MUSIC_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`rounded-2xl p-5 transition-all border-2 ${
                selected === option.id
                  ? 'bg-green-500/20 border-green-400 shadow-lg shadow-green-500/20'
                  : 'bg-white/10 border-white/20 hover:border-purple-400/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handlePlay(option)}
                  className={`p-4 rounded-full transition-all ${
                    playing === option.id
                      ? 'bg-purple-500 animate-pulse'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {playing === option.id ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {option.name}
                  </h3>
                  <p className="text-purple-200/80 text-sm mb-3">
                    {option.description}
                  </p>
                  
                  <Button
                    onClick={() => handleSelect(option.id)}
                    className={`${
                      selected === option.id
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-purple-500 hover:bg-purple-600'
                    }`}
                  >
                    {selected === option.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        ¡Seleccionada!
                      </>
                    ) : (
                      'Elegir esta'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="mt-8 p-4 bg-green-500/20 rounded-xl border border-green-400 text-center">
            <p className="text-green-300 font-semibold">
              ✅ Has elegido: {MUSIC_OPTIONS.find(o => o.id === selected)?.name}
            </p>
            <p className="text-green-200/70 text-sm mt-1">
              Dime en el chat cuál elegiste y la configuro en el juego
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
