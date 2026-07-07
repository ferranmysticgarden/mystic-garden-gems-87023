/**
 * Mission progress tracker — persiste contadores diarios en localStorage.
 * DailyMissions.tsx los LEE; este módulo es el único WRITER.
 */
export type MissionKey = 'levels' | 'powerups' | 'ads';

const dayKey = () => new Date().toDateString();
const RESET_KEY_PREFIX = 'missions-day-';
const STORE_PREFIX = 'missions-';

const getUserId = (userId: string | null | undefined) => userId ?? 'guest';

const ensureFreshDay = (userId: string) => {
  try {
    const stored = localStorage.getItem(`${RESET_KEY_PREFIX}${userId}`);
    const today = dayKey();
    if (stored !== today) {
      // reset diario
      (['levels', 'powerups', 'ads'] as MissionKey[]).forEach((k) => {
        localStorage.setItem(`${STORE_PREFIX}${k}-${userId}`, '0');
      });
      localStorage.setItem(`${RESET_KEY_PREFIX}${userId}`, today);
    }
  } catch {}
};

export const incrementMission = (key: MissionKey, userId?: string | null) => {
  const uid = getUserId(userId);
  try {
    ensureFreshDay(uid);
    const storageKey = `${STORE_PREFIX}${key}-${uid}`;
    const current = parseInt(localStorage.getItem(storageKey) || '0', 10);
    const next = current + 1;
    localStorage.setItem(storageKey, String(next));
    // Notificar UI de misiones si está montada
    window.dispatchEvent(new CustomEvent('mission_progress', { detail: { key, value: next, userId: uid } }));
  } catch {}
};

export const getMissionCount = (key: MissionKey, userId?: string | null): number => {
  const uid = getUserId(userId);
  try {
    ensureFreshDay(uid);
    return parseInt(localStorage.getItem(`${STORE_PREFIX}${key}-${uid}`) || '0', 10);
  } catch {
    return 0;
  }
};
