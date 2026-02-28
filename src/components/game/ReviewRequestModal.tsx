import { useState, useEffect } from 'react';
import { Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

interface ReviewRequestModalProps {
  gamesPlayed: number;
}

export const ReviewRequestModal = ({ gamesPlayed }: ReviewRequestModalProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  const odId = user?.id || 'guest';

  useEffect(() => {
    const reviewAskedKey = `review-asked-${odId}`;
    const alreadyAsked = localStorage.getItem(reviewAskedKey);
    
    if (gamesPlayed >= 3 && !alreadyAsked) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(reviewAskedKey, 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gamesPlayed, odId]);

  const handleReview = () => {
    if (Capacitor.isNativePlatform()) {
      window.open('market://details?id=com.mysticgarden.game', '_system');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.mysticgarden.game', '_blank');
    }
    setShow(false);
  };

  const handleLater = () => {
    localStorage.removeItem(`review-asked-${odId}`);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-emerald-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" 
              style={{ animationDelay: `${star * 100}ms` }}
            />
          ))}
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-300 mb-3">
            ¿Te gusta Mystic Garden? 🌸
          </h2>
          
          <p className="text-emerald-100/80 text-sm leading-relaxed">
            Tu opinión nos ayuda a mejorar
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleReview}
            className="w-full py-5 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-yellow-300 shadow-lg"
          >
            <Star className="w-5 h-5 mr-2 fill-white" />
            Dejar reseña
          </Button>
          
          <Button
            onClick={handleLater}
            variant="outline"
            className="w-full py-4 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/20"
          >
            <Clock className="w-4 h-4 mr-2" />
            Más tarde
          </Button>
        </div>
      </div>
    </div>
  );
};
