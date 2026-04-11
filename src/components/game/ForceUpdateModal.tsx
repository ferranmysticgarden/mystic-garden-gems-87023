import { useLanguage } from "@/hooks/useLanguage";
import { Browser } from "@capacitor/browser";
import { Download, ShieldAlert } from "lucide-react";

interface ForceUpdateModalProps {
  playStoreUrl: string;
  updateMessage?: string | null;
  currentVersion: number;
  requiredVersion: number;
}

/**
 * Full-screen blocking modal shown when the native app version
 * is too old and must be updated from Google Play.
 *
 * This modal has NO close button — the user MUST update.
 */
export const ForceUpdateModal = ({
  playStoreUrl,
  updateMessage,
  currentVersion,
  requiredVersion,
}: ForceUpdateModalProps) => {
  const { t } = useLanguage();

  const handleUpdate = async () => {
    try {
      await Browser.open({ url: playStoreUrl });
    } catch {
      // Fallback: open in webview
      window.open(playStoreUrl, '_system');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="mx-4 max-w-sm w-full rounded-2xl bg-card border border-border p-8 text-center shadow-2xl">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="h-10 w-10 text-primary" />
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">
          {t('update_required_title') !== 'update_required_title'
            ? t('update_required_title')
            : '¡Actualización necesaria!'}
        </h2>

        {/* Message */}
        <p className="mb-6 text-muted-foreground leading-relaxed">
          {updateMessage || (
            t('update_required_message') !== 'update_required_message'
              ? t('update_required_message')
              : 'Hay una nueva versión con mejoras importantes. Actualiza desde Google Play para seguir jugando.'
          )}
        </p>

        {/* Version info (small) */}
        <p className="mb-6 text-xs text-muted-foreground/60">
          Tu versión: {currentVersion} · Mínima: {requiredVersion}
        </p>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Download className="h-5 w-5" />
          {t('update_now') !== 'update_now' ? t('update_now') : 'Actualizar ahora'}
        </button>
      </div>
    </div>
  );
};
