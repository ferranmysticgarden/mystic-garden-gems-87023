import { useState, useEffect } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface MotivationalMessageProps {
  levelsCompleted: number;
  onClose: () => void;
}

const MESSAGES = [
  {
    title: '¡Vas genial! 🌟',
    subtitle: 'Ya dominas el juego',
    body: 'Cada nivel que completas demuestra tu habilidad. ¡Sigue así!',
    emoji: '🌸',
  },
  {
    title: '¡Eres increíble! ✨',
    subtitle: 'Tu progreso es impresionante',
    body: 'Pocas personas llegan tan lejos tan rápido. ¡Tienes talento natural!',
    emoji: '🌺',
  },
  {
    title: '¡Qué ritmo! 🔥',
    subtitle: 'Estás en racha',
    body: 'Los siguientes niveles tienen sorpresas especiales para ti.',
    emoji: '🌼',
  },
];

export const MotivationalMessage = ({ levelsCompleted, onClose }: MotivationalMessageProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]);

  useEffect(() => {
    if (!user?.id) return;

    // Show after completing levels 3 or 4
    if (levelsCompleted !== 3 && levelsCompleted !== 4) return;

    const key = `motivational-message-${levelsCompleted}-${user.id}`;
    const alreadyShown = localStorage.getItem(key);

    if (!alreadyShown) {
      // Random message
      setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(key, 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [levelsCompleted, user?.id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-purple-900/95 via-indigo-900/95 to-blue-900/95 rounded-3xl p-6 max-w-sm w-full border-2 border-purple-400/40 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Icon */}
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <span className="text-6xl">{message.emoji}</span>
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 absolute -bottom-1 -left-1 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-200 mb-2">
            {message.title}
          </h2>
          <p className="text-lg text-purple-300 mb-3">
            {message.subtitle}
          </p>
          <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-400/30">
            <p className="text-purple-100 leading-relaxed">
              {message.body}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((level) => (
            <div 
              key={level}
              className={`w-3 h-3 rounded-full transition-all ${
                level <= levelsCompleted 
                  ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' 
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <Button
          onClick={() => {
            setShow(false);
            onClose();
          }}
          className="w-full py-5 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-2 border-purple-300 shadow-lg transform hover:scale-105 transition-all active:scale-95"
        >
          💪 ¡A por más!
        </Button>
      </div>
    </div>
  );
};
