import { useState, useEffect } from 'react';

interface FirstMoveHintProps {
  levelId: number;
}

/**
 * Non-blocking hint that appears on Level 1 for first-time players.
 * Shows a pulsing hand emoji pointing at the board with a short tip.
 * Auto-dismisses after 4 seconds or on tap.
 */
export const FirstMoveHint = ({ levelId }: FirstMoveHintProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (levelId !== 1) return;
    const seen = localStorage.getItem('first_move_hint_seen');
    if (seen) return;

    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [levelId]);

  useEffect(() => {
    if (!visible) return;
    const autoDismiss = setTimeout(() => {
      localStorage.setItem('first_move_hint_seen', 'true');
      setVisible(false);
    }, 4000);
    return () => clearTimeout(autoDismiss);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center pb-32 pointer-events-none animate-fade-in"
      onClick={() => {
        localStorage.setItem('first_move_hint_seen', 'true');
        setVisible(false);
      }}
    >
      <div
        className="pointer-events-auto px-5 py-3 rounded-2xl text-center animate-bounce"
        style={{
          background: 'linear-gradient(135deg, hsl(270 60% 30% / 0.95), hsl(280 50% 20% / 0.95))',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
          border: '2px solid rgba(168, 85, 247, 0.5)',
        }}
      >
        <div className="text-3xl mb-1">👆</div>
        <p className="text-sm font-bold text-white/90">
          Toca una flor y luego una de al lado para intercambiarlas
        </p>
        <p className="text-xs text-white/60 mt-1">¡Combina 3 iguales!</p>
      </div>
    </div>
  );
};
