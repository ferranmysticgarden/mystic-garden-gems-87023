import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, AlertCircle, ExternalLink, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAdLimit } from '@/hooks/useAdLimit';
import { Capacitor } from '@capacitor/core';
import hologramFanImg from '@/assets/hologram-fan-product.png';

interface RewardedAdsProps {
  onRewardEarned?: (gems: number) => void;
  currentLevel?: number;
}

/** Pricing tiers based on player level */
const getDiscountedPrice = (level: number): { price: string; discount: number; label: string } => {
  if (level >= 15) return { price: '27,99', discount: 20, label: '🏆 Precio VIP' };
  if (level >= 10) return { price: '28,99', discount: 17, label: '⭐ Precio Premium' };
  if (level >= 5) return { price: '30,99', discount: 11, label: '🔥 Precio Pro' };
  if (level >= 2) return { price: '32,99', discount: 6, label: '🌱 Descuento Jugador' };
  return { price: '34,99', discount: 0, label: 'Precio Base' };
};

const LANDING_URL_BASE = '/product'; // Landing page interna

export const RewardedAds = ({ onRewardEarned, currentLevel = 1 }: RewardedAdsProps) => {
  const [loading, setLoading] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { user } = useAuth();
  const { canWatchAd, adsWatchedThisHour, maxAdsPerHour, nextAdAvailableIn, recordAdWatch } = useAdLimit();

  const { price, discount, label } = getDiscountedPrice(currentLevel);

  useEffect(() => {
    if (showingAd && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showingAd && countdown === 0) {
      completeAdWatch();
    }
  }, [showingAd, countdown]);

  const handleWatchAd = () => {
    if (!user?.id || loading || !canWatchAd) return;
    if (!recordAdWatch()) return;
    setLoading(true);
    setShowingAd(true);
    setCountdown(5);
  };

  const completeAdWatch = async () => {
    if (!user?.id) return;
    const reward = 20;

    const { data: gameState } = await supabase
      .from('game_progress')
      .select('gems')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gameState) {
      await supabase
        .from('game_progress')
        .update({ gems: (gameState.gems || 0) + reward })
        .eq('user_id', user.id);
    }

    onRewardEarned?.(reward);
    setShowingAd(false);
    setLoading(false);
  };

  const openProductLink = async () => {
    const url = `${window.location.origin}${LANDING_URL_BASE}?level=${currentLevel}`;
    try {
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url });
      } else {
        window.open(url, '_blank');
      }
    } catch {
      window.open(url, '_blank');
    }
  };

  // ─── Fullscreen Ad Modal ───
  if (showingAd) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <div className="w-full max-w-md p-4 text-center" onClick={openProductLink}>
          {/* Product Image */}
          <div className="mb-4 relative">
            <img
              src={hologramFanImg}
              alt="3D Hologram Fan"
              className="w-48 h-48 object-contain mx-auto rounded-2xl drop-shadow-[0_0_30px_rgba(0,200,255,0.4)]"
            />
            {discount > 0 && (
              <span className="absolute top-0 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                -{discount}%
              </span>
            )}
          </div>

          {/* Product Title */}
          <h2 className="text-2xl font-bold text-white mb-1">
            3D Hologram Fan 🔮
          </h2>
          <p className="text-cyan-300 text-sm mb-4">
            Proyector holográfico WiFi · iOS & Android
          </p>

          {/* Price Card */}
          <div className="bg-gradient-to-br from-cyan-900/60 to-purple-900/60 border border-cyan-500/30 rounded-2xl p-4 mb-4">
            <p className="text-cyan-400 text-xs font-semibold mb-1 uppercase tracking-wider">
              {label}
            </p>
            {discount > 0 && (
              <p className="text-white/40 line-through text-sm">€34,99</p>
            )}
            <p className="text-3xl font-bold text-white">
              €{price}
            </p>
            <p className="text-emerald-400 text-xs mt-1">
              {discount > 0
                ? `¡Ahorraste €${(34.99 - parseFloat(price.replace(',', '.'))).toFixed(2).replace('.', ',')}!`
                : 'Sube de nivel para desbloquear descuentos 🎮'}
            </p>
          </div>

          {/* Level Progress */}
          {currentLevel < 20 && (
            <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>Nivel {currentLevel}</span>
                <span>Siguiente descuento: Nivel {currentLevel < 5 ? 5 : currentLevel < 10 ? 10 : currentLevel < 15 ? 15 : 20}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min((currentLevel / 20) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <p className="text-white/50 text-xs mb-2 flex items-center justify-center gap-1">
            <ExternalLink className="w-3 h-3" /> Toca para ver el producto
          </p>
        </div>

        {/* Countdown + Progress */}
        <div className="absolute bottom-16 left-0 right-0 px-8">
          <div className="flex flex-col items-center gap-2 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg shadow-cyan-500/30">
              <span className="text-2xl font-bold text-white">{countdown}</span>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-1000 rounded-full"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-white/40 mt-2">
            +20 💎 al finalizar
          </p>
        </div>
      </div>
    );
  }

  // ─── Inline Banner ───
  return (
    <div className="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 rounded-xl p-4 border border-cyan-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-600 rounded-full p-2">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              Ver anuncio = 20 💎 + Descuento 🔮
            </p>
            <p className="text-cyan-200/70 text-xs">
              {canWatchAd
                ? `${adsWatchedThisHour}/${maxAdsPerHour} usados esta hora`
                : `Próximo en ${nextAdAvailableIn} min`}
            </p>
          </div>
        </div>

        <Button
          onClick={handleWatchAd}
          disabled={loading || !canWatchAd}
          size="sm"
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold disabled:opacity-50"
        >
          {!canWatchAd ? (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Límite
            </span>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              Ver ad
            </>
          )}
        </Button>
      </div>

      {/* Limit message */}
      {!canWatchAd && (
        <div className="mt-3 bg-orange-500/20 rounded-lg p-2 border border-orange-400/30">
          <p className="text-orange-300 text-xs text-center">
            ⏰ Máximo {maxAdsPerHour} anuncios por hora.
            <span className="font-bold"> ¿Necesitas gemas ahora?</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 text-yellow-400 hover:text-yellow-300 text-xs"
            onClick={() => window.dispatchEvent(new CustomEvent('open-shop'))}
          >
            💎 Ver ofertas especiales
          </Button>
        </div>
      )}
    </div>
  );
};
