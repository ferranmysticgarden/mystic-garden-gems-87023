import { useSearchParams } from 'react-router-dom';
import { ExternalLink, Wifi, Smartphone, Zap, Star, ChevronDown, Shield, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import hologramFanImg from '@/assets/hologram-fan-product.png';

const ALIEXPRESS_URL = 'https://es.aliexpress.com/item/1005008500741220.html';

const PRICING_TIERS = [
  { minLevel: 0, price: 34.99, label: 'Precio Base', color: 'from-slate-400 to-slate-500' },
  { minLevel: 5, price: 32.99, label: 'Descuento Jugador', color: 'from-green-400 to-emerald-500' },
  { minLevel: 10, price: 31.49, label: 'Precio Pro', color: 'from-blue-400 to-cyan-500' },
  { minLevel: 15, price: 30.49, label: 'Precio Premium', color: 'from-purple-400 to-violet-500' },
  { minLevel: 20, price: 29.00, label: 'Precio VIP', color: 'from-yellow-400 to-amber-500' },
];

const getCurrentTier = (level: number) => {
  for (let i = PRICING_TIERS.length - 1; i >= 0; i--) {
    if (level >= PRICING_TIERS[i].minLevel) return PRICING_TIERS[i];
  }
  return PRICING_TIERS[0];
};

const FEATURES = [
  { icon: Wifi, title: 'Conexión WiFi', desc: 'Controla desde tu móvil sin cables' },
  { icon: Smartphone, title: 'App iOS & Android', desc: 'Gestiona contenido desde la app' },
  { icon: Zap, title: 'LEDs de alta potencia', desc: 'Hologramas brillantes y nítidos' },
  { icon: Shield, title: 'Fácil instalación', desc: 'Plug & play, listo en minutos' },
];

const HOLOGRAM_EXAMPLES = [
  '🐉 Dragones 3D', '🦁 Animales', '🍔 Productos', '🌹 Flores',
  '🚗 Coches', '💍 Joyería', '🎮 Gaming', '📢 Publicidad',
];

export default function ProductLanding() {
  const [searchParams] = useSearchParams();
  const playerLevel = parseInt(searchParams.get('level') || '0', 10);
  const tier = getCurrentTier(playerLevel);
  const discount = Math.round(((34.99 - tier.price) / 34.99) * 100);

  const handleBuy = () => {
    window.open(ALIEXPRESS_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative py-12 px-4 text-center overflow-hidden">
        {/* Glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto">
          {/* Badge */}
          {playerLevel > 0 && (
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-4">
              <Star className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">
                Nivel {playerLevel} · {tier.label}
              </span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 leading-tight">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              3D Hologram Fan
            </span>
          </h1>
          <p className="text-white/60 text-lg mb-8">
            Proyector holográfico portátil con WiFi
          </p>

          {/* Product Image */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            <img
              src={hologramFanImg}
              alt="3D Hologram Fan - Proyector holográfico"
              className="relative w-72 h-72 object-contain mx-auto drop-shadow-[0_0_40px_rgba(0,200,255,0.35)]"
            />
            {discount > 0 && (
              <div className="absolute top-2 right-8 sm:right-16 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/40 animate-bounce">
                -{discount}%
              </div>
            )}
          </div>

          {/* Price */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-sm">
            {discount > 0 && (
              <p className="text-white/30 line-through text-lg mb-1">€34,99</p>
            )}
            <p className={`text-5xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
              €{tier.price.toFixed(2).replace('.', ',')}
            </p>
            {discount > 0 && (
              <p className="text-emerald-400 text-sm mt-2 font-medium">
                ¡Ahorraste €{(34.99 - tier.price).toFixed(2).replace('.', ',')} por tu nivel en Mystic Garden! 🎮
              </p>
            )}
            {discount === 0 && (
              <p className="text-white/40 text-sm mt-2">
                Juega Mystic Garden para desbloquear descuentos exclusivos 🔮
              </p>
            )}
          </div>

          {/* CTA */}
          <Button
            onClick={handleBuy}
            className={`w-full py-7 text-xl font-bold rounded-2xl bg-gradient-to-r ${tier.color} hover:opacity-90 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-0`}
          >
            <Truck className="w-6 h-6 mr-2" />
            Comprar Ahora
            <ExternalLink className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-white/30 text-xs mt-3">Envío desde AliExpress · Pago seguro</p>
        </div>
      </section>

      {/* Discount Tiers */}
      <section className="px-4 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">
          🎮 Descuentos por Nivel
        </h2>
        <div className="space-y-3">
          {PRICING_TIERS.map((t) => {
            const isActive = t.minLevel === tier.minLevel;
            const isUnlocked = playerLevel >= t.minLevel;
            const tierDiscount = Math.round(((34.99 - t.price) / 34.99) * 100);
            return (
              <div
                key={t.minLevel}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-white/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : isUnlocked
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${t.color} flex items-center justify-center text-sm font-bold ${!isUnlocked ? 'grayscale' : ''}`}>
                    {t.minLevel === 0 ? '🌱' : t.minLevel === 5 ? '⭐' : t.minLevel === 10 ? '🔥' : t.minLevel === 15 ? '💎' : '🏆'}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isActive ? 'text-cyan-300' : 'text-white/80'}`}>
                      {t.label}
                    </p>
                    <p className="text-white/40 text-xs">
                      {t.minLevel === 0 ? 'Sin requisito' : `Nivel ${t.minLevel}+`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isActive ? 'text-white text-lg' : 'text-white/70'}`}>
                    €{t.price.toFixed(2).replace('.', ',')}
                  </p>
                  {tierDiscount > 0 && (
                    <p className="text-emerald-400 text-xs">-{tierDiscount}%</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {playerLevel < 20 && (
          <p className="text-center text-white/30 text-xs mt-4">
            ¡Sigue jugando para desbloquear el mejor precio! 🚀
          </p>
        )}
      </section>

      {/* Features */}
      <section className="px-4 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">
          ✨ Características
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <f.icon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white/90">{f.title}</p>
              <p className="text-xs text-white/40 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hologram Examples */}
      <section className="px-4 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">
          🔮 ¿Qué puedes proyectar?
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {HOLOGRAM_EXAMPLES.map((ex) => (
            <div key={ex} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-sm">{ex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Second CTA */}
      <section className="px-4 py-10 max-w-lg mx-auto text-center">
        <div className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/20 rounded-2xl p-6">
          <p className="text-2xl font-bold mb-2">¿Listo para el futuro? 🔮</p>
          <p className="text-white/50 text-sm mb-4">
            Tu precio exclusivo: <span className="text-cyan-300 font-bold">€{tier.price.toFixed(2).replace('.', ',')}</span>
          </p>
          <Button
            onClick={handleBuy}
            className={`w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r ${tier.color} hover:opacity-90 text-white shadow-lg border-0`}
          >
            Comprar Ahora · €{tier.price.toFixed(2).replace('.', ',')}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-white/5">
        <p className="text-white/20 text-xs">
          Oferta exclusiva para jugadores de Mystic Garden 🌸
        </p>
      </footer>
    </div>
  );
}
