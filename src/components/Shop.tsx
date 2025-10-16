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
    // Simulate purchase
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
              
              <div className="text-sm text-muted-foreground mb-3">
                {product.amount && <p>💎 {product.amount} {t('resources.gems')}</p>}
                {product.lives === 'unlimited' && <p>❤️ {t('resources.unlimited')} (1h)</p>}
                {product.gems && <p>💎 {product.gems} {t('resources.gems')}</p>}
                {product.lives && typeof product.lives === 'number' && <p>❤️ +{product.lives} {t('resources.lives')}</p>}
                {product.powerups && <p>🔨 +{product.powerups} Power-ups</p>}
                {product.dailyGems && <p>💎 {product.dailyGems} {t('resources.gems')}/día</p>}
              </div>

              <Button
                onClick={() => handlePurchase(product.id, t(product.nameKey))}
                className="w-full gradient-gold shadow-gold hover:scale-105 transition-transform"
              >
                {t('shop.buy')} - {formatPrice(product.price)}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
