import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

interface UltimateRescueOfferProps {
  levelNumber: number;
  attempts: number;
  movesShort: number;
  starsEarned?: number;
  onBuy: () => void;
  onDismiss: () => void;
}

export const UltimateRescueOffer = ({ 
  levelNumber, 
  attempts, 
  movesShort,
  starsEarned = 0,
  onBuy, 
  onDismiss 
}: UltimateRescueOfferProps) => {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isShaking, setIsShaking] = useState(true);
  const { createPayment, loading, getPrice } = usePayment();
  
  const price = getPrice('continue_game', '€0.99');

  // Efecto de entrada: vibración + shake
  useEffect(() => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    const shakeTimer = setTimeout(() => setIsShaking(false), 500);
    return () => clearTimeout(shakeTimer);
  }, []);

  // Countdown de urgencia
  useEffect(() => {
    if (secondsLeft <= 0) {
      onDismiss();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onDismiss]);

  const handleBuy = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    const success = await createPayment('continue_game');
    if (success) {
      onBuy();
    }
  };

  const getMessage = () => {
    if (attempts >= 5) return `Llevas ${attempts} intentos en este nivel...`;
    if (attempts >= 3) return `${attempts} intentos y tan cerca...`;
    if (movesShort === 1) return "¡A UN movimiento de ganar!";
    if (movesShort === 2) return "¡A 2 movimientos de la victoria!";
    return "¡Casi lo consigues!";
  };

  const getCountdownClasses = () => {
    if (secondsLeft <= 5) return 'bg-destructive animate-pulse text-destructive-foreground';
    if (secondsLeft <= 10) return 'bg-game-orange text-foreground';
    return 'bg-game-orange/50 text-muted-foreground';
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-fade-in ${isShaking ? 'animate-shake' : ''}`}>
      <div className="relative max-w-sm mx-4 w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-destructive via-game-orange to-destructive rounded-3xl blur-xl opacity-40 animate-pulse" />
        
        <div className="relative gradient-card rounded-3xl p-6 border-2 border-destructive/50 shadow-card animate-scale-in">
          {/* Botón cerrar - SIEMPRE visible pero muy sutil */}
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="text-6xl mb-3">😢</div>
            
            <h2 className="text-xl font-bold text-foreground mb-1">
              {getMessage()}
            </h2>

            <div className="text-sm font-semibold text-accent mb-3">
              ⚡ ¡SOLO POR ESTA PARTIDA! ⚡
            </div>

            {/* Lo que pierde */}
            <div className="bg-black/30 rounded-xl p-3 mb-3 border border-border text-left">
              <p className="text-muted-foreground text-xs mb-2">
                Si te rindes ahora pierdes:
              </p>
              <div className="space-y-1 text-sm text-foreground">
                <p>⏱️ Todo el tiempo invertido</p>
                <p>🎯 {attempts} {attempts === 1 ? 'intento' : 'intentos'} en el nivel {levelNumber}</p>
                {starsEarned > 0 && <p>⭐ {starsEarned} estrellas ganadas</p>}
              </div>
            </div>

            {/* Countdown */}
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3 ${getCountdownClasses()}`}>
              <span className="font-mono font-bold text-sm">
                {secondsLeft <= 5 ? '🔥 ' : '⏰ '}
                Oferta expira en {secondsLeft}s
                {secondsLeft <= 5 ? ' 🔥' : ''}
              </span>
            </div>

            {/* Oferta */}
            <div className="bg-black/20 rounded-xl p-3 mb-4 border border-accent/30">
              <p className="text-foreground font-medium">+5 movimientos para continuar</p>
              <p className="text-3xl font-bold text-accent mt-1">{price}</p>
              <p className="text-muted-foreground text-xs mt-1">Menos que un café ☕</p>
            </div>

            <Button
              onClick={handleBuy}
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-game-orange hover:from-accent/90 hover:to-game-orange/90 text-accent-foreground font-bold py-5 rounded-xl text-lg shadow-gold transition-all hover:scale-105"
            >
              {loading ? '⏳ Procesando...' : '🎯 ¡CONTINUAR Y GANAR!'}
            </Button>

            <button
              onClick={onDismiss}
              className="text-muted-foreground/30 hover:text-muted-foreground/50 text-xs mt-4 transition-colors block mx-auto"
            >
              Abandonar y perder todo el progreso
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
