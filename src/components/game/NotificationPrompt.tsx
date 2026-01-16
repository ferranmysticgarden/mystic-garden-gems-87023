import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPromptProps {
  onClose: () => void;
}

export const NotificationPrompt = ({ onClose }: NotificationPromptProps) => {
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

    // Show prompt after a delay (let user play first)
    const timer = setTimeout(() => {
      setShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [user?.id, isSupported, permission]);

  const handleAllow = async () => {
    const granted = await requestPermission();
    if (user?.id) {
      localStorage.setItem(`notification-asked-${user.id}`, 'true');
    }
    setShow(false);
    onClose();
  };

  const handleDeny = () => {
    if (user?.id) {
      localStorage.setItem(`notification-asked-${user.id}`, 'true');
    }
    setShow(false);
    onClose();
  };

  if (!show || !isSupported || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-4 border-2 border-purple-400/50 shadow-2xl max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="bg-purple-500/30 rounded-full p-3">
            <Bell className="w-6 h-6 text-purple-300" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              🔔 ¡No Te Pierdas Nada!
            </h3>
            <p className="text-purple-200/80 text-sm mb-3">
              Recibe alertas cuando tus vidas estén llenas, bonus diarios y ofertas especiales.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAllow}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Activar
              </Button>
              <Button
                onClick={handleDeny}
                size="sm"
                variant="ghost"
                className="text-purple-300 hover:text-white hover:bg-purple-500/20"
              >
                Ahora no
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
