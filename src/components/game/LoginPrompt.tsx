import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { X, Shield, Cloud, Gift } from 'lucide-react';
import { AuthPage } from '@/components/AuthPage';
import { signInWithGoogleNative, signInWithGoogleWeb } from '@/lib/googleAuth';
import { toast } from 'sonner';

interface LoginPromptProps {
  reason: 'purchase' | 'save_progress' | 'general';
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Prompt suave de login — NO bloquea el juego.
 * Solo aparece cuando el usuario necesita autenticarse
 * (comprar, guardar progreso en la nube, etc.)
 */
export const LoginPrompt = ({ reason, onClose, onSuccess }: LoginPromptProps) => {
  const [showAuth, setShowAuth] = useState(false);

  const reasons = {
    purchase: {
      icon: '💳',
      title: '¡Inicia sesión para comprar!',
      subtitle: 'Necesitas una cuenta para procesar el pago de forma segura.',
    },
    save_progress: {
      icon: '☁️',
      title: '¿Guardar tu progreso?',
      subtitle: 'Crea una cuenta para no perder tu avance si cambias de dispositivo.',
    },
    general: {
      icon: '🌸',
      title: 'Crea tu cuenta',
      subtitle: 'Guarda progreso, compra items y accede desde cualquier dispositivo.',
    },
  };

  const { icon, title, subtitle } = reasons[reason];

  if (showAuth) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 animate-fade-in">
        <div className="relative w-full max-w-sm mx-4">
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <AuthPage onAuthSuccess={onSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-6 max-w-sm mx-4 border-2 border-purple-400/50 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/50 hover:text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-5xl mb-3">{icon}</div>
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-purple-300/90 text-sm mb-5">{subtitle}</p>

          <div className="space-y-2 mb-5 text-left">
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Progreso guardado en la nube</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <Shield className="w-4 h-4 text-green-400 shrink-0" />
              <span>Compras seguras</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Recompensas exclusivas</span>
            </div>
          </div>

          <Button
            onClick={() => setShowAuth(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-5 rounded-xl text-lg"
          >
            Crear cuenta / Iniciar sesión
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-3 text-base py-5"
            onClick={async () => {
              try {
                if (Capacitor.isNativePlatform()) {
                  await signInWithGoogleNative('select_account');
                } else {
                  await signInWithGoogleWeb('/', 'select_account');
                }
              } catch (error: any) {
                toast.error(error.message || 'Error al iniciar sesión con Google');
              }
            }}
          >
            Continuar con Google
          </Button>

          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/50 text-xs mt-4 transition-colors block mx-auto"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};
