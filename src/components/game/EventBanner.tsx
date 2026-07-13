import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { getCurrentEvent, getEventSecondsLeft } from '@/data/events';
import { trackEvent } from '@/lib/trackEvent';

const formatDuration = (totalSec: number): string => {
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const EventBanner = () => {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => new Date());
  const event = useMemo(() => getCurrentEvent(now), [now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!event) return;
    try {
      const key = `event_shown_${event.id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        trackEvent('event_active_shown', {
          event_id: event.id,
          event_type: event.type,
          multiplier: event.multiplier,
        });
      }
    } catch { /* ignore */ }
  }, [event]);

  if (!event) return null;

  const secondsLeft = getEventSecondsLeft(now);

  return (
    <div
      className="w-full mx-auto max-w-md px-3 py-2 mb-3 flex items-center gap-3 border-2 border-yellow-400/60 shadow-lg animate-fade-in"
      style={{
        borderRadius: 12,
        background: 'linear-gradient(90deg, hsl(45 90% 50% / 0.25), hsl(320 80% 55% / 0.25))',
        boxShadow: '0 0 25px rgba(255,215,0,0.35)',
      }}
    >
      <span className="text-3xl animate-bounce" style={{ animationDuration: '1.6s' }}>{event.icon}</span>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold text-yellow-200 truncate">{t(event.nameKey)}</p>
        <p className="text-[11px] text-yellow-100/80 truncate">{t(event.descKey)}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-yellow-200/70 uppercase tracking-wide">{t('events.ends_in')}</p>
        <p className="text-sm font-bold tabular-nums text-white">{formatDuration(secondsLeft)}</p>
      </div>
    </div>
  );
};
