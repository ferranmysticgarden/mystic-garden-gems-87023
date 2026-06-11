import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Star, Gift, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePayment } from '@/hooks/usePayment';
import { trackEvent } from '@/lib/trackEvent';
import { hasPurchasedStarterGems, markStarterGemsAsPurchased } from '@/utils/purchaseUtils';
import { OfferCountdownTimer } from '@/components/offers/OfferCountdownTimer';
import { DiscountPrice } from '@/components/offers/DiscountPrice';
import { PhotoTilesPreview } from '@/components/offers/PhotoTilesPreview';
import { markOfferDismissed, isOfferOnCooldown } from '@/utils/offerCooldown';
import confetti from 'canvas-confetti';

const OFFER_ID = 'starter_pack';
const TIMER_SECONDS = 300;

interface StarterPackProps {
  levelJustCompleted: number;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

export const StarterPack = ({ levelJustCompleted, onClose, onPurchaseSuccess }: StarterPackProps) => {
  const [show, setShow] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'visible'>('entering');
  const timeRemainingRef = useRef(TIMER_SECONDS);
  const { user } = useAuth();
  const { createPayment, loading, getPrice } = usePayment();

  const price = getPrice('starter_gems', '€0.50');

  const alreadyBoughtStarter = hasPurchasedStarterGems();

  useEffect(() => {
    if (alreadyBoughtStarter) {
      trackEvent('starter_gems_blocked', { source: 'starter_pack_modal' });
    }
  }, [alreadyBoughtStarter]);

  // Migración: si la clave vieja indica que compró, marcar en el nuevo sistema
  useEffect(() => {
    const odId = user?.id || 'guest';
    const oldKey = localStorage.getItem(`starter-gems-${odId}`);
    if (oldKey === 'true' && !hasPurchasedStarterGems()) {
      console.log("[StarterPack] Migrando compra antigua al nuevo sistema");
      markStarterGemsAsPurchased();
    }
  }, [user?.id]);

  useEffect(() => {
    // Trigger después de nivel 1+ (primera oferta del embudo - captura antes del abandono)
    if (levelJustCompleted < 1) return;
    if (alreadyBoughtStarter) return;

    // Use a stable ID: user.id for logged-in, 'guest' for guests
    const odId = user?.id || 'guest';

    // Reaparece cada 3 sesiones en vez de mostrarse solo 1 vez
    const seenCount = parseInt(localStorage.getItem(`starter-gems-count-${odId}`) || '0', 10);
    if (seenCount % 3 === 0) {
      localStorage.setItem(`starter-gems-count-${odId}`, String(seenCount + 1));
      // Show immediately — Index.tsx already handles the delay
      setShow(true);
      triggerCelebration();
    } else {
      localStorage.setItem(`starter-gems-count-${odId}`, String(seenCount + 1));
    }
  }, [levelJustCompleted, user?.id, alreadyBoughtStarter]);

  useEffect(() => {
    if (show && animationPhase === 'entering') {
      const timer = setTimeout(() => setAnimationPhase('visible'), 600);
      return () => clearTimeout(timer);
    }
  }, [show, animationPhase]);

  // Timer is now owned by <OfferCountdownTimer/>; nothing to do here.

  const triggerCelebration = () => {
    // Confetti dorado cayendo del cielo
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.2 },
      colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6B00'],
      gravity: 0.8,
    });
  };

  const handleBuy = async () => {
    if (loading) return;

    const success = await createPayment('starter_gems', 'starter_pack');
    if (success) {
      console.log('[PURCHASE] success confirmed via StarterPack (starter_gems)');
      trackEvent('offer_purchased_in_time', {
        offer_type: OFFER_ID,
        time_remaining: timeRemainingRef.current,
      });
      markStarterGemsAsPurchased();
      onPurchaseSuccess?.();
      setShow(false);
      onClose();
    }
  };

  const handleDismissReason = (reason: 'close_x' | 'auto_close') => {
    trackEvent('offer_dismissed', {
      offer: 'starter_gems',
      trigger: 'starter_pack',
      source: 'auto_popup',
      reason,
      level: levelJustCompleted,
    });
    // 24h cooldown so we don't re-spam the same offer to the same device.
    markOfferDismissed(OFFER_ID);
    setShow(false);
    onClose();
  };

  const handleDismiss = () => {
    handleDismissReason('close_x');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Animación de entrada "cae del cielo" */}
      <div 
        className={`relative max-w-sm mx-4 transition-all duration-700 ease-out ${
          animationPhase === 'entering' 
            ? 'opacity-0 -translate-y-full scale-75' 
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        {/* Glow exterior pulsante */}
        <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-3xl blur-xl opacity-60 animate-pulse" />
        
        <div className="relative bg-gradient-to-b from-yellow-900 via-amber-800 to-orange-900 rounded-3xl p-6 border-4 border-yellow-400 shadow-2xl overflow-hidden">
          {/* Animated sparkles background */}
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-300/50 animate-pulse" />
            <Sparkles className="absolute top-8 right-6 w-4 h-4 text-yellow-300/40 animate-pulse delay-75" />
            <Sparkles className="absolute bottom-12 left-8 w-5 h-5 text-yellow-300/45 animate-pulse delay-150" />
            <Sparkles className="absolute bottom-6 right-4 w-6 h-6 text-yellow-300/50 animate-pulse delay-100" />
            <Zap className="absolute top-1/2 left-2 w-4 h-4 text-yellow-400/30 animate-bounce" />
            <Zap className="absolute top-1/3 right-2 w-4 h-4 text-yellow-400/30 animate-bounce delay-200" />
          </div>

          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/70 hover:text-white z-20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center relative z-10">
            {/* Golden glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 to-transparent opacity-60 blur-3xl" />
            
            <div className="relative">
              {/* BADGE "SOLO HOY" */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg animate-bounce">
                  ⚡ SOLO HOY ⚡
                </div>
              </div>

              {/* Mensaje personalizado - "Felicítalo primero" */}
              <div className="bg-red-500/20 border border-red-400/50 rounded-xl px-4 py-2 mb-3 mt-4">
                <p className="text-red-300 text-sm font-semibold">
                  😢 ¡Nivel {levelJustCompleted} fallido!
                </p>
                <p className="text-red-200/80 text-xs">
                  Con 400 gemas podrás comprar power-ups para ganar
                </p>
              </div>

              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-spin-slow" />
              </div>
              
              <h2 className="text-2xl font-bold text-yellow-400 mb-1 drop-shadow-lg">
                🔥 OFERTA EXCLUSIVA - Solo HOY 🔥
              </h2>

              {/* 5-min shared countdown — owns its own ticking + auto-close */}
              <div className="flex justify-center mb-3">
                <OfferCountdownTimer
                  offerType={OFFER_ID}
                  durationSeconds={TIMER_SECONDS}
                  onExpire={() => handleDismissReason('auto_close')}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl p-4 mb-4 border-2 border-yellow-400/50">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Gift className="w-7 h-7 text-yellow-400 animate-bounce" />
                <h3 className="text-xl font-bold text-white">INICIO MÁGICO</h3>
              </div>

              <div className="flex justify-center text-white mb-4">
                <div className="bg-black/30 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-3xl">💎</span>
                  <span className="font-bold text-yellow-300 text-lg">+400 Gemas</span>
                </div>
              </div>

              {/* Mini-tablero recordando la feature de fotos justo antes del CTA */}
              <PhotoTilesPreview className="mb-3" />

              {/* Discount framing centralizado */}
              <DiscountPrice productId="starter_gems" currentPrice={price} />
            </div>

            <Button 
              onClick={handleBuy}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-600 text-black font-bold py-6 rounded-xl text-xl shadow-lg shadow-yellow-500/50 transform hover:scale-105 transition-all active:scale-95"
            >
              {loading ? '⏳ Procesando...' : '🎁 ¡COMPRAR AHORA!'}
            </Button>

            <p className="text-yellow-300/60 text-xs mt-2">
              💳 Pago seguro
            </p>

            <Button 
              onClick={handleDismiss}
              variant="ghost"
              className="w-full text-white/30 hover:text-white/50 mt-1 text-xs"
            >
              No, prefiero pagar precio completo después
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
