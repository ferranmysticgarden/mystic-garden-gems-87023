import { useMemo } from 'react';

interface Mushroom {
  id: number;
  left: string;
  bottom: string;
  scale: number;
  delay: number;
}

export const FloatingMushrooms = () => {
  const mushrooms = useMemo(() => {
    const positions = [
      { left: '3%', bottom: '5%' },
      { left: '85%', bottom: '6%' },
    ];
    
    return positions.map((pos, i): Mushroom => ({
      id: i,
      left: pos.left,
      bottom: pos.bottom,
      scale: Math.random() * 0.3 + 0.7,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {mushrooms.map((mushroom) => (
        <div
          key={mushroom.id}
          className="absolute animate-pulse-glow"
          style={{
            left: mushroom.left,
            bottom: mushroom.bottom,
            transform: `scale(${mushroom.scale})`,
            animationDelay: `${mushroom.delay}s`,
            willChange: 'opacity',
          }}
        >
          <span className="text-4xl">🍄</span>
        </div>
      ))}
    </div>
  );
};
