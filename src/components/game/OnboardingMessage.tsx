import { useState, useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingMessageProps {
  levelId: number;
  onDismiss: () => void;
}

export const OnboardingMessage = ({ levelId, onDismiss }: OnboardingMessageProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show for level 1
    if (levelId !== 1) return;

    const key = 'onboarding-level1-shown';
    const alreadyShown = localStorage.getItem(key);
    
    if (!alreadyShown) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(key, 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [levelId]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-teal-900/95 via-emerald-900/95 to-green-900/95 rounded-3xl p-6 max-w-sm w-full border-2 border-emerald-400/40 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Icon */}
        <div className="text-center mb-4">
          <div className="relative inline-block">
            <Heart className="w-16 h-16 text-pink-400 mx-auto animate-pulse fill-pink-400" />
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>

        {/* Calming message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-300 mb-3">
            ¡Bienvenido! 🌸
          </h2>
          <p className="text-emerald-100 text-lg mb-4 leading-relaxed">
            Este es tu primer nivel.
          </p>
          <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-400/30">
            <p className="text-yellow-300 font-semibold text-lg mb-2">
              ✨ Relájate y disfruta ✨
            </p>
            <p className="text-emerald-200 text-sm">
              No puedes perder este nivel.<br/>
              Tómate tu tiempo para aprender.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-white/5 rounded-xl p-3 mb-6">
          <p className="text-emerald-300 text-sm text-center">
            💡 Conecta 3 o más flores iguales
          </p>
        </div>

        {/* CTA */}
        <Button
          onClick={() => {
            setShow(false);
            onDismiss();
          }}
          className="w-full py-5 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-300 shadow-lg transform hover:scale-105 transition-all active:scale-95"
        >
          🌺 ¡Empezar!
        </Button>
      </div>
    </div>
  );
};
