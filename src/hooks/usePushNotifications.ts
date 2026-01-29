import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

// Push notification types for strategic re-engagement
export type NotificationType = 
  | 'lives_full'
  | 'daily_bonus'
  | 'streak_reminder'
  | 'come_back'
  | 'special_event'
  | 'level_milestone';

interface NotificationConfig {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  delay?: number; // Delay in milliseconds
}

const NOTIFICATION_CONFIGS: Record<NotificationType, Omit<NotificationConfig, 'type'>> = {
  lives_full: {
    title: '❤️ ¡5 Vidas Listas!',
    body: '¡Tienes 5 vidas listas! No las desperdicies 🎮',
    icon: '/app-icon-512.png',
  },
  daily_bonus: {
    title: '🎁 ¡Bonus Diario Disponible!',
    body: 'Reclama tu recompensa diaria antes de que se acabe el día.',
    icon: '/app-icon-512.png',
  },
  streak_reminder: {
    title: '🔥 ¡URGENTE! Tu racha de {streak} días',
    body: '⚠️ Tu racha expira en 2 horas. ¡No pierdas {streak} días de progreso!',
    icon: '/app-icon-512.png',
  },
  come_back: {
    title: '🌸 ¡Te Echamos de Menos!',
    body: 'Hace {days} días que no juegas. ¡Vuelve por 50 gemas gratis!',
    icon: '/app-icon-512.png',
  },
  special_event: {
    title: '⭐ ¡Evento Especial!',
    body: '¡Doble de gemas este fin de semana! No te lo pierdas.',
    icon: '/app-icon-512.png',
  },
  level_milestone: {
    title: '🏆 ¡Casi Lo Logras!',
    body: 'Estás a {levels} niveles de tu próxima recompensa especial.',
    icon: '/app-icon-512.png',
  },
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((type: NotificationType, params?: Record<string, string | number>) => {
    if (!isSupported || permission !== 'granted') return;

    const config = NOTIFICATION_CONFIGS[type];
    let body = config.body;

    // Replace placeholders with params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        body = body.replace(`{${key}}`, String(value));
      });
    }

    try {
      new Notification(config.title, {
        body,
        icon: config.icon,
        badge: '/app-icon-512.png',
        tag: type, // Prevents duplicate notifications
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [isSupported, permission]);

  const scheduleNotification = useCallback((type: NotificationType, delayMs: number, params?: Record<string, string | number>) => {
    if (!isSupported) return;

    const timeoutId = setTimeout(() => {
      sendNotification(type, params);
    }, delayMs);

    return timeoutId;
  }, [isSupported, sendNotification]);

  // Schedule "lives full" notification when lives start regenerating
  const scheduleLivesFullNotification = useCallback((minutesUntilFull: number) => {
    if (minutesUntilFull <= 0) return;

    const delayMs = minutesUntilFull * 60 * 1000;
    return scheduleNotification('lives_full', delayMs);
  }, [scheduleNotification]);

  // Schedule daily bonus reminder for next day
  const scheduleDailyBonusReminder = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10 AM next day

    const delayMs = tomorrow.getTime() - now.getTime();
    return scheduleNotification('daily_bonus', delayMs);
  }, [scheduleNotification]);

  // Schedule streak reminder for prime time (20:00-21:00) with urgency
  const scheduleStreakReminder = useCallback((currentStreak: number) => {
    const now = new Date();
    
    // Schedule for 20:30 (peak mobile gaming time)
    const reminderTime = new Date(now);
    reminderTime.setHours(20, 30, 0, 0);

    // If already past 20:30, schedule for 21:30 as fallback
    if (reminderTime <= now) {
      reminderTime.setHours(21, 30, 0, 0);
    }
    
    // If still past, don't schedule
    if (reminderTime <= now) return;

    const delayMs = reminderTime.getTime() - now.getTime();
    return scheduleNotification('streak_reminder', delayMs, { streak: currentStreak });
  }, [scheduleNotification]);
  
  // Send immediate notification when lives are full
  const sendLivesFullNotification = useCallback(() => {
    sendNotification('lives_full');
  }, [sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
    scheduleLivesFullNotification,
    scheduleDailyBonusReminder,
    scheduleStreakReminder,
    sendLivesFullNotification,
  };
};
