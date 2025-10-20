import { ShoppingBag, X } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ShopProps {
  onClose: () => void;
  onPurchase: (productId: string) => void;
}

export const Shop = ({ onClose, onPurchase }: ShopProps) => {
  const { t, formatPrice } = useLanguage();

  const handlePurchase = (productId: string, productName: string) => {
    toast.success(`${t('shop.purchased')} ${productName}`);
    onPurchase(productId);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="gradient-card shadow-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-accent" />
            <h2 className="text-3xl font-bold text-gold">{t('shop.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="bg-muted/50 rounded-xl p-4 hover:bg-muted/70 transition-all"
            >
              <h3 className="font-bold text-lg mb-2">{t(product.nameKey)}</h3>
              
              <div className="text-sm text-muted-foreground mb-3 space-y-1">
                {product.amount && <p>💎 {product.amount} {t('resources.gems')}</p>}
                {product.instantGems && <p>💎 {product.instantGems} {t('resources.gems')} (inmediatas)</p>}
                {product.noAdsDays && <p>🚫 Sin anuncios ({product.noAdsDays} días)</p>}
                {product.noAdsForever && <p>🚫 Sin anuncios (para siempre)</p>}
              </div>

              <Button
                onClick={() => handlePurchase(product.id, t(product.nameKey))}
                className="w-full gradient-gold shadow-gold hover:scale-105 transition-transform"
                id={`buy-${product.id}`}
              >
                {t('shop.buy')} - €{product.price.toFixed(2)}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
