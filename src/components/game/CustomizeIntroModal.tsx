/**
 * CAMBIO 2 — Modal que se muestra UNA SOLA VEZ tras ganar el nivel 1.
 * Promueve la pantalla de personalizar fotos.
 */
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { trackEvent } from '@/lib/trackEvent';
import { Sparkles, X } from 'lucide-react';

interface Props {
  onAccept: () => void;
  onDismiss: () => void;
}

export const CustomizeIntroModal = ({ onAccept, onDismiss }: Props) => {
  const { t } = useLanguage();

  const t2 = (k: string, fallback: string) => {
    const v = t(k);
    return !v || v === k ? fallback : v;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 animate-fade-in p-4">
      <div className="relative max-w-sm w-full gradient-card rounded-3xl p-6 border-2 border-accent/50 shadow-card animate-scale-in">
        <button
          onClick={() => { trackEvent('customize_intro_dismissed', {}); onDismiss(); }}
          className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-6xl mb-3">✨📸</div>
          <h2 className="text-2xl font-bold text-gold mb-2">
            {t2('customize_intro.title', '¿Sabías que puedes poner TUS fotos en el tablero?')}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {t2('customize_intro.body', 'Sustituye las flores por fotos de tu familia, mascotas o lo que quieras. ¡Es gratis!')}
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => { trackEvent('customize_intro_accepted', {}); onAccept(); }}
              className="w-full gradient-gold shadow-gold text-base py-5"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t2('customize_intro.accept', '¡Sí, mostrar cómo!')}
            </Button>
            <button
              onClick={() => { trackEvent('customize_intro_dismissed', {}); onDismiss(); }}
              className="w-full text-sm text-muted-foreground/70 hover:text-muted-foreground py-2"
            >
              {t2('customize_intro.later', 'Más tarde')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
