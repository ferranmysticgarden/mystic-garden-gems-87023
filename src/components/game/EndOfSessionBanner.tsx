/**
 * CAMBIO 10 — Banner inferior tipo Zeigarnik tras volver al menú desde una partida.
 * Rota entre 3 mensajes según contexto: piggy / vidas / streak.
 */
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/trackEvent';
import { X } from 'lucide-react';

interface Props {
  piggyAmount: number;
  piggyCap: number;
  lives: number;
  timeUntilNextLifeSec: number;
  currentStreak: number;
  onDismiss: () => void;
}

const fmtTime = (s: number) => {
  if (s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

export const EndOfSessionBanner = ({
  piggyAmount, piggyCap, lives, timeUntilNextLifeSec, currentStreak, onDismiss,
}: Props) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  let type: 'piggy' | 'lives' | 'streak' = 'streak';
  let message = '';
  if (lives === 0 && timeUntilNextLifeSec > 0) {
    type = 'lives';
    message = `⏰ Próxima vida en ${fmtTime(Math.max(0, timeUntilNextLifeSec - tick))}`;
  } else if (piggyAmount > 0 && piggyAmount < piggyCap) {
    type = 'piggy';
    message = `🐷 Tu hucha tiene ${piggyAmount}/${piggyCap} gemas — sigue jugando para llenarla`;
  } else {
    type = 'streak';
    message = currentStreak > 0
      ? `🔥 Racha de ${currentStreak} días — vuelve mañana para no perderla`
      : '🎁 Te esperan recompensas diarias mañana';
  }

  useEffect(() => {
    trackEvent('end_of_session_hook_shown', { type });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed bottom-4 inset-x-4 z-40 flex justify-center animate-fade-in pointer-events-auto">
      <div className="max-w-md w-full bg-card/95 backdrop-blur border border-accent/40 rounded-2xl px-4 py-3 shadow-card flex items-center gap-3">
        <p className="flex-1 text-sm text-foreground">{message}</p>
        <button
          onClick={onDismiss}
          className="text-muted-foreground/60 hover:text-muted-foreground"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
