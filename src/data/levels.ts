export interface Level {
  id: number;
  objective: {
    type: 'collect' | 'clear' | 'score';
    target: string;
    count: number;
  };
  moves: number;
  stars: {
    one: number;
    two: number;
    three: number;
  };
  reward: {
    leaves: number;
    gems?: number;
  };
}

export const LEVELS: Level[] = [
  { id: 1, objective: { type: 'score', target: 'points', count: 1000 }, moves: 20, stars: { one: 1000, two: 1500, three: 2000 }, reward: { leaves: 10 } },
  { id: 2, objective: { type: 'collect', target: '🌸', count: 10 }, moves: 18, stars: { one: 10, two: 12, three: 15 }, reward: { leaves: 15 } },
  { id: 3, objective: { type: 'collect', target: '🍃', count: 15 }, moves: 20, stars: { one: 15, two: 18, three: 20 }, reward: { leaves: 20 } },
  { id: 4, objective: { type: 'score', target: 'points', count: 1500 }, moves: 22, stars: { one: 1500, two: 2000, three: 2500 }, reward: { leaves: 25 } },
  { id: 5, objective: { type: 'collect', target: '🌺', count: 12 }, moves: 20, stars: { one: 12, two: 15, three: 18 }, reward: { leaves: 30, gems: 5 } },
  
  { id: 6, objective: { type: 'collect', target: '🌼', count: 20 }, moves: 25, stars: { one: 20, two: 25, three: 30 }, reward: { leaves: 35 } },
  { id: 7, objective: { type: 'score', target: 'points', count: 2000 }, moves: 20, stars: { one: 2000, two: 2500, three: 3000 }, reward: { leaves: 40 } },
  { id: 8, objective: { type: 'collect', target: '🌸', count: 15 }, moves: 18, stars: { one: 15, two: 18, three: 22 }, reward: { leaves: 45 } },
  { id: 9, objective: { type: 'collect', target: '🍃', count: 25 }, moves: 22, stars: { one: 25, two: 30, three: 35 }, reward: { leaves: 50 } },
  { id: 10, objective: { type: 'score', target: 'points', count: 2500 }, moves: 25, stars: { one: 2500, two: 3000, three: 3500 }, reward: { leaves: 60, gems: 10 } },
  
  { id: 11, objective: { type: 'collect', target: '🌺', count: 18 }, moves: 20, stars: { one: 18, two: 22, three: 26 }, reward: { leaves: 65 } },
  { id: 12, objective: { type: 'collect', target: '🌼', count: 20 }, moves: 22, stars: { one: 20, two: 25, three: 30 }, reward: { leaves: 70 } },
  { id: 13, objective: { type: 'score', target: 'points', count: 3000 }, moves: 25, stars: { one: 3000, two: 3500, three: 4000 }, reward: { leaves: 75 } },
  { id: 14, objective: { type: 'collect', target: '🌸', count: 25 }, moves: 20, stars: { one: 25, two: 30, three: 35 }, reward: { leaves: 80 } },
  { id: 15, objective: { type: 'collect', target: '🍃', count: 30 }, moves: 25, stars: { one: 30, two: 35, three: 40 }, reward: { leaves: 90, gems: 15 } },
  
  { id: 16, objective: { type: 'score', target: 'points', count: 3500 }, moves: 22, stars: { one: 3500, two: 4000, three: 4500 }, reward: { leaves: 95 } },
  { id: 17, objective: { type: 'collect', target: '🌺', count: 22 }, moves: 20, stars: { one: 22, two: 26, three: 30 }, reward: { leaves: 100 } },
  { id: 18, objective: { type: 'collect', target: '🌼', count: 28 }, moves: 25, stars: { one: 28, two: 32, three: 36 }, reward: { leaves: 105 } },
  { id: 19, objective: { type: 'score', target: 'points', count: 4000 }, moves: 25, stars: { one: 4000, two: 4500, three: 5000 }, reward: { leaves: 110 } },
  { id: 20, objective: { type: 'collect', target: '🌸', count: 30 }, moves: 22, stars: { one: 30, two: 35, three: 40 }, reward: { leaves: 120, gems: 20 } },
  
  { id: 21, objective: { type: 'collect', target: '🍃', count: 35 }, moves: 25, stars: { one: 35, two: 40, three: 45 }, reward: { leaves: 125 } },
  { id: 22, objective: { type: 'score', target: 'points', count: 4500 }, moves: 25, stars: { one: 4500, two: 5000, three: 5500 }, reward: { leaves: 130 } },
  { id: 23, objective: { type: 'collect', target: '🌺', count: 28 }, moves: 22, stars: { one: 28, two: 32, three: 36 }, reward: { leaves: 135 } },
  { id: 24, objective: { type: 'collect', target: '🌼', count: 32 }, moves: 25, stars: { one: 32, two: 36, three: 40 }, reward: { leaves: 140 } },
  { id: 25, objective: { type: 'score', target: 'points', count: 5000 }, moves: 25, stars: { one: 5000, two: 5500, three: 6000 }, reward: { leaves: 150, gems: 25 } },
  
  { id: 26, objective: { type: 'collect', target: '🌸', count: 35 }, moves: 22, stars: { one: 35, two: 40, three: 45 }, reward: { leaves: 155 } },
  { id: 27, objective: { type: 'collect', target: '🍃', count: 40 }, moves: 25, stars: { one: 40, two: 45, three: 50 }, reward: { leaves: 160 } },
  { id: 28, objective: { type: 'score', target: 'points', count: 5500 }, moves: 25, stars: { one: 5500, two: 6000, three: 6500 }, reward: { leaves: 165 } },
  { id: 29, objective: { type: 'collect', target: '🌺', count: 32 }, moves: 22, stars: { one: 32, two: 36, three: 40 }, reward: { leaves: 170 } },
  { id: 30, objective: { type: 'collect', target: '🌼', count: 38 }, moves: 25, stars: { one: 38, two: 42, three: 46 }, reward: { leaves: 180, gems: 30 } },
  
  { id: 31, objective: { type: 'score', target: 'points', count: 6000 }, moves: 25, stars: { one: 6000, two: 6500, three: 7000 }, reward: { leaves: 185 } },
  { id: 32, objective: { type: 'collect', target: '🌸', count: 40 }, moves: 22, stars: { one: 40, two: 45, three: 50 }, reward: { leaves: 190 } },
  { id: 33, objective: { type: 'collect', target: '🍃', count: 45 }, moves: 25, stars: { one: 45, two: 50, three: 55 }, reward: { leaves: 195 } },
  { id: 34, objective: { type: 'score', target: 'points', count: 6500 }, moves: 25, stars: { one: 6500, two: 7000, three: 7500 }, reward: { leaves: 200 } },
  { id: 35, objective: { type: 'collect', target: '🌺', count: 38 }, moves: 22, stars: { one: 38, two: 42, three: 46 }, reward: { leaves: 210, gems: 35 } },
  
  { id: 36, objective: { type: 'collect', target: '🌼', count: 42 }, moves: 25, stars: { one: 42, two: 46, three: 50 }, reward: { leaves: 215 } },
  { id: 37, objective: { type: 'score', target: 'points', count: 7000 }, moves: 25, stars: { one: 7000, two: 7500, three: 8000 }, reward: { leaves: 220 } },
  { id: 38, objective: { type: 'collect', target: '🌸', count: 45 }, moves: 22, stars: { one: 45, two: 50, three: 55 }, reward: { leaves: 225 } },
  { id: 39, objective: { type: 'collect', target: '🍃', count: 50 }, moves: 25, stars: { one: 50, two: 55, three: 60 }, reward: { leaves: 230 } },
  { id: 40, objective: { type: 'score', target: 'points', count: 7500 }, moves: 25, stars: { one: 7500, two: 8000, three: 8500 }, reward: { leaves: 240, gems: 40 } },
  
  { id: 41, objective: { type: 'collect', target: '🌺', count: 42 }, moves: 22, stars: { one: 42, two: 46, three: 50 }, reward: { leaves: 245 } },
  { id: 42, objective: { type: 'collect', target: '🌼', count: 48 }, moves: 25, stars: { one: 48, two: 52, three: 56 }, reward: { leaves: 250 } },
  { id: 43, objective: { type: 'score', target: 'points', count: 8000 }, moves: 25, stars: { one: 8000, two: 8500, three: 9000 }, reward: { leaves: 255 } },
  { id: 44, objective: { type: 'collect', target: '🌸', count: 50 }, moves: 22, stars: { one: 50, two: 55, three: 60 }, reward: { leaves: 260 } },
  { id: 45, objective: { type: 'collect', target: '🍃', count: 55 }, moves: 25, stars: { one: 55, two: 60, three: 65 }, reward: { leaves: 270, gems: 45 } },
  
  { id: 46, objective: { type: 'score', target: 'points', count: 8500 }, moves: 25, stars: { one: 8500, two: 9000, three: 9500 }, reward: { leaves: 275 } },
  { id: 47, objective: { type: 'collect', target: '🌺', count: 48 }, moves: 22, stars: { one: 48, two: 52, three: 56 }, reward: { leaves: 280 } },
  { id: 48, objective: { type: 'collect', target: '🌼', count: 52 }, moves: 25, stars: { one: 52, two: 56, three: 60 }, reward: { leaves: 285 } },
  { id: 49, objective: { type: 'score', target: 'points', count: 9000 }, moves: 25, stars: { one: 9000, two: 9500, three: 10000 }, reward: { leaves: 290 } },
  { id: 50, objective: { type: 'collect', target: '🌸', count: 60 }, moves: 30, stars: { one: 60, two: 65, three: 70 }, reward: { leaves: 300, gems: 50 } },
];
