import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface VisualGardenProps {
  levelsCompleted: number;
  maxLevel?: number;
}

// Garden grows in stages based on levels completed
const getGardenStage = (levels: number): {
  stage: number;
  name: string;
  emoji: string;
  flowers: string[];
  description: string;
  nextMilestone: number | null;
} => {
  if (levels === 0) {
    return {
      stage: 0,
      name: 'Semilla',
      emoji: '🌱',
      flowers: ['🌱'],
      description: 'Tu jardín acaba de nacer...',
      nextMilestone: 1,
    };
  } else if (levels < 3) {
    return {
      stage: 1,
      name: 'Brote',
      emoji: '🌿',
      flowers: ['🌱', '🌿'],
      description: 'Los primeros brotes aparecen',
      nextMilestone: 3,
    };
  } else if (levels < 5) {
    return {
      stage: 2,
      name: 'Capullo',
      emoji: '🌷',
      flowers: ['🌿', '🌷', '🌱'],
      description: '¡Los capullos están floreciendo!',
      nextMilestone: 5,
    };
  } else if (levels < 10) {
    return {
      stage: 3,
      name: 'Floreciente',
      emoji: '🌸',
      flowers: ['🌸', '🌷', '🌿', '🌺'],
      description: 'Tu jardín está floreciendo',
      nextMilestone: 10,
    };
  } else if (levels < 15) {
    return {
      stage: 4,
      name: 'Jardín Hermoso',
      emoji: '🌺',
      flowers: ['🌸', '🌺', '🌻', '🌷', '🌹'],
      description: '¡Un jardín hermoso!',
      nextMilestone: 15,
    };
  } else if (levels < 25) {
    return {
      stage: 5,
      name: 'Jardín Mágico',
      emoji: '🪻',
      flowers: ['🌸', '🌺', '🌻', '🌷', '🌹', '🪻', '💐'],
      description: '¡La magia florece!',
      nextMilestone: 25,
    };
  } else if (levels < 40) {
    return {
      stage: 6,
      name: 'Paraíso Floral',
      emoji: '🏵️',
      flowers: ['🌸', '🌺', '🌻', '🌷', '🌹', '🪻', '💐', '🏵️', '🪷'],
      description: '¡Un paraíso de flores!',
      nextMilestone: 40,
    };
  } else {
    return {
      stage: 7,
      name: 'Jardín Legendario',
      emoji: '✨',
      flowers: ['🌸', '🌺', '🌻', '🌷', '🌹', '🪻', '💐', '🏵️', '🪷', '✨', '💮'],
      description: '¡LEGENDARIO! Tu jardín es perfecto',
      nextMilestone: null,
    };
  }
};

// Generate flower positions for visual display
const generateFlowerPositions = (flowers: string[], seed: number): Array<{ flower: string; x: number; y: number; delay: number; scale: number }> => {
  const positions: Array<{ flower: string; x: number; y: number; delay: number; scale: number }> = [];
  
  // Use deterministic "random" based on seed for consistent display
  const pseudoRandom = (n: number) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };
  
  // Generate positions based on number of flowers
  const numFlowers = Math.min(flowers.length * 2 + 3, 15);
  
  for (let i = 0; i < numFlowers; i++) {
    const flower = flowers[i % flowers.length];
    positions.push({
      flower,
      x: 10 + pseudoRandom(i * 3) * 80, // 10-90% from left
      y: 20 + pseudoRandom(i * 7) * 60, // 20-80% from top
      delay: pseudoRandom(i * 11) * 2, // 0-2s delay
      scale: 0.7 + pseudoRandom(i * 13) * 0.6, // 0.7-1.3 scale
    });
  }
  
  return positions;
};

export const VisualGarden = ({ levelsCompleted, maxLevel = 50 }: VisualGardenProps) => {
  const garden = useMemo(() => getGardenStage(levelsCompleted), [levelsCompleted]);
  const flowerPositions = useMemo(
    () => generateFlowerPositions(garden.flowers, levelsCompleted),
    [garden.flowers, levelsCompleted]
  );
  
  const progressPercent = garden.nextMilestone 
    ? Math.min(100, (levelsCompleted / garden.nextMilestone) * 100)
    : 100;

  return (
    <div className="relative bg-gradient-to-b from-green-900/40 via-emerald-900/30 to-teal-900/40 rounded-2xl p-4 border border-green-500/30 overflow-hidden">
      {/* Sky gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-sky-900/10 to-sky-800/20 pointer-events-none" />
      
      {/* Garden visualization area */}
      <div className="relative h-28 mb-3">
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-900/60 to-green-800/40 rounded-b-xl" />
        
        {/* Flowers with animations */}
        {flowerPositions.map((pos, index) => (
          <div
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              animationDelay: `${pos.delay}s`,
              animationDuration: '3s',
              fontSize: `${pos.scale * 1.5}rem`,
            }}
          >
            {pos.flower}
          </div>
        ))}
        
        {/* Sparkle effects for higher stages */}
        {garden.stage >= 5 && (
          <div className="absolute top-2 right-2">
            <Sparkles className="w-5 h-5 text-yellow-300/60 animate-pulse" />
          </div>
        )}
        
        {/* Stage badge */}
        <div className="absolute top-1 left-1 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <span className="text-lg">{garden.emoji}</span>
          <span className="text-white text-xs font-semibold">{garden.name}</span>
        </div>
      </div>
      
      {/* Progress and description */}
      <div className="relative">
        <p className="text-green-200/90 text-sm text-center mb-2">
          {garden.description}
        </p>
        
        {/* Progress bar to next milestone */}
        {garden.nextMilestone && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-green-300/70">
              <span>Nivel {levelsCompleted}</span>
              <span>Próximo: Nivel {garden.nextMilestone}</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Legendary badge */}
        {garden.stage === 7 && (
          <div className="mt-2 text-center">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 px-3 py-1 rounded-full border border-yellow-400/50">
              <span className="text-yellow-300 text-xs font-bold">✨ JARDÍN LEGENDARIO ✨</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
