import { FloatingParticles } from './FloatingParticles';
import { FloatingButterflies } from './FloatingButterflies';
import { FloatingMushrooms } from './FloatingMushrooms';

export const MysticBackground = () => {
  return (
    <>
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-[-1]"
        style={{
          backgroundImage: 'url(/mystic-forest-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Subtle overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      
      {/* Visual Effects */}
      <FloatingParticles />
      <FloatingButterflies />
      <FloatingMushrooms />
    </>
  );
};
