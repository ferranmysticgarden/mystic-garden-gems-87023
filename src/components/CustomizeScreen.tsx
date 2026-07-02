import { useMemo, useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X, ImageIcon, Loader2, Palette } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { processImageForTile, ImageProcessingError } from "@/utils/imageProcessing";
import { tileSkinStore } from "@/utils/tileSkinStore";
import { useTileSkin } from "@/hooks/useTileSkin";
import { TILE_TYPES } from "@/constants/tileTypes";
import { trackEvent } from "@/lib/trackEvent";
import { ThemeCard } from "@/components/themes/ThemeCard";
import { ThemeUnlockedModal } from "@/components/themes/ThemeUnlockedModal";
import { ThemePurchaseConfirmModal } from "@/components/themes/ThemePurchaseConfirmModal";
import { useUserThemes } from "@/hooks/useUserThemes";
import { THEME_MAP, THEME_TILE_MAP, type ThemeId } from "@/data/themes";
import { usePayment } from "@/hooks/usePayment";
import { useGameState } from "@/hooks/useGameState";

interface CustomizeScreenProps {
  onBack: () => void;
}


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
  const { gameState } = useGameState();
  const { themes, activeTheme, setActiveTheme, unlockTheme, isUnlocked } = useUserThemes();
  const { createPayment, loadingProduct } = usePayment();

  const skinMap = useTileSkin();
  const photos = TILE_TYPES.map((id) => skinMap[id]);
  const [processingIdx, setProcessingIdx] = useState<number | null>(null);
  const [recentUnlockedThemeId, setRecentUnlockedThemeId] = useState<ThemeId | null>(null);
  const [confirmThemeId, setConfirmThemeId] = useState<ThemeId | null>(null);
  const [confirmMode, setConfirmMode] = useState<'gems' | 'purchase'>('gems');

  useEffect(() => {
    trackEvent("customize_screen_opened");
    trackEvent("theme_screen_opened");
  }, []);

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
    const rawDataUrl = Capacitor.isNativePlatform() ? await pickPhotoNative() : await pickPhotoWeb();
    if (!rawDataUrl) return;

    setProcessingIdx(idx);
    try {
      const processed = await processImageForTile(rawDataUrl);
      tileSkinStore.setSkin(TILE_TYPES[idx], processed);
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
    tileSkinStore.setSkin(TILE_TYPES[idx], null);
  };

  const currentThemeDefinition = useMemo(() => THEME_MAP[activeTheme], [activeTheme]);

  const handleApplyTheme = (themeId: ThemeId) => {
    if (setActiveTheme(themeId)) {
      toast.success(`${t('themes.applied')}: ${t(THEME_MAP[themeId].nameKey)}`);
    }
  };

  const handleUnlockWithGems = async () => {
    if (!confirmThemeId) return;
    const theme = THEME_MAP[confirmThemeId];
    if (gameState.gems < (theme.gemPrice ?? 0)) {
      toast.error(t('themes.not_enough_gems'));
      return;
    }
    try {
      await unlockTheme(confirmThemeId, 'gems', `gems_${Date.now()}`);
      trackEvent('theme_unlocked', { theme_id: confirmThemeId, unlock_method: 'gems' });
      setRecentUnlockedThemeId(confirmThemeId);
      setConfirmThemeId(null);
    } catch (error: any) {
      toast.error(error?.message ?? t('themes.unlock_failed'));
    }
  };

  const handleUnlockWithPurchase = async () => {
    if (!confirmThemeId) return;
    const theme = THEME_MAP[confirmThemeId];
    if (!theme.productId) return;
    trackEvent('theme_purchase_started', { theme_id: confirmThemeId, product_id: theme.productId });
    await createPayment(theme.productId, 'theme_card');
    setConfirmThemeId(null);
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-10 relative z-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            {t("customize.title")}
          </h1>
          <div className="w-10" />
        </div>

        <div className="mb-8">
          <p className="text-center text-sm text-muted-foreground mb-4">{t("customize.subtitle")}</p>
          <div className="border bg-card/70 p-4" style={{ borderRadius: 8 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">{t('themes.current_theme')}</p>
                <p className="text-xs text-muted-foreground">{currentThemeDefinition.emoji} {t(currentThemeDefinition.nameKey)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleApplyTheme('flowers')}>{t('themes.reset')}</Button>
            </div>
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
                        <img src={photo} alt={`Foto slot ${idx + 1}`} className="w-full h-full object-cover" />
                        <span onClick={(e) => handleRemove(e, idx)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-7 h-7 flex items-center justify-center shadow-md" role="button" aria-label="Quitar foto">
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
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">{t("customize.hint")}</p>
        </div>

        <section>
          <p className="text-sm font-semibold mb-3">{t('themes.title')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((theme) => {
              const unlocked = isUnlocked(theme.id);
              return (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  unlocked={unlocked}
                  active={activeTheme === theme.id}
                  loading={loadingProduct === theme.productId}
                  onApply={() => handleApplyTheme(theme.id)}
                  onLockedClick={() => {
                    trackEvent('theme_locked_clicked', { theme_id: theme.id });
                    if (theme.tier === 'free') toast.info(`${t('themes.unlock_at_level')} ${theme.unlockLevel}`);
                  }}
                  onUnlockWithGems={theme.tier === 'premium' ? () => { setConfirmThemeId(theme.id); setConfirmMode('gems'); } : undefined}
                  onUnlockWithPurchase={theme.tier === 'premium' ? () => { setConfirmThemeId(theme.id); setConfirmMode('purchase'); } : undefined}
                />
              );
            })}
          </div>
        </section>
      </div>

      <ThemeUnlockedModal
        theme={recentUnlockedThemeId ? THEME_MAP[recentUnlockedThemeId] : null}
        open={!!recentUnlockedThemeId}
        onClose={() => setRecentUnlockedThemeId(null)}
        onUseNow={() => {
          if (recentUnlockedThemeId) handleApplyTheme(recentUnlockedThemeId);
          setRecentUnlockedThemeId(null);
        }}
      />

      <ThemePurchaseConfirmModal
        theme={confirmThemeId ? THEME_MAP[confirmThemeId] : null}
        open={!!confirmThemeId}
        mode={confirmMode}
        onCancel={() => setConfirmThemeId(null)}
        onConfirm={confirmMode === 'gems' ? handleUnlockWithGems : handleUnlockWithPurchase}
      />
    </div>
  );
};
