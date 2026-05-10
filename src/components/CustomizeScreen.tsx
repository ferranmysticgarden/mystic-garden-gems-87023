import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { processImageForTile, ImageProcessingError } from "@/utils/imageProcessing";

interface CustomizeScreenProps {
  onBack: () => void;
}

// Mismos 6 tipos que TILE_TYPES en Board.tsx
const TILE_EMOJIS = ["🌸", "🌺", "🌼", "🍃", "🌻", "🌷"];

// Paleta coherente con el tema "Mystic Garden" pero distinguible
const SLOT_BORDERS = [
  "border-rose-500 shadow-[0_0_18px_-4px_rgba(244,63,94,0.7)]",
  "border-sky-500 shadow-[0_0_18px_-4px_rgba(14,165,233,0.7)]",
  "border-emerald-500 shadow-[0_0_18px_-4px_rgba(16,185,129,0.7)]",
  "border-amber-400 shadow-[0_0_18px_-4px_rgba(251,191,36,0.7)]",
  "border-violet-500 shadow-[0_0_18px_-4px_rgba(139,92,246,0.7)]",
  "border-orange-500 shadow-[0_0_18px_-4px_rgba(249,115,22,0.7)]",
];

export const CustomizeScreen = ({ onBack }: CustomizeScreenProps) => {
  const { t } = useLanguage();
  // Estado temporal (FASE E añadirá persistencia)
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [processingIdx, setProcessingIdx] = useState<number | null>(null);

  const pickPhotoNative = async (): Promise<string | null> => {
    try {
      const result = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl,
        quality: 80,
        allowEditing: false,
      });
      return result.dataUrl ?? null;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.toLowerCase().includes("cancel")) return null;
      toast.error(t("customize.permissionDenied"));
      return null;
    }
  };

  const pickPhotoWeb = (): Promise<string | null> =>
    new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });

  const handleSlotClick = async (idx: number) => {
    if (processingIdx !== null) return;
    if (photos[idx]) {
      const change = window.confirm(t("customize.changeOrKeep"));
      if (!change) return;
    }
    const rawDataUrl = Capacitor.isNativePlatform()
      ? await pickPhotoNative()
      : await pickPhotoWeb();
    if (!rawDataUrl) return;

    setProcessingIdx(idx);
    try {
      const t0 = performance.now();
      const processed = await processImageForTile(rawDataUrl);
      const dt = Math.round(performance.now() - t0);
      // Útil en debug: ver tiempo en consola
      console.log(`[customize] processed slot ${idx} in ${dt}ms`);
      setPhotos((prev) => {
        const next = [...prev];
        next[idx] = processed;
        return next;
      });
    } catch (err) {
      if (err instanceof ImageProcessingError) {
        if (err.code === "TOO_LARGE") toast.error(t("customize.errorTooLarge"));
        else if (err.code === "LOAD_FAILED") toast.error(t("customize.errorLoad"));
        else toast.error(t("customize.errorFormat"));
      } else {
        toast.error(t("customize.errorGeneric"));
      }
    } finally {
      setProcessingIdx(null);
    }
  };

  const handleRemove = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (processingIdx === idx) return;
    setPhotos((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 relative z-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            {t("customize.title")}
          </h1>
          <div className="w-10" />
        </div>

        <p className="text-center text-sm text-muted-foreground mb-6">
          {t("customize.subtitle")}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TILE_EMOJIS.map((emoji, idx) => {
            const photo = photos[idx];
            const isProcessing = processingIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => handleSlotClick(idx)}
                disabled={processingIdx !== null && !isProcessing}
                className={`relative aspect-square rounded-2xl border-[6px] ${SLOT_BORDERS[idx]} bg-card overflow-hidden flex items-center justify-center transition-transform active:scale-95 disabled:opacity-60`}
                aria-label={`Slot ${idx + 1}`}
              >
                {photo ? (
                  <>
                    <img
                      src={photo}
                      alt={`Foto slot ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span
                      onClick={(e) => handleRemove(e, idx)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center shadow-md"
                      role="button"
                      aria-label="Quitar foto"
                    >
                      <X className="w-4 h-4" />
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-5xl opacity-80">{emoji}</span>
                    <span className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                      <Plus className="w-5 h-5" />
                    </span>
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("customize.hint")}
        </p>
      </div>
    </div>
  );
};
