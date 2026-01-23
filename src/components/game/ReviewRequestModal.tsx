import { useState, useEffect } from 'react';
import { Star, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

interface ReviewRequestModalProps {
  /** Number of distinct days played */
  daysPlayed: number;
  /** Current streak (positive = on a roll) */
  currentStreak: number;
  /** Whether user just won without using power-ups */
  justWonClean: boolean;
  /** Callback when user responds */
  onRespond?: () => void;
}

const STORAGE_KEY_NEVER_SHOW = 'review-never-show';
const STORAGE_KEY_LATER = 'review-ask-later';

export const ReviewRequestModal = ({ 
  daysPlayed, 
  currentStreak, 
  justWonClean,
  onRespond 
}: ReviewRequestModalProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    // Check if user said "never show again"
    const neverShow = localStorage.getItem(`${STORAGE_KEY_NEVER_SHOW}-${user.id}`);
    if (neverShow === 'true') return;
    
    // Check if user said "later" recently (wait 3 more days)
    const laterDate = localStorage.getItem(`${STORAGE_KEY_LATER}-${user.id}`);
    if (laterDate) {
      const daysSinceLater = Math.floor((Date.now() - parseInt(laterDate)) / (1000 * 60 * 60 * 24));
      if (daysSinceLater < 3) return;
    }
    
    // SMART CONDITIONS:
    // 1. Have played ≥3 distinct days
    // 2. Just won a level without using power-ups
    // 3. On a positive streak (≥1)
    const meetsConditions = 
      daysPlayed >= 3 && 
      justWonClean && 
      currentStreak >= 1;
    
    if (meetsConditions) {
      // Small delay for emotional impact after win celebration
      const timer = setTimeout(() => {
        setShow(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [daysPlayed, currentStreak, justWonClean, user?.id]);

  const handleReview = () => {
    // Mark as reviewed (never show again)
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY_NEVER_SHOW}-${user.id}`, 'true');
    }
    
    // Open Play Store for review
    if (Capacitor.isNativePlatform()) {
      window.open('market://details?id=com.mysticgarden.game', '_system');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.mysticgarden.game', '_blank');
    }
    setShow(false);
    onRespond?.();
  };

  const handleLater = () => {
    // Save timestamp to wait before showing again
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY_LATER}-${user.id}`, Date.now().toString());
    }
    setShow(false);
    onRespond?.();
  };

  const handleNeverShow = () => {
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY_NEVER_SHOW}-${user.id}`, 'true');
    }
    setShow(false);
    onRespond?.();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-emerald-400/50 shadow-2xl animate-in zoom-in-95 duration-300 relative">
        {/* Close button */}
        <button
          onClick={handleNeverShow}
          className="absolute top-3 right-3 text-emerald-300/60 hover:text-emerald-300 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated stars */}
        <div className="flex justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" 
              style={{ animationDelay: `${star * 100}ms` }}
            />
          ))}
        </div>
        
        {/* Emotional, relaxed question */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-emerald-300 mb-3">
            ¿Te está relajando Mystic Garden? 🌱
          </h2>
          
          <p className="text-emerald-100/70 text-sm leading-relaxed">
            Una reseña nos ayuda muchísimo
          </p>
        </div>

        {/* Three options - no pressure */}
        <div className="space-y-3">
          {/* Primary: Leave review */}
          <Button
            onClick={handleReview}
            className="w-full py-5 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-2 border-yellow-300 shadow-lg"
          >
            <Star className="w-5 h-5 mr-2 fill-white" />
            Dejar reseña
          </Button>
          
          {/* Secondary: Later */}
          <Button
            onClick={handleLater}
            variant="outline"
            className="w-full py-4 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/20"
          >
            <Clock className="w-4 h-4 mr-2" />
            Luego
          </Button>
          
          {/* Tertiary: Never show */}
          <button
            onClick={handleNeverShow}
            className="w-full py-2 text-sm text-emerald-400/60 hover:text-emerald-400 transition-colors"
          >
            No volver a mostrar
          </button>
        </div>
      </div>
    </div>
  );
};
