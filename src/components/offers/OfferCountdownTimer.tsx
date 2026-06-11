import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { trackEvent } from '@/lib/trackEvent';

interface OfferCountdownTimerProps {
  /** Identifier for the offer type, used in tracking events. */
  offerType: string;
  /** Total countdown duration in seconds. Default 300 (5 min). */
  durationSeconds?: number;
  /** Fires when the timer hits zero. The host modal should auto-close. */
  onExpire: () => void;
  /** Optional extra className for the wrapper. */
  className?: string;
}

/**
 * 5-minute (configurable) countdown timer shared by all offer modals.
 *
 * - Pulses on every second during the LAST minute (≤60s).
 * - Calls onExpire exactly once when the timer reaches 0.
 * - Emits `offer_timer_started` on mount and `offer_timer_expired` on auto-close.
 *
 * NOTE: Hosts that want to track an in-time purchase should call
 *   trackEvent('offer_purchased_in_time', { offer_type, time_remaining })
 * inside their purchase success handler, reading time_remaining via a ref/state
 * they own. This component intentionally does not own the purchase flow.
 */
export const OfferCountdownTimer = ({
  offerType,
  durationSeconds = 300,
  onExpire,
  className = '',
}: OfferCountdownTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const expiredRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('offer_timer_started', {
      offer_type: offerType,
      time_remaining: durationSeconds,
    });
  }, [offerType, durationSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        trackEvent('offer_timer_expired', { offer_type: offerType });
        onExpire();
      }
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, offerType, onExpire]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isUrgent = secondsLeft <= 60;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 border-2 ${
        isUrgent
          ? 'bg-red-600/90 border-red-300 text-white animate-pulse'
          : 'bg-black/50 border-yellow-400/50 text-yellow-300'
      } ${className}`}
      role="timer"
      aria-live="polite"
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'animate-bounce' : ''}`} />
      <span className="font-mono font-bold text-lg">⏰ {display}</span>
    </div>
  );
};
