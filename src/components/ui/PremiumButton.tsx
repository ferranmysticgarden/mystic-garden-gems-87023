import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  price?: string;
  variant?: 'gold' | 'red' | 'orange' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * PremiumButton - Botón de monetización con aspecto premium y alto contraste
 * Diseñado para €0.49 y €0.99 offers
 */
export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, loading, price, variant = 'gold', size = 'md', children, disabled, ...props }, ref) => {
    
    const variants = {
      gold: 'from-yellow-400 via-amber-400 to-orange-500 hover:from-yellow-300 hover:via-amber-300 hover:to-orange-400 shadow-yellow-500/50 border-yellow-300/70',
      red: 'from-red-400 via-rose-500 to-pink-500 hover:from-red-300 hover:via-rose-400 hover:to-pink-400 shadow-red-500/50 border-red-300/70',
      orange: 'from-orange-400 via-amber-500 to-red-500 hover:from-orange-300 hover:via-amber-400 hover:to-red-400 shadow-orange-500/50 border-orange-300/70',
      purple: 'from-purple-400 via-violet-500 to-indigo-500 hover:from-purple-300 hover:via-violet-400 hover:to-indigo-400 shadow-purple-500/50 border-purple-300/70',
    };

    const sizes = {
      sm: 'py-3 px-4 text-base rounded-xl',
      md: 'py-4 px-6 text-lg rounded-xl',
      lg: 'py-5 px-8 text-xl rounded-2xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "relative w-full font-bold text-white",
          "bg-gradient-to-r",
          // Variant gradient
          variants[variant],
          // Size
          sizes[size],
          // Premium effects
          "shadow-lg border-2",
          "transition-all duration-150 ease-out",
          "transform hover:scale-[1.03] active:scale-[0.97]",
          // Pulse animation for attention
          "animate-pulse-slow",
          // Disabled state
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
        </div>
        
        {/* Content */}
        <span className="relative flex items-center justify-center gap-2 drop-shadow-md">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            children
          )}
        </span>
        
        {/* Price badge */}
        {price && !loading && (
          <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-yellow-400">
            {price}
          </span>
        )}
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";
