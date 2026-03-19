import { useState, useEffect } from 'react';
import { Tag, X } from 'lucide-react';

const DISCOUNT_TIERS = [
  { level: 2, discount: 6, price: '32,99' },
  { level: 5, discount: 11, price: '30,99' },
  { level: 10, discount: 17, price: '28,99' },
  { level: 15, discount: 20, price: '27,99' },
];

const STORAGE_KEY = 'mystic_discount_tiers_seen';

const getSeenTiers = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markTierSeen = (level: number) => {
  const seen = getSeenTiers();
  if (!seen.includes(level)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, level]));
  }
};

interface DiscountUnlockBannerProps {
  currentLevel: number;
}

export const DiscountUnlockBanner = ({ currentLevel }: DiscountUnlockBannerProps) => {
  const [visibleTier, setVisibleTier] = useState<typeof DISCOUNT_TIERS[number] | null>(null);

  return null; // DESACTIVADO

  useEffect(() => {
    const seen = getSeenTiers();
    // Find the highest tier the player just unlocked but hasn't seen
    const newTier = [...DISCOUNT_TIERS]
      .reverse()
      .find(t => currentLevel >= t.level && !seen.includes(t.level));

    if (newTier) {
      setVisibleTier(newTier);
      markTierSeen(newTier.level);
    }
  }, [currentLevel]);

  if (!visibleTier) return null;

  const nextTier = DISCOUNT_TIERS.find(t => t.level > visibleTier.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-300">
      <div className="mx-4 w-full max-w-sm bg-gradient-to-br from-cyan-900 to-purple-900 border-2 border-cyan-400/50 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(0,200,255,0.3)] animate-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={() => setVisibleTier(null)}
          className="absolute top-3 right-3 text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="text-5xl mb-3 animate-bounce">🎉</div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-1">
          ¡Descuento desbloqueado!
        </h2>
        <p className="text-cyan-300 text-sm mb-4">
          Nivel {visibleTier.level} alcanzado
        </p>

        {/* Discount card */}
        <div className="bg-black/30 rounded-xl p-4 mb-4 border border-cyan-500/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-cyan-400" />
            <span className="text-3xl font-bold text-white">-{visibleTier.discount}%</span>
          </div>
          <p className="text-white text-lg font-semibold">
            3D Hologram Fan 🔮
          </p>
          <p className="text-white/50 line-through text-sm">€34,99</p>
          <p className="text-cyan-300 text-2xl font-bold">€{visibleTier.price}</p>
        </div>

        {/* Next tier hint */}
        {nextTier && (
          <p className="text-white/50 text-xs mb-4">
            🎮 Próximo descuento (-{nextTier.discount}%) en nivel {nextTier.level}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={() => setVisibleTier(null)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm hover:from-cyan-400 hover:to-purple-500 transition-all"
        >
          ¡Genial! Seguir jugando 🚀
        </button>
      </div>
    </div>
  );
};
