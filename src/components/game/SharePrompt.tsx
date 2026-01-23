import { useState, useEffect } from 'react';
import { Share2, X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Capacitor } from '@capacitor/core';

interface SharePromptProps {
  gamesPlayed: number;
  daysPlayed: number;
}

export const SharePrompt = ({ gamesPlayed, daysPlayed }: SharePromptProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const sharePromptKey = `share-prompt-shown-${user.id}`;
    const alreadyShown = localStorage.getItem(sharePromptKey);

    // Show after 5 games OR 1 day played, only once
    if ((gamesPlayed >= 5 || daysPlayed >= 1) && !alreadyShown) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(sharePromptKey, 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gamesPlayed, daysPlayed, user?.id]);

  const handleShare = async () => {
    const shareData = {
      title: 'Mystic Garden 🌸',
      text: '¿Necesitas relajarte? Prueba este juego de jardín místico. ¡Es muy relajante! 🌺',
      url: 'https://play.google.com/store/apps/details?id=com.mysticgarden.game',
    };

    try {
      if (navigator.share && Capacitor.isNativePlatform()) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('¡Enlace copiado! Compártelo con tus amigos 💚');
      }
    } catch (err) {
      console.log('Share cancelled or failed');
    }
    
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-pink-900 via-purple-900 to-indigo-900 rounded-3xl p-6 max-w-sm w-full border-4 border-pink-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button onClick={handleDismiss} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emotional appeal - not marketing */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400 animate-pulse" />
            <span className="text-4xl">🌸</span>
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400 animate-pulse" style={{ animationDelay: '200ms' }} />
          </div>
          
          <h2 className="text-xl font-bold text-pink-300 mb-3">
            ¿Conoces a alguien que necesite relajarse?
          </h2>
          
          <p className="text-pink-100/80 text-sm">
            Comparte un momento de calma 🌿
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleShare}
            className="w-full py-5 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 border-2 border-pink-300 shadow-lg"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartir Mystic Garden
          </Button>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="w-full text-pink-300/60 hover:text-pink-300"
          >
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  );
};
