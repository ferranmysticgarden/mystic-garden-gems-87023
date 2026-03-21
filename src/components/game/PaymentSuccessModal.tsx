import { useEffect, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';

interface PaymentSuccessModalProps {
  show: boolean;
  productName: string;
  rewardText: string;
  onClose: () => void;
}

export const PaymentSuccessModal = ({ show, productName, rewardText, onClose }: PaymentSuccessModalProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Auto-close after 6 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setVisible(false); setTimeout(onClose, 300); }} />
      
      {/* Modal */}
      <div className={`relative bg-gradient-to-b from-emerald-900/95 to-green-950/95 border-2 border-emerald-400/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_60px_rgba(16,185,129,0.3)] transition-transform duration-300 ${visible ? 'scale-100' : 'scale-90'}`}>
        {/* Close button */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success icon */}
        <div className="relative mx-auto mb-4 w-20 h-20">
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Sparkles */}
        <div className="flex justify-center gap-1 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <Sparkles className="w-5 h-5 text-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-white mb-1">
          ¡Pago Exitoso! 🎉
        </h2>
        
        {/* Product */}
        <p className="text-emerald-300 font-semibold text-lg mb-3">
          {productName}
        </p>

        {/* Reward detail */}
        <div className="bg-white/10 rounded-2xl px-4 py-3 mb-5">
          <p className="text-white text-base font-medium">
            {rewardText}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
        >
          ¡Genial! ✨
        </button>

        <p className="text-white/30 text-xs mt-3">
          Tu recompensa ya está aplicada
        </p>
      </div>
    </div>
  );
};
