import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wifi, Smartphone, Zap, Star, Shield, Truck, ShoppingCart, Check, Loader2, MapPin, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import hologramFanImg from '@/assets/hologram-fan-product.png';

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
  const paymentStatus = searchParams.get('payment');
  const tier = getCurrentTier(playerLevel);
  const discount = Math.round(((34.99 - tier.price) / 34.99) * 100);

  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: 'España',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckout = async () => {
    if (!form.customerName || !form.customerEmail || !form.shippingAddress || !form.shippingCity || !form.shippingPostalCode) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-product-payment', {
        body: {
          ...form,
          playerLevel,
          productName: '3D Hologram Fan',
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Error al procesar el pago: ' + (err.message || 'Inténtalo de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">¡Pedido Recibido! 🎉</h1>
          <p className="text-white/60 mb-4">
            Tu 3D Hologram Fan está en camino. Recibirás un email de confirmación con los detalles del envío.
          </p>
          <p className="text-white/40 text-sm">
            Tiempo estimado de entrega: 7-15 días laborables
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="mt-8 bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            Volver al juego 🎮
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative py-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto">
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            {discount > 0 && (
              <p className="text-white/30 line-through text-lg mb-1">€34,99</p>
            )}
            <p className={`text-5xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
              €{tier.price.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-white/40 text-xs mt-2">Envío incluido · Pago seguro con Stripe</p>
            {discount > 0 && (
              <p className="text-emerald-400 text-sm mt-1 font-medium">
                ¡Ahorraste €{(34.99 - tier.price).toFixed(2).replace('.', ',')} por tu nivel! 🎮
              </p>
            )}
          </div>

          {/* CTA or Checkout Form */}
          {!showCheckout ? (
            <Button
              onClick={() => setShowCheckout(true)}
              className={`w-full py-7 text-xl font-bold rounded-2xl bg-gradient-to-r ${tier.color} hover:opacity-90 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-0`}
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              Comprar · €{tier.price.toFixed(2).replace('.', ',')}
            </Button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-4">
              <h3 className="text-lg font-bold text-center mb-2">📦 Datos de Envío</h3>

              {/* Name */}
              <div>
                <label className="text-white/60 text-xs mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Nombre completo *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={e => updateField('customerName', e.target.value)}
                  placeholder="Tu nombre y apellidos"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-white/60 text-xs mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email *</label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={e => updateField('customerEmail', e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-white/60 text-xs mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={e => updateField('customerPhone', e.target.value)}
                  placeholder="+34 600 000 000"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-white/60 text-xs mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección *</label>
                <input
                  type="text"
                  value={form.shippingAddress}
                  onChange={e => updateField('shippingAddress', e.target.value)}
                  placeholder="Calle, número, piso, puerta"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* City + Postal Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1">Ciudad *</label>
                  <input
                    type="text"
                    value={form.shippingCity}
                    onChange={e => updateField('shippingCity', e.target.value)}
                    placeholder="Madrid"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1">C. Postal *</label>
                  <input
                    type="text"
                    value={form.shippingPostalCode}
                    onChange={e => updateField('shippingPostalCode', e.target.value)}
                    placeholder="28001"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="text-white/60 text-xs mb-1">País</label>
                <input
                  type="text"
                  value={form.shippingCountry}
                  onChange={e => updateField('shippingCountry', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r ${tier.color} hover:opacity-90 text-white shadow-lg border-0 mt-2`}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...</>
                ) : (
                  <><Truck className="w-5 h-5 mr-2" /> Pagar €{tier.price.toFixed(2).replace('.', ',')} · Envío incluido</>
                )}
              </Button>

              <button
                onClick={() => setShowCheckout(false)}
                className="w-full text-white/30 text-xs hover:text-white/50 transition-colors mt-1"
              >
                ← Volver
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Discount Tiers */}
      <section className="px-4 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">🎮 Descuentos por Nivel</h2>
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
                    <p className={`font-semibold text-sm ${isActive ? 'text-cyan-300' : 'text-white/80'}`}>{t.label}</p>
                    <p className="text-white/40 text-xs">{t.minLevel === 0 ? 'Sin requisito' : `Nivel ${t.minLevel}+`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isActive ? 'text-white text-lg' : 'text-white/70'}`}>
                    €{t.price.toFixed(2).replace('.', ',')}
                  </p>
                  {tierDiscount > 0 && <p className="text-emerald-400 text-xs">-{tierDiscount}%</p>}
                </div>
              </div>
            );
          })}
        </div>
        {playerLevel < 20 && (
          <p className="text-center text-white/30 text-xs mt-4">¡Sigue jugando para desbloquear el mejor precio! 🚀</p>
        )}
      </section>

      {/* Features */}
      <section className="px-4 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">✨ Características</h2>
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
        <h2 className="text-xl font-bold text-center mb-6">🔮 ¿Qué puedes proyectar?</h2>
        <div className="grid grid-cols-4 gap-2">
          {HOLOGRAM_EXAMPLES.map((ex) => (
            <div key={ex} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-sm">{ex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-white/5">
        <p className="text-white/20 text-xs">Oferta exclusiva para jugadores de Mystic Garden 🌸</p>
        <p className="text-white/10 text-xs mt-1">Pago seguro con Stripe · Envío 7-15 días</p>
      </footer>
    </div>
  );
}
