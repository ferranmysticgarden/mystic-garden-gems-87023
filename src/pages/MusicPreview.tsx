import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MusicOption {
  id: string;
  name: string;
  description: string;
  type: 'local' | 'generated';
  url?: string;
  prompt?: string;
}

const MUSIC_OPTIONS: MusicOption[] = [
  {
    id: 'current-game',
    name: '🎮 Actual del juego',
    description: 'La música que ya está integrada ahora mismo (referencia).',
    type: 'local',
    url: '/audio/background-music.mp3',
  },
  {
    id: 'fairy-garden',
    name: '🧚 Fairy Garden',
    description: 'Flauta ligera, pads etéreos, sensación de jardín de hadas.',
    type: 'generated',
    prompt:
      'Calm fantasy ambient background music for a magical garden puzzle game. Light flute melody, airy pads, gentle shimmer, cozy and peaceful. No vocals, no heavy bass, no drums. Loopable. 75-85 BPM.',
  },
  {
    id: 'enchanted-bells',
    name: '✨ Enchanted Bells',
    description: 'Campanillas mágicas, melodía suave, muy "fantasy casual".',
    type: 'generated',
    prompt:
      'Magical forest ambient music for a cozy mobile puzzle game. Soft harp arpeggios, sparkling bells, warm pads, gentle ambience. No vocals, no strong percussion. Loopable. 60-80 BPM.',
  }
];

export default function MusicPreview() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  const generatedUrlsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    generatedUrlsRef.current = generatedUrls;
  }, [generatedUrls]);

  useEffect(() => {
    return () => {
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke generated blob URLs
      Object.values(generatedUrlsRef.current).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const base64ToBlobUrl = (base64: string, mimeType: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const ensureOptionUrl = async (option: MusicOption): Promise<string> => {
    if (option.type === 'local') {
      if (!option.url) throw new Error('Missing local URL');
      return option.url;
    }

    const existing = generatedUrls[option.id];
    if (existing) return existing;

    setLoadingId(option.id);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-music', {
        body: {
          prompt: option.prompt,
          duration: 30,
        },
      });

      if (error) throw error;
      const base64Audio = data?.audioContent as string | undefined;
      if (!base64Audio) throw new Error('No audio returned');

      const blobUrl = base64ToBlobUrl(base64Audio, 'audio/mpeg');
      setGeneratedUrls((prev) => ({ ...prev, [option.id]: blobUrl }));
      return blobUrl;
    } finally {
      setLoadingId(null);
    }
  };

  const handlePlay = async (option: MusicOption) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playing === option.id) {
      setPlaying(null);
      return;
    }

    try {
      const url = await ensureOptionUrl(option);

      // Play new audio
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.5;
      audio.preload = 'auto';
      audio.play().catch((err) => {
        console.error(err);
        toast.error('No se pudo reproducir el audio en este dispositivo');
      });
      audioRef.current = audio;
      setPlaying(option.id);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar la música');
      setPlaying(null);
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
