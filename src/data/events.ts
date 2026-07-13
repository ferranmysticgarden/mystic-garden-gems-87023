// FEATURE 3 — Sistema de eventos temporales.
// Doble gemas se activa automáticamente cada fin de semana (Vie 00:00 → Dom 23:59
// hora local del dispositivo). Otros eventos se listan manualmente en MANUAL_EVENTS.

export type EventType = 'double_gems' | 'fairy_week';

export interface GameEvent {
  id: string;
  type: EventType;
  startsAt: Date;
  endsAt: Date;
  nameKey: string;
  descKey: string;
  multiplier: number; // multiplicador aplicado a gemas de recompensa
  icon: string;
}

/** Eventos programados manualmente. Descomentar/añadir para activar. */
export const MANUAL_EVENTS: GameEvent[] = [
  // Ejemplo Semana del Hada:
  // {
  //   id: 'fairy_week_2026_08_10',
  //   type: 'fairy_week',
  //   startsAt: new Date('2026-08-10T00:00:00'),
  //   endsAt:   new Date('2026-08-16T23:59:59'),
  //   nameKey: 'events.fairy_week.name',
  //   descKey: 'events.fairy_week.desc',
  //   multiplier: 2,
  //   icon: '🧚',
  // },
];

/** Genera el evento "Doble gemas" para el fin de semana que contiene `now`. */
const buildWeekendDoubleGems = (now: Date): GameEvent | null => {
  const day = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const isWeekend = day === 5 || day === 6 || day === 0;
  if (!isWeekend) return null;

  const friday = new Date(now);
  // Retroceder hasta viernes 00:00
  const back = day === 5 ? 0 : day === 6 ? 1 : 2; // Sun → 2 días atrás
  friday.setDate(now.getDate() - back);
  friday.setHours(0, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  const iso = friday.toISOString().slice(0, 10);
  return {
    id: `weekend_double_gems_${iso}`,
    type: 'double_gems',
    startsAt: friday,
    endsAt: sunday,
    nameKey: 'events.double_gems.name',
    descKey: 'events.double_gems.desc',
    multiplier: 2,
    icon: '💎',
  };
};

/** Devuelve el evento activo con mayor prioridad, o null si no hay ninguno.
 *  Prioridad: manuales antes que el weekend auto (permite override). */
export const getCurrentEvent = (now: Date = new Date()): GameEvent | null => {
  for (const ev of MANUAL_EVENTS) {
    if (now >= ev.startsAt && now <= ev.endsAt) return ev;
  }
  const weekend = buildWeekendDoubleGems(now);
  if (weekend && now >= weekend.startsAt && now <= weekend.endsAt) return weekend;
  return null;
};

/** Multiplicador global de recompensas de gemas. 1 si no hay evento. */
export const getRewardMultiplier = (now: Date = new Date()): number => {
  return getCurrentEvent(now)?.multiplier ?? 1;
};

/** Segundos restantes al evento activo, o 0 si no hay. */
export const getEventSecondsLeft = (now: Date = new Date()): number => {
  const ev = getCurrentEvent(now);
  if (!ev) return 0;
  return Math.max(0, Math.floor((ev.endsAt.getTime() - now.getTime()) / 1000));
};
