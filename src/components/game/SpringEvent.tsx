import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

interface SpringEventProps {
  onClose: () => void;
}

export const SpringEvent = ({ onClose }: SpringEventProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Event runs for 48 hours starting from a fixed point
    // For demo, we'll use a rolling 48h window
    const eventStart = new Date();
    eventStart.setHours(0, 0, 0, 0);
    const eventEnd = new Date(eventStart.getTime() + 48 * 60 * 60 * 1000);

    const checkEvent = () => {
      const now = Date.now();
      const remaining = eventEnd.getTime() - now;

      if (remaining <= 0) {
        setShow(false);
        return;
      }

      setShow(true);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      setTimeLeft(`${hours}h ${mins}m`);
    };

    checkEvent();
    const interval = setInterval(checkEvent, 60000);
    
    // Auto-show banner after delay
    const showTimer = setTimeout(() => {
      const hasSeenToday = localStorage.getItem('spring-event-seen');
      const today = new Date().toDateString();
      if (hasSeenToday !== today) {
        // Will be shown
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(showTimer);
    };
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    localStorage.setItem('spring-event-seen', new Date().toDateString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-b from-pink-900 via-rose-900 to-purple-900 rounded-3xl p-6 max-w-sm w-full border-4 border-pink-400 shadow-2xl overflow-hidden">
        {/* Floating petals */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              🌸
            </div>
          ))}
        </div>

        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🌸</span>
            <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
            <span className="text-3xl">🌺</span>
          </div>
          
          <h2 className="text-2xl font-bold text-pink-300 mb-1">
            Festival de Primavera Mística
          </h2>
          
          <div className="bg-pink-500/20 rounded-full px-4 py-1 inline-block mb-4">
            <p className="text-pink-200 text-sm font-semibold">
              ⏰ Termina en: {timeLeft}
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-pink-500/20 rounded-2xl p-4 mb-4 border border-pink-400/30">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 text-white">
                <span className="text-2xl">💎</span>
                <span className="text-lg font-semibold">Gemas por anuncios <span className="text-yellow-400 font-bold">x2</span></span>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-white">
                <span className="text-2xl">🎰</span>
                <span className="text-lg font-semibold">Lucky Spin: premios <span className="text-yellow-400 font-bold">+50%</span></span>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-white">
                <span className="text-2xl">🌸</span>
                <span className="text-lg font-semibold">Bonus diario <span className="text-yellow-400 font-bold">extra</span></span>
              </div>
            </div>
          </div>

          <p className="text-pink-200/80 text-sm mb-4">
            ¡Evento limitado! Las flores del jardín están en su máximo esplendor
          </p>

          <Button 
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-bold py-4 rounded-xl text-lg"
          >
            🌸 ¡A JUGAR! 🌸
          </Button>
        </div>
      </div>
    </div>
  );
};
