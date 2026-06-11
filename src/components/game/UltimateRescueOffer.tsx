import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { trackEvent } from '@/lib/trackEvent';
import { hasPurchasedStarterGems } from '@/utils/purchaseUtils';
import { DiscountPrice } from '@/components/offers/DiscountPrice';
import { PhotoTilesPreview } from '@/components/offers/PhotoTilesPreview';
import { markOfferDismissed } from '@/utils/offerCooldown';

const OFFER_ID = 'ultimate_rescue';

interface UltimateRescueOfferProps {
  levelNumber: number;
  attempts: number;
  movesShort: number;
  starsEarned?: number;
  onBuy: () => void;
  onDismiss: () => void;
  gems: number;
  onBuyWithGems: () => void;
}

export const UltimateRescueOffer = ({ 
  levelNumber, 
  attempts, 
  movesShort,
  starsEarned = 0,
  onBuy, 
  onDismiss,
  gems,
  onBuyWithGems
}: UltimateRescueOfferProps) => {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isShaking, setIsShaking] = useState(true);
  const [isSpendingGems, setIsSpendingGems] = useState(false);
  const { createPayment, loading, getPrice } = usePayment();
  
  const price = getPrice('continue_game', '€0.50');
  const alreadyBoughtStarter = hasPurchasedStarterGems();

  useEffect(() => {
    if (alreadyBoughtStarter) {
      trackEvent('starter_gems_blocked', { source: 'ultimate_rescue' });
    }
  }, [alreadyBoughtStarter]);

  const handleDismiss = useCallback(
    (reason: 'close_x' | 'no_thanks' | 'auto_close') => {
      // 🔒 BLOQUEO: no permitir cerrar el modal mientras hay un pago en curso.
      // Sin esto, el countdown de 15s o un toque accidental cierra el modal
      // antes de que llegue purchase_success y el reward (+5 movimientos) se pierde.
      if (loading || isSpendingGems) {
        return;
      }
      trackEvent('offer_dismissed', {
        offer: 'continue_game',
        trigger: 'ultimate_rescue',
        source: 'auto_popup',
        reason,
        level: levelNumber,
        attempts,
        moves_short: movesShort,
      });
      onDismiss();
    },
    [levelNumber, attempts, movesShort, onDismiss, loading, isSpendingGems]
  );

  // Efecto de entrada: vibración + shake
  useEffect(() => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    const shakeTimer = setTimeout(() => setIsShaking(false), 500);
    return () => clearTimeout(shakeTimer);
  }, []);

  // Countdown de urgencia — PAUSADO durante el pago. Sin esta pausa, el
  // contador llegaba a 0 mientras Google Play procesaba y auto-cerraba
  // el modal antes de aplicar los +5 movimientos.
  useEffect(() => {
    if (loading || isSpendingGems) return;
    if (secondsLeft <= 0) {
      handleDismiss('auto_close');
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, handleDismiss, loading, isSpendingGems]);

  const handleBuy = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    const success = await createPayment('continue_game');
    if (success) {
      onBuy();
    }
  };

  const handleGemBuy = () => {
    if (gems < 150 || isSpendingGems || loading) return;
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setIsSpendingGems(true);
    onBuyWithGems();
  };

  const handleBuyGemsPack = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    await createPayment('starter_gems', 'ultimate_rescue');
    // Al completarse, Index.tsx actualizará las props de gems y el modal
    // mostrará automáticamente la opción de "USAR 150 GEMAS".
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
            onClick={() => handleDismiss('close_x')}
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
              <div className="flex justify-center items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-accent">{price}</span>
                <span className="text-muted-foreground text-sm">o</span>
                <span className="text-2xl font-bold text-yellow-400">150 💎</span>
              </div>
            </div>

            <div className="space-y-3">
              {gems >= 150 ? (
                <>
                  <Button
                    onClick={handleGemBuy}
                    disabled={loading || isSpendingGems}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-5 rounded-xl text-lg shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {isSpendingGems ? '⏳ Procesando...' : '💎 USAR 150 GEMAS'}
                  </Button>

                  <Button
                    onClick={handleBuy}
                    disabled={loading || isSpendingGems}
                    className="w-full bg-gradient-to-r from-accent to-game-orange hover:from-accent/90 hover:to-game-orange/90 text-accent-foreground font-bold py-5 rounded-xl text-lg shadow-gold transition-all hover:scale-105"
                  >
                    {loading ? '⏳ Procesando...' : '🎯 ¡CONTINUAR Y GANAR!'}
                  </Button>
                </>
              ) : (
                alreadyBoughtStarter ? (
                  <Button
                    onClick={handleBuy}
                    disabled={loading || isSpendingGems}
                    className="w-full bg-gradient-to-r from-accent to-game-orange hover:from-accent/90 hover:to-game-orange/90 text-accent-foreground font-bold py-5 rounded-xl text-lg shadow-gold transition-all hover:scale-105"
                  >
                    {loading ? '⏳ Procesando...' : `🎯 ¡CONTINUAR POR SOLO ${price}!`}
                  </Button>
                ) : (
                  <Button
                    onClick={handleBuyGemsPack}
                    disabled={loading || isSpendingGems}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-5 rounded-xl text-lg shadow-lg transition-all hover:scale-105"
                  >
                    {loading ? '⏳ Procesando...' : '💎 400 GEMAS — 0,50€ (continúa + 250 extra)'}
                  </Button>
                )
              )}
            </div>

            <button
              onClick={() => handleDismiss('no_thanks')}
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
