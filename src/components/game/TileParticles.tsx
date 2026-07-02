import { useEffect, useState } from 'react';
import { FEATURE_FLAGS } from '@/config/featureFlags';

interface Particle {
  id: number;
  dx: number;
  dy: number;
  emoji: string;
}

interface Props {
  x: number;
  y: number;
  emoji?: string;
  onDone?: () => void;
}

/** Partículas ligeras al reventar un tile. Requiere contenedor `relative`. */
export const TileParticles = ({ x, y, emoji = '✨', onDone }: Props) => {
  const [parts] = useState<Particle[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 60,
      dy: (Math.random() - 0.5) * 60 - 20,
      emoji,
    }))
  );

  useEffect(() => {
    if (!FEATURE_FLAGS.tileParticles) { onDone?.(); return; }
    const t = setTimeout(() => onDone?.(), 600);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!FEATURE_FLAGS.tileParticles) return null;

  return (
    <div className="absolute pointer-events-none z-40" style={{ left: x, top: y }}>
      {parts.map((p) => (
        <span
          key={p.id}
          className="absolute text-sm animate-fade-out"
          style={{
            transform: `translate(${p.dx}px, ${p.dy}px)`,
            transition: 'transform 600ms ease-out, opacity 600ms ease-out',
            opacity: 0,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};
