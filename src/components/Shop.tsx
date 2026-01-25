import { ShoppingBag, X, Loader2, Star, Sparkles, Crown } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useStripePayment } from '@/hooks/useStripePayment';

interface ShopProps {
  onClose: () => void;
  onPurchase: (productId: string) => void;
}

// Products to show in main shop (exclude special offers)
const SHOP_PRODUCTS = ['gems_100', 'gems_300', 'gems_1200', 'no_ads_month', 'no_ads_forever', 'garden_pass'];
const BEST_VALUE_ID = 'gems_300';

export const Shop = ({ onClose, onPurchase }: ShopProps) => {
  const { t, formatPrice } = useLanguage();
  const { createPayment, loading } = useStripePayment();

  const handlePurchase = async (productId: string, productName: string) => {
    await createPayment(productId);
  };

  const shopProducts = PRODUCTS.filter(p => SHOP_PRODUCTS.includes(p.id));

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
                      {`€${product.price.toFixed(2)}`}
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
