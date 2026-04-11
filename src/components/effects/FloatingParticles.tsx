import { useMemo } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

export const FloatingParticles = () => {
  const particles = useMemo(() => {
    const colors = [
      'rgba(255, 182, 193, 0.8)',
      'rgba(255, 215, 0, 0.6)',
      'rgba(147, 112, 219, 0.7)',
      'rgba(135, 206, 250, 0.6)',
      'rgba(255, 255, 255, 0.5)',
    ];
    
    return Array.from({ length: 8 }, (_, i): Particle => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
};
