import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createProceduralMusicPlayer, type ProceduralMusicPlayer, type ProceduralMusicPreset } from '@/lib/proceduralMusic';

interface MusicOption {
  id: string;
  name: string;
  description: string;
  preset: ProceduralMusicPreset;
}

const MUSIC_OPTIONS: MusicOption[] = [
  {
    id: 'harp-bells',
    name: '🌿 Harp & Bells',
    description: 'Arpa suave + campanillas, bosque encantado (relajante).',
    preset: 'harp_bells',
  },
  {
    id: 'flute-pads',
    name: '🧚 Flute & Pads',
    description: 'Flauta ligera + pads etéreos, jardín de hadas.',
    preset: 'flute_pads',
  },
  {
    id: 'enchanted-bells',
    name: '✨ Enchanted Bells',
    description: 'Campanillas mágicas (más “casual”), sin tensión.',
    preset: 'enchanted_bells',
  }
];

export default function MusicPreview() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // legacy (kept to avoid risky UI patching)
  const audioContextRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<ProceduralMusicPlayer | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      // Stop any audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Stop procedural music
      playerRef.current?.stop();
    };
  }, []);

  const getAudioContext = async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const ensurePlayer = async (): Promise<ProceduralMusicPlayer> => {
    if (playerRef.current) return playerRef.current;
    const ctx = await getAudioContext();
    playerRef.current = createProceduralMusicPlayer(ctx);
    return playerRef.current;
  };

  const handlePlay = async (option: MusicOption) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Stop procedural if playing
    playerRef.current?.stop();

    if (playing === option.id) {
      setPlaying(null);
      return;
    }

    try {
      setLoadingId(option.id);
      const player = await ensurePlayer();
      player.play(option.preset, { volume: 0.25 });
      setPlaying(option.id);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo iniciar el audio (prueba subir el volumen del móvil/PC)');
      setPlaying(null);
    } finally {
      setLoadingId(null);
    }
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
                    disabled={loadingId === option.id}
                  className={`p-4 rounded-full transition-all ${
                    playing === option.id
                      ? 'bg-purple-500 animate-pulse'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                    {loadingId === option.id ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : playing === option.id ? (
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
