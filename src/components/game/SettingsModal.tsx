import { X, Globe, Bell, Volume2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { AudioControls } from '@/components/game/AudioControls';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/trackEvent';

interface Props {
  onClose: () => void;
}

const LANGS: Array<{ code: 'es' | 'en' | 'pt'; label: string; flag: string }> = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

export const SettingsModal = ({ onClose }: Props) => {
  const { t, language, setLanguage } = useLanguage();
  const { isSupported, permission, requestPermission } = usePushNotifications();

  const handleLangChange = (code: 'es' | 'en' | 'pt') => {
    if (code === language) return;
    setLanguage(code);
    trackEvent('language_changed', { from: language, to: code });
  };

  const handleNotifClick = async () => {
    if (!isSupported) return;
    if (permission === 'default') {
      const ok = await requestPermission();
      trackEvent('notifications_toggle', { granted: ok });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 rounded-3xl p-6 max-w-sm w-full border-2 border-purple-400/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t('settings.close') || 'Cerrar'}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-center text-white mb-5">
          ⚙️ {t('settings.title') || 'Ajustes'}
        </h2>

        {/* Idioma */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2 text-white/90">
            <Globe className="w-4 h-4" />
            <span className="font-semibold">{t('settings.language') || 'Idioma'}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                className={`p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                  language === l.code
                    ? 'bg-purple-500/40 border-yellow-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl mb-1">{l.flag}</div>
                {l.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sonido */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-2 text-white/90">
            <Volume2 className="w-4 h-4" />
            <span className="font-semibold">{t('settings.sound') || 'Sonido'}</span>
          </div>
          <div className="flex justify-center bg-white/5 rounded-xl p-3">
            <AudioControls />
          </div>
        </section>

        {/* Notificaciones */}
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-white/90">
            <Bell className="w-4 h-4" />
            <span className="font-semibold">{t('settings.notifications') || 'Notificaciones'}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-sm text-white/80">
            {!isSupported ? (
              <p className="text-white/50">{t('settings.notif_unsupported') || 'No disponible en este dispositivo'}</p>
            ) : permission === 'granted' ? (
              <p className="text-emerald-400 font-semibold">✅ {t('settings.notif_on') || 'Activadas'}</p>
            ) : permission === 'denied' ? (
              <p className="text-red-300">{t('settings.notif_denied') || 'Bloqueadas — actívalas en los ajustes del sistema'}</p>
            ) : (
              <Button onClick={handleNotifClick} size="sm" className="w-full">
                {t('settings.notif_enable') || 'Activar notificaciones'}
              </Button>
            )}
          </div>
        </section>

        <Button onClick={onClose} className="w-full" variant="outline">
          {t('settings.close') || 'Cerrar'}
        </Button>
      </div>
    </div>
  );
};
