import { useState, useEffect } from 'react';

interface FirstMoveHintProps {
  levelId: number;
}

/**
 * Interactive tutorial hint for Level 1.
 * Shows animated arrows pointing at a specific tile pair that forms a match.
 * Auto-dismisses after 6 seconds or on tap.
 */
export const FirstMoveHint = ({ levelId }: FirstMoveHintProps) => {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'step1' | 'step2'>('step1');

  useEffect(() => {
    if (levelId !== 1) return;
    const seen = localStorage.getItem('first_move_hint_seen');
    if (seen) return;

    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [levelId]);

  useEffect(() => {
    if (!visible) return;
    // After 3s switch to step 2
    const step2 = setTimeout(() => setPhase('step2'), 3000);
    const autoDismiss = setTimeout(() => {
      localStorage.setItem('first_move_hint_seen', 'true');
      setVisible(false);
    }, 6000);
    return () => {
      clearTimeout(step2);
      clearTimeout(autoDismiss);
    };
  }, [visible]);

  const dismiss = () => {
    localStorage.setItem('first_move_hint_seen', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none animate-fade-in"
      onClick={dismiss}
    >
      {/* Semi-transparent overlay to focus attention */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={dismiss} />
      
      <div
        className="pointer-events-auto relative px-6 py-4 rounded-2xl text-center max-w-xs mx-4 animate-scale-in"
        style={{
          background: 'linear-gradient(135deg, hsl(270 60% 30% / 0.98), hsl(280 50% 20% / 0.98))',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)',
          border: '2px solid rgba(168, 85, 247, 0.6)',
        }}
      >
        {phase === 'step1' ? (
          <>
            <div className="text-4xl mb-2 animate-bounce">👆</div>
            <p className="text-base font-bold text-white/95">
              Paso 1: Toca una flor
            </p>
            <p className="text-sm text-white/70 mt-1">
              Busca 3 flores iguales juntas
            </p>
            <div className="flex justify-center gap-1 mt-3">
              <span className="text-3xl animate-pulse">🌸</span>
              <span className="text-3xl animate-pulse" style={{ animationDelay: '150ms' }}>🌸</span>
              <span className="text-3xl animate-pulse" style={{ animationDelay: '300ms' }}>🌸</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center items-center gap-2 mb-2">
              <span className="text-3xl">🌸</span>
              <span className="text-2xl animate-bounce">↔️</span>
              <span className="text-3xl">🌺</span>
            </div>
            <p className="text-base font-bold text-white/95">
              Paso 2: Toca la de al lado
            </p>
            <p className="text-sm text-white/70 mt-1">
              Se intercambian y ¡haces combo!
            </p>
            <div className="mt-3 bg-green-500/20 border border-green-400/40 rounded-lg px-3 py-2">
              <p className="text-green-300 text-sm font-semibold">✨ ¡Combina 3 = puntos!</p>
            </div>
          </>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-3">
          <div className={`w-2 h-2 rounded-full transition-all ${phase === 'step1' ? 'bg-purple-400 scale-125' : 'bg-white/30'}`} />
          <div className={`w-2 h-2 rounded-full transition-all ${phase === 'step2' ? 'bg-purple-400 scale-125' : 'bg-white/30'}`} />
        </div>

        <p className="text-xs text-white/40 mt-2">Toca para cerrar</p>
      </div>
    </div>
  );
};
