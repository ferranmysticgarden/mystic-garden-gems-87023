import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePayment } from '@/hooks/usePayment';
import { dispatchPurchaseCompleted } from '@/hooks/usePurchaseGate';

interface Level10PaywallProps {
  onPurchaseSuccess: () => void;
}

/**
 * Popup NO CERRABLE para forzar primera compra en nivel 10
 * Solo aparece cuando el jugador pierde el nivel 10
 */
export const Level10Paywall = ({ onPurchaseSuccess }: Level10PaywallProps) => {
  const { createPayment, loading } = usePayment();
  const [purchasing, setPurchasing] = useState(false);

  const handleBuy = async () => {
    setPurchasing(true);
    try {
      const success = await createPayment('buy_moves');
      if (success) {
        // Marcar primera compra completada
        dispatchPurchaseCompleted();
        onPurchaseSuccess();
      }
    } catch (error) {
      console.error('Error en compra nivel 10:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const isLoading = loading || purchasing;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-md">
      <div className="gradient-card rounded-3xl p-8 max-w-sm w-full mx-4 border-2 border-primary/50 shadow-2xl text-center">
        {/* Emoji triste */}
        <div className="text-6xl mb-4 animate-bounce">😢</div>
        
        {/* Título */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ¡Casi lo tenías!
        </h2>
        
        {/* Mensaje clave */}
        <p className="text-xl text-gold font-bold mb-6">
          Te faltaron 2 movimientos
        </p>
        
        {/* Descripción */}
        <p className="text-muted-foreground text-sm mb-6">
          Estabas tan cerca de ganar... ¡No pierdas tu progreso!
        </p>
        
        {/* Botón único - NO hay forma de cerrar */}
        <Button
          onClick={handleBuy}
          disabled={isLoading}
          className="w-full py-6 text-xl font-bold gradient-gold shadow-gold text-foreground rounded-2xl transition-all hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Continuar por 0,49 €
            </>
          )}
        </Button>
        
        {/* Texto pequeño de urgencia */}
        <p className="text-muted-foreground/50 text-xs mt-4">
          Menos que un café ☕
        </p>
      </div>
    </div>
  );
};
