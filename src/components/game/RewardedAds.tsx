import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, AlertCircle, Gem, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAdLimit } from '@/hooks/useAdLimit';

interface RewardedAdsProps {
  onRewardEarned?: (gems: number) => void;
  currentLevel?: number;
}

const AD_REWARD = 10;

/** Rotating promo packs shown in the fullscreen ad */
const PROMO_PACKS = [
  {
    id: 'starter_pack',
    title: '🌟 Starter Pack',
    subtitle: '¡La mejor oferta para empezar!',
    price: '€0,99',
    oldPrice: '€4,99',
    discount: 80,
    benefits: ['500 Gemas 💎', '10 Vidas ❤️', '3 Power-ups ⚡'],
    gradient: 'from-amber-500/80 to-orange-600/80',
    border: 'border-amber-400/40',
  },
  {
    id: 'gems_300',
    title: '💎 Mega Pack Gemas',
    subtitle: '¡El más popular!',
    price: '€3,99',
    oldPrice: '€7,99',
    discount: 50,
    benefits: ['300 Gemas 💎', 'Valor x2', 'Desbloquea la tienda'],
    gradient: 'from-purple-500/80 to-indigo-600/80',
    border: 'border-purple-400/40',
  },
  {
    id: 'welcome_pack',
    title: '🎁 Pack Bienvenida',
    subtitle: '¡Solo para nuevos jugadores!',
    price: '€0,49',
    oldPrice: '€1,99',
    discount: 75,
    benefits: ['+5 Movimientos 🎯', '+3 Boosters 🚀', 'Oferta exclusiva inicial'],
    gradient: 'from-emerald-500/80 to-teal-600/80',
    border: 'border-emerald-400/40',
  },
  {
    id: 'pack_impulso',
    title: '🔥 Pack Impulso',
    subtitle: '¡Supera cualquier nivel!',
    price: '€0,99',
    oldPrice: '€2,99',
    discount: 67,
    benefits: ['+5 Movimientos 🎯', '+3 Boosters 🚀', 'Victoria asegurada'],
    gradient: 'from-rose-500/80 to-pink-600/80',
    border: 'border-rose-400/40',
  },
];

export const RewardedAds = ({ onRewardEarned, currentLevel = 1 }: RewardedAdsProps) => {
  const [loading, setLoading] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [promoIndex, setPromoIndex] = useState(0);
  const { user } = useAuth();
  const { canWatchAd, adsWatchedThisHour, maxAdsPerHour, nextAdAvailableIn, recordAdWatch } = useAdLimit();

  // Rotate promo each time ad is shown
  useEffect(() => {
    const stored = parseInt(localStorage.getItem('promo_rotation_index') || '0');
    setPromoIndex(stored % PROMO_PACKS.length);
  }, []);

  useEffect(() => {
    if (showingAd && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showingAd && countdown === 0) {
      completeAdWatch();
    }
  }, [showingAd, countdown]);

  const handleWatchAd = () => {
    if (loading || !canWatchAd) return;
    if (!recordAdWatch()) return;
    setLoading(true);
    setShowingAd(true);
    setCountdown(5);
    // Advance rotation for next time
    const nextIndex = (promoIndex + 1) % PROMO_PACKS.length;
    localStorage.setItem('promo_rotation_index', String(nextIndex));
  };

  const completeAdWatch = async () => {
    // Only save to DB if authenticated
    if (user?.id) {
      const { data: gameState } = await supabase
        .from('game_progress')
        .select('gems')
        .eq('user_id', user.id)
        .maybeSingle();

      if (gameState) {
        await supabase
          .from('game_progress')
          .update({ gems: (gameState.gems || 0) + AD_REWARD })
          .eq('user_id', user.id);
      }
    }

    onRewardEarned?.(AD_REWARD);
    setShowingAd(false);
    setLoading(false);
  };

  const openShop = () => {
    window.dispatchEvent(new CustomEvent('open-shop'));
  };

  const promo = PROMO_PACKS[promoIndex];

  // ─── Fullscreen Ad Modal — Game Pack Promo ───
  if (showingAd) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm p-5 text-center" onClick={openShop}>
          
          {/* Badge */}
          <div className="mb-3">
            <span className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg animate-pulse">
              🔥 OFERTA LIMITADA · -{promo.discount}%
            </span>
          </div>

          {/* Pack Card */}
          <div className={`bg-gradient-to-br ${promo.gradient} ${promo.border} border-2 rounded-3xl p-6 mb-4 shadow-2xl`}>
            <h2 className="text-3xl font-bold text-white mb-1">
              {promo.title}
            </h2>
            <p className="text-white/80 text-sm mb-4">
              {promo.subtitle}
            </p>

            {/* Benefits */}
            <div className="space-y-2 mb-4">
              {promo.benefits.map((b, i) => (
                <div key={i} className="bg-black/20 rounded-xl py-2 px-4 text-white font-medium text-sm">
                  {b}
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-white/40 line-through text-lg">{promo.oldPrice}</span>
              <span className="text-4xl font-black text-white drop-shadow-lg">{promo.price}</span>
            </div>
          </div>

          {/* Social proof */}
          <p className="text-white/50 text-xs mb-2">
            ⭐ 73% de jugadores eligen este pack
          </p>

          {/* CTA */}
          <p className="text-yellow-400/80 text-xs font-semibold flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Toca para ir a la tienda
          </p>
        </div>

        {/* Countdown + Progress */}
        <div className="absolute bottom-16 left-0 right-0 px-8">
          <div className="flex flex-col items-center gap-2 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center animate-pulse shadow-lg shadow-orange-500/30">
              <span className="text-2xl font-bold text-white">{countdown}</span>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-1000 rounded-full"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-white/40 mt-2">
            +{AD_REWARD} 💎 al finalizar
          </p>
        </div>
      </div>
    );
  }

  // ─── Inline Banner ───
  return (
    <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-xl p-4 border border-amber-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600 rounded-full p-2">
            <Play className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              Ver anuncio = {AD_REWARD} 💎
            </p>
            <p className="text-amber-200/70 text-xs">
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
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold disabled:opacity-50"
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
            onClick={openShop}
          >
            💎 Ver ofertas especiales
          </Button>
        </div>
      )}
    </div>
  );
};
