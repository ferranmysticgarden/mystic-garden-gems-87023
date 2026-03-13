import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';
import { PRODUCTS } from '@/data/products';

interface Level10PaywallProps {
  onPurchaseSuccess: () => void;
  onDismiss: () => void;
  movesShort?: number;
  progressPercent?: number;
}

/**
 * Popup de primera compra en nivel 10
 * Copy optimizado en 3 capas + urgencia con contador
 */
export const Level10Paywall = ({ 
  onPurchaseSuccess, 
  onDismiss,
  movesShort = 1,
  progressPercent = 95 
}: Level10PaywallProps) => {
  const { createPayment, getPrice, loading } = usePayment();
  const [purchasing, setPurchasing] = useState(false);

  const buyMovesProduct = PRODUCTS.find(p => p.id === 'buy_moves');
  const displayPrice = getPrice('buy_moves', `€${buyMovesProduct?.price.toFixed(2) ?? '0.50'}`);
  const [countdown, setCountdown] = useState(15);

  console.log("LEVEL10 POPUP RENDER");

  // Analytics movidos a GameScreen.tsx (componente estable) para Android

  // Contador regresivo de urgencia
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleBuy = async () => {
    setPurchasing(true);
    try {
      const success = await createPayment('buy_moves');
      if (success) {
        dispatchPurchaseCompleted('buy_moves');
        onPurchaseSuccess();
      }
    } catch (error) {
      console.error('Error en compra nivel 10:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleClose = () => {
    onDismiss();
  };

  const isLoading = loading || purchasing;
  
  const movesText = movesShort === 1 
    ? 'Te quedaste a 1 movimiento' 
    : `Te quedaste a ${movesShort} movimientos`;
  
  const displayProgress = Math.max(90, Math.min(98, progressPercent));

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100]">
      <div className="gradient-card rounded-3xl p-6 max-w-sm w-full mx-4 border-2 border-gold/50 shadow-2xl text-center relative overflow-hidden">
        <button 
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all z-10"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gold mb-1 mt-2">
          {movesText}
        </h2>
        
        <p className="text-lg text-foreground font-medium mb-4">
          Este nivel ya era tuyo
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Tu progreso</span>
            <span className="text-gold font-bold">{displayProgress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-gold to-primary rounded-full transition-all duration-500"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ¡Solo te faltaba un poco más!
          </p>
        </div>
        
        <div className="bg-gold/10 rounded-xl p-3 mb-4 border border-gold/30">
          <p className="text-foreground font-bold">
            +5 movimientos · {displayPrice}
          </p>
          <p className="text-muted-foreground text-xs">
            Menos que un café ☕
          </p>
        </div>
       
        <p className="text-xs text-muted-foreground mb-3">
          Si sales ahora, este progreso se perderá
        </p>

        <Button
          onClick={handleBuy}
          disabled={isLoading}
          className="w-full py-5 text-lg font-bold gradient-gold shadow-gold text-foreground rounded-2xl transition-all hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            'Terminar este nivel'
          )}
        </Button>

        <p className="text-sm text-muted-foreground mt-2">
          {displayPrice} · menos que un café
        </p>
       
        <p className="text-xs text-muted-foreground mt-2">
          El 83% de los jugadores continúa el nivel con esta opción
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="text-lg">⏳</span>
          {countdown > 0 ? (
            <p className="text-destructive font-medium animate-pulse">
              Esta oportunidad desaparece en {countdown}s
            </p>
          ) : (
            <p className="text-muted-foreground">
              Esta oportunidad desaparece si sales
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
