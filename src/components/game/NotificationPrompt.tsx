import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPromptProps {
  onClose: () => void;
  levelsCompleted?: number;
}

/**
 * Optimized notification prompt - appears after level 2-3 victory
 * (emotional high = higher acceptance rate, typically 60-70% vs 30% on cold start)
 */
export const NotificationPrompt = ({ onClose, levelsCompleted = 0 }: NotificationPromptProps) => {
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id || !isSupported || permission !== 'default') {
      return;
    }

    // Check if we've already asked
    const hasAsked = localStorage.getItem(`notification-asked-${user.id}`);
    if (hasAsked) return;

    // Only show after completing 2+ levels (user has experienced value)
    if (levelsCompleted < 2) return;

    // Short delay after level completion for natural feel
    const timer = setTimeout(() => {
      setShow(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [user?.id, isSupported, permission, levelsCompleted]);

  const handleAllow = async () => {
    await requestPermission();
    if (user?.id) {
      localStorage.setItem(`notification-asked-${user.id}`, 'true');
    }
    setShow(false);
    onClose();
  };

  const handleDeny = () => {
    if (user?.id) {
      // Allow re-asking after 3 days if denied
      localStorage.setItem(`notification-asked-${user.id}`, Date.now().toString());
    }
    setShow(false);
    onClose();
  };

  // Re-ask logic: if denied more than 3 days ago, allow showing again
  useEffect(() => {
    if (!user?.id || !isSupported || permission !== 'default') return;
    const askedTimestamp = localStorage.getItem(`notification-asked-${user.id}`);
    if (askedTimestamp && askedTimestamp !== 'true') {
      const daysSince = (Date.now() - parseInt(askedTimestamp)) / (1000 * 60 * 60 * 24);
      if (daysSince > 3 && levelsCompleted >= 2) {
        setTimeout(() => setShow(true), 2000);
      }
    }
  }, [user?.id, isSupported, permission, levelsCompleted]);

  if (!show || !isSupported || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-4 border-2 border-purple-400/50 shadow-2xl max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="bg-purple-500/30 rounded-full p-3 animate-pulse">
            <Bell className="w-6 h-6 text-purple-300" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              🎮 ¡Vas genial!
            </h3>
            <p className="text-purple-200/80 text-sm mb-3">
              Activa las alertas para saber cuándo tus <strong className="text-green-300">vidas están llenas</strong> y no perder tu <strong className="text-yellow-300">racha diaria</strong> 🔥
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAllow}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold"
              >
                ✅ Sí, activar
              </Button>
              <Button
                onClick={handleDeny}
                size="sm"
                variant="ghost"
                className="text-purple-300 hover:text-white hover:bg-purple-500/20"
              >
                Luego
              </Button>
            </div>
          </div>

          <button onClick={handleDeny} className="text-purple-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
