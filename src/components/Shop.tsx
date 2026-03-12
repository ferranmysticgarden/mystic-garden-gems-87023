import { ShoppingBag, X, Loader2, Star, Sparkles, Crown } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { usePayment } from '@/hooks/usePayment';

interface ShopProps {
  onClose: () => void;
  onPurchase: (productId: string) => void;
}

// Products to show in main shop (exclude special offers)
const SHOP_PRODUCTS = ['gems_100', 'gems_300', 'gems_1200', 'no_ads_month', 'no_ads_forever', 'garden_pass'];
const PREMIUM_PACKS = ['pack_victoria_segura', 'pack_racha_infinita'];
const BEST_VALUE_ID = 'gems_300';

export const Shop = ({ onClose, onPurchase }: ShopProps) => {
  const { t, formatPrice } = useLanguage();
  const { createPayment, getPrice, loading } = usePayment();

  const handlePurchase = async (productId: string, productName: string) => {
    const success = await createPayment(productId);
    if (success) {
      onPurchase(productId);
    }
  };

  const shopProducts = PRODUCTS.filter(p => SHOP_PRODUCTS.includes(p.id));
  const premiumPacks = PRODUCTS.filter(p => PREMIUM_PACKS.includes(p.id));

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <div className="bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/30 shadow-2xl shadow-purple-900/50">
        {/* Header Premium */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-yellow-500/30">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Tienda Premium
              </h2>
              <p className="text-purple-300/70 text-sm">Ofertas exclusivas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-white/70 hover:text-white" />
          </button>
        </div>

        {/* PREMIUM PACKS SECTION - New! */}
        {premiumPacks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              <span className="text-amber-400 font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                PACKS EXPERIENCIA
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {premiumPacks.map((pack) => {
                const isVictoria = pack.id === 'pack_victoria_segura';
                
                return (
                  <div
                    key={pack.id}
                    className={`relative rounded-2xl p-5 transition-all hover:scale-[1.03] ${
                      isVictoria 
                        ? 'bg-gradient-to-br from-emerald-600/40 via-green-500/30 to-teal-600/40 border-2 border-emerald-400 shadow-xl shadow-emerald-500/30' 
                        : 'bg-gradient-to-br from-orange-600/40 via-amber-500/30 to-red-600/40 border-2 border-orange-400 shadow-xl shadow-orange-500/30'
                    }`}
                  >
                    {/* Badge */}
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${isVictoria ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-orange-400 to-red-400'} px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg`}>
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-bold">
                        {isVictoria ? 'VICTORIA SEGURA' : 'RACHA INFINITA'}
                      </span>
                    </div>

                    <div className="mt-4 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {isVictoria ? (
                          <>
                            <span className="text-2xl">🛡️</span>
                            <span className="text-2xl">⚡</span>
                            <span className="text-2xl">🎯</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">🔥</span>
                            <span className="text-2xl">❤️</span>
                            <span className="text-2xl">🎰</span>
                          </>
                        )}
                      </div>
                      
                      <ul className="text-sm space-y-1.5 text-white/90">
                        {isVictoria ? (
                          <>
                            <li className="flex items-center gap-2">✓ +5 movimientos extra</li>
                            <li className="flex items-center gap-2">✓ +3 boosters</li>
                            <li className="flex items-center gap-2">✓ Protección de derrota 1x</li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center gap-2">✓ Protección de racha</li>
                            <li className="flex items-center gap-2">✓ +2 vidas</li>
                            <li className="flex items-center gap-2">✓ 1 giro extra ruleta</li>
                          </>
                        )}
                      </ul>
                    </div>

                    <Button
                      onClick={() => handlePurchase(pack.id, pack.name)}
                      className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg text-lg ${
                        isVictoria 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-slate-900 shadow-emerald-500/40' 
                          : 'bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white shadow-orange-500/40'
                      }`}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5 mr-2" />
                          {getPrice(pack.id, `€${pack.price.toFixed(2)}`)}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <span className="text-purple-300/70 text-xs">GEMAS & PASES</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopProducts.map((product) => {
            const isBestValue = product.id === BEST_VALUE_ID;
            const isGardenPass = product.id === 'garden_pass';
            
            return (
              <div
                key={product.id}
                className={`relative rounded-2xl p-5 transition-all hover:scale-[1.02] ${
                  isBestValue 
                    ? 'bg-gradient-to-br from-yellow-600/30 via-amber-500/20 to-orange-600/30 border-2 border-yellow-400 shadow-xl shadow-yellow-500/20' 
                    : isGardenPass
                    ? 'bg-gradient-to-br from-purple-600/30 via-indigo-500/20 to-blue-600/30 border-2 border-purple-400 shadow-xl shadow-purple-500/20'
                    : 'bg-slate-800/50 border border-slate-600/30 hover:border-purple-400/50 hover:bg-slate-800/70'
                }`}
              >
                {/* Best Value Badge */}
                {isBestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Star className="w-4 h-4 text-slate-900 fill-slate-900" />
                    <span className="text-slate-900 text-sm font-bold">MEJOR VALOR</span>
                  </div>
                )}

                {/* Garden Pass Badge */}
                {isGardenPass && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Crown className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-bold">PREMIUM</span>
                  </div>
                )}

                <h3 className="font-bold text-lg text-white mb-3 mt-2">{t(product.nameKey)}</h3>
                
                <div className="text-sm text-purple-200/80 mb-4 space-y-2">
                  {product.amount && (
                    <p className="flex items-center gap-2">
                      <span className="text-2xl">💎</span>
                      <span className="font-medium">{product.amount} {t('resources.gems')}</span>
                    </p>
                  )}
                  {product.instantGems && (
                    <p className="flex items-center gap-2">
                      <span className="text-2xl">💎</span>
                      <span className="font-medium">{product.instantGems} {t('resources.gems')} (inmediatas)</span>
                    </p>
                  )}
                  {product.noAdsDays && product.noAdsDays > 0 && (
                    <p className="flex items-center gap-2">
                      <span className="text-2xl">🚫</span>
                      <span className="font-medium">Sin anuncios ({product.noAdsDays} días)</span>
                    </p>
                  )}
                  {product.noAdsForever && (
                    <p className="flex items-center gap-2">
                      <span className="text-2xl">🚫</span>
                      <span className="font-medium">Sin anuncios (para siempre)</span>
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handlePurchase(product.id, t(product.nameKey))}
                  className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg ${
                    isBestValue 
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 hover:from-yellow-500 hover:via-amber-500 hover:to-orange-500 text-slate-900 shadow-yellow-500/30' 
                      : isGardenPass
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-purple-500/30'
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white'
                  }`}
                  id={`buy-${product.id}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {isBestValue && <Sparkles className="w-4 h-4 mr-2" />}
                      {isGardenPass && <Crown className="w-4 h-4 mr-2" />}
                      {getPrice(product.id, `€${product.price.toFixed(2)}`)}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
