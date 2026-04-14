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
    gems?: number;
  };
}

export const LEVELS: Level[] = [
  // Niveles 1-3: MUY FÁCILES - enganchar al jugador, victoria garantizada
  { id: 1, objective: { type: 'score', target: 'points', count: 200 }, moves: 45, stars: { one: 200, two: 400, three: 600 }, reward: { gems: 15 } },
  { id: 2, objective: { type: 'collect', target: '🌸', count: 4 }, moves: 30, stars: { one: 4, two: 6, three: 8 }, reward: { gems: 5 } },
  { id: 3, objective: { type: 'collect', target: '🍃', count: 5 }, moves: 28, stars: { one: 5, two: 7, three: 9 }, reward: { gems: 5 } },
  // Niveles 4-6: Ligeramente difíciles - primera frustración leve
  // Niveles 4-5: PRIMER MURO — frustración controlada para monetizar
  { id: 4, objective: { type: 'score', target: 'points', count: 800 }, moves: 16, stars: { one: 800, two: 1100, three: 1400 }, reward: { gems: 10 } },
  { id: 5, objective: { type: 'collect', target: '🌺', count: 8 }, moves: 14, stars: { one: 8, two: 10, three: 12 }, reward: { gems: 5 } },
  
  // Nivel 6: Transición - reducido 20% (22→18)
  { id: 6, objective: { type: 'collect', target: '🌼', count: 10 }, moves: 18, stars: { one: 10, two: 12, three: 14 }, reward: {} },
  
  // Niveles 7-8: PRIMER BLOQUEO REAL - reducidos 20%
  { id: 7, objective: { type: 'score', target: 'points', count: 1100 }, moves: 16, stars: { one: 1100, two: 1400, three: 1700 }, reward: {} },
  { id: 8, objective: { type: 'collect', target: '🌸', count: 12 }, moves: 15, stars: { one: 12, two: 14, three: 16 }, reward: {} },
  // Niveles 9-10: Reducidos 30%
  { id: 9, objective: { type: 'collect', target: '🍃', count: 14 }, moves: 14, stars: { one: 14, two: 16, three: 19 }, reward: {} },
   // NIVEL 10: MURO DE CONVERSIÓN - reducido 30% (17→12)
   { id: 10, objective: { type: 'score', target: 'points', count: 1400 }, moves: 12, stars: { one: 1400, two: 1700, three: 2000 }, reward: { gems: 10 } },
  
  // Niveles 11-12: Continúa el challenge
  { id: 11, objective: { type: 'collect', target: '🌺', count: 20 }, moves: 19, stars: { one: 20, two: 24, three: 28 }, reward: {} },
  { id: 12, objective: { type: 'collect', target: '🌼', count: 22 }, moves: 20, stars: { one: 22, two: 27, three: 32 }, reward: {} },
  { id: 13, objective: { type: 'score', target: 'points', count: 3000 }, moves: 25, stars: { one: 3000, two: 3500, three: 4000 }, reward: {} },
  { id: 14, objective: { type: 'collect', target: '🌸', count: 25 }, moves: 20, stars: { one: 25, two: 30, three: 35 }, reward: {} },
  
  // MICRO-MURO DE DIFICULTAD: Niveles 15-18 más difíciles para generar frustración controlada
  // -3 movimientos y +15% objetivo
  { id: 15, objective: { type: 'collect', target: '🍃', count: 35 }, moves: 22, stars: { one: 35, two: 40, three: 45 }, reward: { gems: 15 } },
  { id: 16, objective: { type: 'score', target: 'points', count: 4000 }, moves: 19, stars: { one: 4000, two: 4500, three: 5000 }, reward: {} },
  { id: 17, objective: { type: 'collect', target: '🌺', count: 26 }, moves: 17, stars: { one: 26, two: 30, three: 34 }, reward: {} },
  { id: 18, objective: { type: 'collect', target: '🌼', count: 32 }, moves: 20, stars: { one: 32, two: 36, three: 40 }, reward: {} },
  
  // Después del muro, se relaja un poco
  { id: 19, objective: { type: 'score', target: 'points', count: 4000 }, moves: 25, stars: { one: 4000, two: 4500, three: 5000 }, reward: {} },
  { id: 20, objective: { type: 'collect', target: '🌸', count: 30 }, moves: 22, stars: { one: 30, two: 35, three: 40 }, reward: { gems: 20 } },
  
  { id: 21, objective: { type: 'collect', target: '🍃', count: 35 }, moves: 25, stars: { one: 35, two: 40, three: 45 }, reward: {} },
  { id: 22, objective: { type: 'score', target: 'points', count: 4500 }, moves: 25, stars: { one: 4500, two: 5000, three: 5500 }, reward: {} },
  { id: 23, objective: { type: 'collect', target: '🌺', count: 28 }, moves: 22, stars: { one: 28, two: 32, three: 36 }, reward: {} },
  { id: 24, objective: { type: 'collect', target: '🌼', count: 32 }, moves: 25, stars: { one: 32, two: 36, three: 40 }, reward: {} },
  { id: 25, objective: { type: 'score', target: 'points', count: 5000 }, moves: 25, stars: { one: 5000, two: 5500, three: 6000 }, reward: { gems: 25 } },
  
  { id: 26, objective: { type: 'collect', target: '🌸', count: 35 }, moves: 22, stars: { one: 35, two: 40, three: 45 }, reward: {} },
  { id: 27, objective: { type: 'collect', target: '🍃', count: 40 }, moves: 25, stars: { one: 40, two: 45, three: 50 }, reward: {} },
  { id: 28, objective: { type: 'score', target: 'points', count: 5500 }, moves: 25, stars: { one: 5500, two: 6000, three: 6500 }, reward: {} },
  { id: 29, objective: { type: 'collect', target: '🌺', count: 32 }, moves: 22, stars: { one: 32, two: 36, three: 40 }, reward: {} },
  { id: 30, objective: { type: 'collect', target: '🌼', count: 38 }, moves: 25, stars: { one: 38, two: 42, three: 46 }, reward: { gems: 30 } },
  
  { id: 31, objective: { type: 'score', target: 'points', count: 6000 }, moves: 25, stars: { one: 6000, two: 6500, three: 7000 }, reward: {} },
  { id: 32, objective: { type: 'collect', target: '🌸', count: 40 }, moves: 22, stars: { one: 40, two: 45, three: 50 }, reward: {} },
  { id: 33, objective: { type: 'collect', target: '🍃', count: 45 }, moves: 25, stars: { one: 45, two: 50, three: 55 }, reward: {} },
  { id: 34, objective: { type: 'score', target: 'points', count: 6500 }, moves: 25, stars: { one: 6500, two: 7000, three: 7500 }, reward: {} },
  { id: 35, objective: { type: 'collect', target: '🌺', count: 38 }, moves: 22, stars: { one: 38, two: 42, three: 46 }, reward: { gems: 35 } },
  
  { id: 36, objective: { type: 'collect', target: '🌼', count: 42 }, moves: 25, stars: { one: 42, two: 46, three: 50 }, reward: {} },
  { id: 37, objective: { type: 'score', target: 'points', count: 7000 }, moves: 25, stars: { one: 7000, two: 7500, three: 8000 }, reward: {} },
  { id: 38, objective: { type: 'collect', target: '🌸', count: 45 }, moves: 22, stars: { one: 45, two: 50, three: 55 }, reward: {} },
  { id: 39, objective: { type: 'collect', target: '🍃', count: 50 }, moves: 25, stars: { one: 50, two: 55, three: 60 }, reward: {} },
  { id: 40, objective: { type: 'score', target: 'points', count: 7500 }, moves: 25, stars: { one: 7500, two: 8000, three: 8500 }, reward: { gems: 40 } },
  
  { id: 41, objective: { type: 'collect', target: '🌺', count: 42 }, moves: 22, stars: { one: 42, two: 46, three: 50 }, reward: {} },
  { id: 42, objective: { type: 'collect', target: '🌼', count: 48 }, moves: 25, stars: { one: 48, two: 52, three: 56 }, reward: {} },
  { id: 43, objective: { type: 'score', target: 'points', count: 8000 }, moves: 25, stars: { one: 8000, two: 8500, three: 9000 }, reward: {} },
  { id: 44, objective: { type: 'collect', target: '🌸', count: 50 }, moves: 22, stars: { one: 50, two: 55, three: 60 }, reward: {} },
  { id: 45, objective: { type: 'collect', target: '🍃', count: 55 }, moves: 25, stars: { one: 55, two: 60, three: 65 }, reward: { gems: 45 } },
  
  { id: 46, objective: { type: 'score', target: 'points', count: 8500 }, moves: 25, stars: { one: 8500, two: 9000, three: 9500 }, reward: {} },
  { id: 47, objective: { type: 'collect', target: '🌺', count: 48 }, moves: 22, stars: { one: 48, two: 52, three: 56 }, reward: {} },
  { id: 48, objective: { type: 'collect', target: '🌼', count: 52 }, moves: 25, stars: { one: 52, two: 56, three: 60 }, reward: {} },
  { id: 49, objective: { type: 'score', target: 'points', count: 9000 }, moves: 25, stars: { one: 9000, two: 9500, three: 10000 }, reward: {} },
  { id: 50, objective: { type: 'collect', target: '🌸', count: 60 }, moves: 30, stars: { one: 60, two: 65, three: 70 }, reward: { gems: 50 } },
];
