import { useMemo } from 'react';

interface Butterfly {
  id: number;
  left: string;
  top: string;
  scale: number;
  delay: number;
  duration: number;
  emoji: string;
}

export const FloatingButterflies = () => {
  const butterflies = useMemo(() => {
    const positions = [
      { left: '5%', top: '10%' },
      { left: '90%', top: '15%' },
      { left: '8%', top: '75%' },
    ];
    
    return positions.map((pos, i): Butterfly => ({
      id: i,
      left: pos.left,
      top: pos.top,
      scale: Math.random() * 0.4 + 0.8,
      delay: Math.random() * 3,
      duration: Math.random() * 5 + 8,
      emoji: '🦋',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {butterflies.map((butterfly) => (
        <div
          key={butterfly.id}
          className="absolute animate-float-butterfly"
          style={{
            left: butterfly.left,
            top: butterfly.top,
            transform: `scale(${butterfly.scale})`,
            animationDelay: `${butterfly.delay}s`,
            animationDuration: `${butterfly.duration}s`,
            willChange: 'transform',
          }}
        >
          <span className="text-3xl">{butterfly.emoji}</span>
        </div>
      ))}
    </div>
  );
};
