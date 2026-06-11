// T11 — Promo banner highlighting the photo-tile customization feature.
// Compact card meant to render at the top of the shop or menu.

import { X, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { LS_KEYS } from "@/constants/localStorageKeys";
import { trackEvent } from "@/lib/trackEvent";

interface PhotoFeatureBannerProps {
  onCta: () => void;
}

export const PhotoFeatureBanner = ({ onCta }: PhotoFeatureBannerProps) => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_KEYS.PHOTO_FEATURE_BANNER_DISMISSED);
      setDismissed(v === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(LS_KEYS.PHOTO_FEATURE_BANNER_DISMISSED, "1");
    } catch {/* ignore */}
    setDismissed(true);
    trackEvent("photo_banner_dismissed", {});
  };

  const handleCta = () => {
    trackEvent("photo_banner_cta_clicked", {});
    onCta();
  };

  return (
    <div className="relative mb-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 p-3 border border-pink-300 shadow-lg">
      <button
        onClick={handleDismiss}
        aria-label="Cerrar"
        className="absolute top-1 right-1 text-white/60 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
      <button
        onClick={handleCta}
        className="flex items-center gap-3 w-full text-left pr-5"
      >
        <Camera className="w-8 h-8 text-white" />
        <div>
          <p className="text-white font-bold text-sm">📸 Juega con TUS fotos</p>
          <p className="text-pink-100 text-xs">Convierte el tablero en tus recuerdos. Toca para personalizar.</p>
        </div>
      </button>
    </div>
  );
};
