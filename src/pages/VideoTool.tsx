import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, Sparkles, Image, FileText, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedFrame {
  id: string;
  dataUrl: string;
  timestamp: number;
  selected: boolean;
  aiScore?: number;
  aiReason?: string;
}

interface GeneratedTexts {
  shortTitle: string;
  longTitle: string;
  shortDescription: string;
  fullDescription: string;
  googleAdsShort: string;
  googleAdsLong: string;
}

export default function VideoTool() {
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [texts, setTexts] = useState<GeneratedTexts | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
      setVideoUrl(URL.createObjectURL(file));
      setFrames([]);
      setTexts(null);
    } else {
      toast.error('Por favor, sube un archivo de video');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideo(file);
      setVideoUrl(URL.createObjectURL(file));
      setFrames([]);
      setTexts(null);
    } else {
      toast.error('Por favor, sube un archivo de video');
    }
  };

  const extractFrames = async (): Promise<ExtractedFrame[]> => {
    return new Promise((resolve) => {
      const videoEl = videoRef.current;
      const canvas = canvasRef.current;
      if (!videoEl || !canvas) return resolve([]);

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve([]);

      const extractedFrames: ExtractedFrame[] = [];
      const duration = videoEl.duration;
      const frameCount = 15; // Extract 15 frames
      const interval = duration / frameCount;

      let currentFrame = 0;

      const captureFrame = () => {
        if (currentFrame >= frameCount) {
          resolve(extractedFrames);
          return;
        }

        const timestamp = currentFrame * interval;
        videoEl.currentTime = timestamp;
      };

      videoEl.onseeked = () => {
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/png');
        extractedFrames.push({
          id: `frame-${currentFrame}`,
          dataUrl,
          timestamp: videoEl.currentTime,
          selected: false,
        });

        setProgress((currentFrame / frameCount) * 40);
        currentFrame++;
        captureFrame();
      };

      captureFrame();
    });
  };

  const analyzeFramesWithAI = async (framesToAnalyze: ExtractedFrame[]): Promise<ExtractedFrame[]> => {
    setStage('Analizando frames con IA...');
    
    try {
      // Send frames to AI for analysis
      const { data, error } = await supabase.functions.invoke('analyze-video-frames', {
        body: { 
          frames: framesToAnalyze.map((f, i) => ({ 
            id: f.id, 
            index: i,
            timestamp: f.timestamp 
          })),
          appName: 'Mystic Garden',
          appDescription: 'Juego match-3 de puzzles con temática de bosque mágico, gemas brillantes y efectos visuales místicos'
        }
      });

      if (error) throw error;

      // Mark the top 8 frames as selected based on AI recommendations
      const analyzedFrames = framesToAnalyze.map((frame, index) => {
        const aiResult = data?.recommendations?.find((r: any) => r.index === index);
        return {
          ...frame,
          selected: aiResult?.recommended ?? index < 8,
          aiScore: aiResult?.score ?? 50,
          aiReason: aiResult?.reason ?? 'Frame automático'
        };
      });

      // Sort by AI score and select top 8
      const sorted = [...analyzedFrames].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      return analyzedFrames.map(frame => ({
        ...frame,
        selected: sorted.slice(0, 8).some(s => s.id === frame.id)
      }));

    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback: select frames at regular intervals
      return framesToAnalyze.map((frame, index) => ({
        ...frame,
        selected: index % 2 === 0 && index < 16,
        aiReason: 'Selección automática (IA no disponible)'
      }));
    }
  };

  const generateTexts = async (): Promise<GeneratedTexts> => {
    setStage('Generando textos promocionales...');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-promo-texts', {
        body: {
          appName: 'Mystic Garden',
          appDescription: 'Juego match-3 de puzzles con temática de bosque mágico encantado. Características: +50 niveles, gemas brillantes, power-ups mágicos, sistema de vidas, racha diaria, ruleta de premios, Battle Pass, efectos visuales místicos.',
          targetAudience: 'Jugadores casuales que disfrutan de puzzles relajantes'
        }
      });

      if (error) throw error;

      return data || getDefaultTexts();
    } catch (error) {
      console.error('Text generation error:', error);
      return getDefaultTexts();
    }
  };

  const getDefaultTexts = (): GeneratedTexts => ({
    shortTitle: 'Mystic Garden - Match 3 Mágico',
    longTitle: '🔮 Mystic Garden - Puzzle Match 3 con Gemas Mágicas y +50 Niveles',
    shortDescription: '¡Combina gemas mágicas en el bosque encantado! +50 niveles, power-ups y premios diarios.',
    fullDescription: `🌟 MYSTIC GARDEN - El puzzle match-3 más mágico

Sumérgete en un bosque encantado lleno de gemas brillantes y misterios por descubrir.

✨ CARACTERÍSTICAS:
• +50 niveles desafiantes
• Power-ups mágicos: Martillo, Shuffle, Deshacer
• Sistema de racha diaria con recompensas
• Ruleta de la suerte gratuita
• Battle Pass con premios exclusivos
• Gráficos místicos y relajantes

🎮 JUGABILIDAD ADICTIVA
Combina 3 o más gemas del mismo color para ganar puntos. Crea combos épicos para multiplicar tus recompensas.

💎 RECOMPENSAS GENEROSAS
• Gemas gratis cada día
• Vidas que se recargan automáticamente
• Premios especiales por racha de 7 días

¡Descarga ahora y comienza tu aventura mágica!`,
    googleAdsShort: 'Mystic Garden: +100 Gemas Gratis',
    googleAdsLong: '🔮 Puzzle Match-3 Mágico - +50 Niveles y Premios Diarios'
  });

  const handleGenerate = async () => {
    if (!video || !videoRef.current) {
      toast.error('Primero sube un video');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Extract frames
      setStage('Extrayendo frames del video...');
      const extractedFrames = await extractFrames();
      setProgress(40);

      // Step 2: Analyze with AI
      setStage('Analizando con IA...');
      const analyzedFrames = await analyzeFramesWithAI(extractedFrames);
      setFrames(analyzedFrames);
      setProgress(70);

      // Step 3: Generate texts
      setStage('Generando textos...');
      const generatedTexts = await generateTexts();
      setTexts(generatedTexts);
      setProgress(100);

      toast.success('¡Generación completada!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error durante la generación');
    } finally {
      setIsProcessing(false);
      setStage('');
    }
  };

  const toggleFrameSelection = (frameId: string) => {
    setFrames(frames.map(f => 
      f.id === frameId ? { ...f, selected: !f.selected } : f
    ));
  };

  const handleDownloadZip = async () => {
    const selectedFrames = frames.filter(f => f.selected);
    if (selectedFrames.length === 0 && !texts) {
      toast.error('No hay nada que descargar');
      return;
    }

    const zip = new JSZip();
    const screenshotsFolder = zip.folder('screenshots');
    const textsFolder = zip.folder('texts');

    // Add selected frames
    selectedFrames.forEach((frame, index) => {
      const base64Data = frame.dataUrl.split(',')[1];
      screenshotsFolder?.file(`screenshot_${index + 1}.png`, base64Data, { base64: true });
    });

    // Add texts
    if (texts) {
      const textsContent = `
=== TEXTOS PARA GOOGLE PLAY STORE ===

📱 TÍTULO CORTO (máx 30 caracteres):
${texts.shortTitle}

📱 TÍTULO LARGO (máx 90 caracteres):
${texts.longTitle}

📝 DESCRIPCIÓN CORTA (máx 80 caracteres):
${texts.shortDescription}

📝 DESCRIPCIÓN COMPLETA (máx 4000 caracteres):
${texts.fullDescription}


=== TEXTOS PARA GOOGLE ADS ===

🎯 TÍTULO CORTO (máx 30 caracteres):
${texts.googleAdsShort}

🎯 TÍTULO LARGO (máx 90 caracteres):
${texts.googleAdsLong}
`;
      textsFolder?.file('textos_promocionales.txt', textsContent);
      
      // Also save as JSON for easy parsing
      textsFolder?.file('textos.json', JSON.stringify(texts, null, 2));
    }

    // Generate and download
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mystic_garden_promo_assets.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('¡ZIP descargado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Video Tool - Generador de Assets
          </h1>
          <p className="text-purple-200">
            Sube tu video, extrae las mejores capturas con IA y genera textos promocionales
          </p>
        </div>

        {/* Upload Area */}
        <Card 
          className={`p-8 md:p-12 border-2 border-dashed transition-all cursor-pointer
            ${isDragging 
              ? 'border-yellow-400 bg-yellow-400/10' 
              : 'border-purple-400/50 bg-purple-900/30 hover:border-purple-400'
            }
            ${video ? 'border-green-400 bg-green-900/20' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            {video ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-white">{video.name}</p>
                  <p className="text-sm text-purple-300">
                    {(video.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideo(null);
                    setVideoUrl('');
                    setFrames([]);
                    setTexts(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cambiar video
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium text-white">
                    Arrastra tu video aquí
                  </p>
                  <p className="text-purple-300">
                    o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-purple-400 mt-2">
                    Soporta MP4, WebM, MOV (3-5 minutos recomendado)
                  </p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </Card>

        {/* Hidden video element for processing */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            preload="metadata"
            onLoadedMetadata={() => {
              if (videoRef.current) {
                console.log('Video duration:', videoRef.current.duration);
              }
            }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Generate Button */}
        {video && !isProcessing && frames.length === 0 && (
          <Button
            onClick={handleGenerate}
            size="lg"
            className="w-full py-6 text-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400"
          >
            <Sparkles className="w-6 h-6 mr-3" />
            Generar Capturas + Textos con IA
          </Button>
        )}

        {/* Progress */}
        {isProcessing && (
          <Card className="p-6 bg-purple-900/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                  <span className="text-white font-medium">{stage}</span>
                </div>
                <span className="text-purple-300">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>
        )}

        {/* Frames Grid */}
        {frames.length > 0 && (
          <Card className="p-6 bg-purple-900/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Image className="w-5 h-5" />
                Capturas Extraídas ({frames.filter(f => f.selected).length} seleccionadas)
              </h2>
              <p className="text-purple-300 text-sm">Haz clic para seleccionar/deseleccionar</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  onClick={() => toggleFrameSelection(frame.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                    ${frame.selected 
                      ? 'border-green-400 ring-2 ring-green-400/50' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                    }
                  `}
                >
                  <img
                    src={frame.dataUrl}
                    alt={`Frame at ${frame.timestamp.toFixed(1)}s`}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                    <p className="text-xs text-white">{frame.timestamp.toFixed(1)}s</p>
                  </div>
                  {frame.selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Generated Texts */}
        {texts && (
          <Card className="p-6 bg-purple-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5" />
              Textos Generados
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-purple-300 text-sm">Título corto (30 chars)</label>
                  <p className="text-white bg-purple-800/50 p-2 rounded">{texts.shortTitle}</p>
                </div>
                <div>
                  <label className="text-purple-300 text-sm">Descripción corta (80 chars)</label>
                  <p className="text-white bg-purple-800/50 p-2 rounded">{texts.shortDescription}</p>
                </div>
                <div>
                  <label className="text-purple-300 text-sm">Google Ads corto (30 chars)</label>
                  <p className="text-white bg-purple-800/50 p-2 rounded">{texts.googleAdsShort}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-purple-300 text-sm">Título largo (90 chars)</label>
                  <p className="text-white bg-purple-800/50 p-2 rounded">{texts.longTitle}</p>
                </div>
                <div>
                  <label className="text-purple-300 text-sm">Google Ads largo (90 chars)</label>
                  <p className="text-white bg-purple-800/50 p-2 rounded">{texts.googleAdsLong}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-purple-300 text-sm">Descripción completa</label>
              <pre className="text-white bg-purple-800/50 p-3 rounded text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {texts.fullDescription}
              </pre>
            </div>
          </Card>
        )}

        {/* Download Button */}
        {(frames.filter(f => f.selected).length > 0 || texts) && (
          <Button
            onClick={handleDownloadZip}
            size="lg"
            className="w-full py-6 text-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400"
          >
            <Download className="w-6 h-6 mr-3" />
            Descargar ZIP ({frames.filter(f => f.selected).length} capturas + textos)
          </Button>
        )}

        {/* Back link */}
        <div className="text-center">
          <a href="/" className="text-purple-300 hover:text-white transition-colors">
            ← Volver al juego
          </a>
        </div>
      </div>
    </div>
  );
}
