import { useState, useEffect } from 'react';
import { Star, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

interface ReviewRequestModalProps {
  gamesPlayed: number;
}

export const ReviewRequestModal = ({ gamesPlayed }: ReviewRequestModalProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    const reviewAskedKey = `review-asked-${user.id}`;
    const alreadyAsked = localStorage.getItem(reviewAskedKey);
    
    // Show after 3 games, only once
    if (gamesPlayed >= 3 && !alreadyAsked) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(reviewAskedKey, 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gamesPlayed, user?.id]);

  const handleReview = () => {
    // Open Play Store for review
    if (Capacitor.isNativePlatform()) {
      window.open('market://details?id=com.mysticgarden.game', '_system');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.mysticgarden.game', '_blank');
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-emerald-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button 
            onClick={handleDismiss} 
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" 
                style={{ animationDelay: `${star * 100}ms` }}
              />
            ))}
          </div>
          
          <h2 className="text-2xl font-bold text-emerald-300 mb-3">
            ¿Te gusta Mystic Garden? 🌸
          </h2>
          
          <p className="text-emerald-100/80 text-sm leading-relaxed">
            Una reseña nos ayuda muchísimo a seguir mejorando el juego.
            <br />
            <span className="text-yellow-300">¡Solo toma 30 segundos!</span>
          </p>
        </div>

        {/* Hearts decoration */}
        <div className="flex justify-center gap-2 mb-6">
          <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-bounce" />
          <Heart className="w-6 h-6 text-red-400 fill-red-400 animate-bounce" style={{ animationDelay: '100ms' }} />
          <Heart className="w-5 h-5 text-pink-400 fill-pink-400 animate-bounce" style={{ animationDelay: '200ms' }} />
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleReview}
            className="w-full py-5 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-yellow-300 shadow-lg"
          >
            <Star className="w-5 h-5 mr-2 fill-white" />
            ¡Dejar una Reseña!
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-full text-emerald-300/70 hover:text-emerald-300"
          >
            Ahora no, gracias
          </Button>
        </div>

        <p className="text-center text-emerald-300/40 text-xs mt-4">
          🙏 Gracias por jugar
        </p>
      </div>
    </div>
  );
};
