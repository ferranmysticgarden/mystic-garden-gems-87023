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
  /** CAMBIO 3 — nivel bonus festivo, sin objetivo, no se puede perder */
  bonus?: boolean;
}

export const LEVELS: Level[] = [
  // Niveles 1-3: MUY FÁCILES - enganchar al jugador, victoria garantizada
  { id: 1, objective: { type: 'score', target: 'points', count: 300 }, moves: 45, stars: { one: 300, two: 600, three: 900 }, reward: { gems: 15 } },
  { id: 2, objective: { type: 'collect', target: 't1', count: 4 }, moves: 30, stars: { one: 4, two: 6, three: 8 }, reward: { gems: 5 } },
  { id: 3, objective: { type: 'collect', target: 't4', count: 5 }, moves: 28, stars: { one: 5, two: 7, three: 9 }, reward: { gems: 5 } },
  { id: 4, objective: { type: 'score', target: 'points', count: 1100 }, moves: 22, stars: { one: 1100, two: 1600, three: 2100 }, reward: { gems: 10 } },
  { id: 5, objective: { type: 'collect', target: 't2', count: 8 }, moves: 20, stars: { one: 8, two: 10, three: 12 }, reward: { gems: 5 } },
  { id: 6, objective: { type: 'collect', target: 't3', count: 10 }, moves: 22, stars: { one: 10, two: 12, three: 14 }, reward: {} },
  { id: 7, objective: { type: 'score', target: 'points', count: 1800 }, moves: 22, stars: { one: 1800, two: 2400, three: 3000 }, reward: {} },
  { id: 8, objective: { type: 'collect', target: 't1', count: 12 }, moves: 20, stars: { one: 12, two: 14, three: 16 }, reward: {} },
  { id: 9, objective: { type: 'collect', target: 't4', count: 14 }, moves: 20, stars: { one: 14, two: 16, three: 19 }, reward: {} },
  { id: 10, objective: { type: 'score', target: 'points', count: 2000 }, moves: 22, stars: { one: 2000, two: 2700, three: 3400 }, reward: { gems: 100 } },
  // BONUS tras nivel 10
  { id: 110, objective: { type: 'score', target: 'points', count: 0 }, moves: 20, stars: { one: 0, two: 0, three: 0 }, reward: { gems: 100 }, bonus: true },

  { id: 11, objective: { type: 'collect', target: 't2', count: 18 }, moves: 22, stars: { one: 18, two: 22, three: 26 }, reward: {} },
  { id: 12, objective: { type: 'collect', target: 't3', count: 20 }, moves: 22, stars: { one: 20, two: 25, three: 30 }, reward: {} },
  { id: 13, objective: { type: 'score', target: 'points', count: 2200 }, moves: 25, stars: { one: 2200, two: 3000, three: 3800 }, reward: {} },
  { id: 14, objective: { type: 'collect', target: 't1', count: 25 }, moves: 20, stars: { one: 25, two: 30, three: 35 }, reward: {} },
  // AJUSTE 2092 — L15 near-miss (-9%) según auditoría 14d
  { id: 15, objective: { type: 'collect', target: 't4', count: 32 }, moves: 22, stars: { one: 32, two: 37, three: 42 }, reward: { gems: 15 } },
  { id: 16, objective: { type: 'score', target: 'points', count: 1700 }, moves: 19, stars: { one: 1700, two: 2300, three: 2900 }, reward: {} },
  // AJUSTE 2092 — L17 peak (-10%) según auditoría 14d
  { id: 17, objective: { type: 'collect', target: 't2', count: 27 }, moves: 17, stars: { one: 27, two: 31, three: 35 }, reward: {} },
  { id: 18, objective: { type: 'collect', target: 't3', count: 24 }, moves: 20, stars: { one: 24, two: 28, three: 32 }, reward: {} },
  { id: 19, objective: { type: 'score', target: 'points', count: 2300 }, moves: 25, stars: { one: 2300, two: 3100, three: 3900 }, reward: {} },
  { id: 20, objective: { type: 'collect', target: 't1', count: 30 }, moves: 22, stars: { one: 30, two: 35, three: 40 }, reward: { gems: 20 } },
  // BONUS tras nivel 20
  { id: 120, objective: { type: 'score', target: 'points', count: 0 }, moves: 20, stars: { one: 0, two: 0, three: 0 }, reward: { gems: 150 }, bonus: true },

  { id: 21, objective: { type: 'collect', target: 't4', count: 35 }, moves: 25, stars: { one: 35, two: 40, three: 45 }, reward: {} },
  // L22 pico, L23 relief
  { id: 22, objective: { type: 'score', target: 'points', count: 2700 }, moves: 25, stars: { one: 2700, two: 3500, three: 4300 }, reward: {} },
  { id: 23, objective: { type: 'collect', target: 't2', count: 21 }, moves: 22, stars: { one: 21, two: 25, three: 29 }, reward: {} },
  { id: 24, objective: { type: 'collect', target: 't3', count: 32 }, moves: 25, stars: { one: 32, two: 36, three: 40 }, reward: {} },
  { id: 25, objective: { type: 'score', target: 'points', count: 2100 }, moves: 27, stars: { one: 2100, two: 2800, three: 3500 }, reward: { gems: 25 } },
  { id: 26, objective: { type: 'collect', target: 't1', count: 35 }, moves: 22, stars: { one: 35, two: 40, three: 45 }, reward: {} },
  // L27 pico, L28 relief
  { id: 27, objective: { type: 'collect', target: 't4', count: 46 }, moves: 25, stars: { one: 46, two: 51, three: 56 }, reward: {} },
  { id: 28, objective: { type: 'score', target: 'points', count: 2000 }, moves: 25, stars: { one: 2000, two: 2800, three: 3600 }, reward: {} },
  { id: 29, objective: { type: 'collect', target: 't2', count: 32 }, moves: 22, stars: { one: 32, two: 36, three: 40 }, reward: {} },
  { id: 30, objective: { type: 'collect', target: 't3', count: 38 }, moves: 25, stars: { one: 38, two: 42, three: 46 }, reward: { gems: 30 } },
  // BONUS tras nivel 30
  { id: 130, objective: { type: 'score', target: 'points', count: 0 }, moves: 20, stars: { one: 0, two: 0, three: 0 }, reward: { gems: 200 }, bonus: true },

  { id: 31, objective: { type: 'score', target: 'points', count: 2500 }, moves: 25, stars: { one: 2500, two: 3300, three: 4100 }, reward: {} },
  // L32 pico, L33 relief
  { id: 32, objective: { type: 'collect', target: 't1', count: 46 }, moves: 22, stars: { one: 46, two: 51, three: 56 }, reward: {} },
  { id: 33, objective: { type: 'collect', target: 't4', count: 34 }, moves: 25, stars: { one: 34, two: 39, three: 44 }, reward: {} },
  { id: 34, objective: { type: 'score', target: 'points', count: 2500 }, moves: 25, stars: { one: 2500, two: 3300, three: 4100 }, reward: {} },
  { id: 35, objective: { type: 'collect', target: 't2', count: 38 }, moves: 22, stars: { one: 38, two: 42, three: 46 }, reward: { gems: 35 } },
  { id: 36, objective: { type: 'collect', target: 't3', count: 42 }, moves: 25, stars: { one: 42, two: 46, three: 50 }, reward: {} },
  // L37 pico, L38 relief
  { id: 37, objective: { type: 'score', target: 'points', count: 2800 }, moves: 25, stars: { one: 2800, two: 3600, three: 4400 }, reward: {} },
  { id: 38, objective: { type: 'collect', target: 't1', count: 34 }, moves: 22, stars: { one: 34, two: 39, three: 44 }, reward: {} },
  { id: 39, objective: { type: 'collect', target: 't4', count: 50 }, moves: 25, stars: { one: 50, two: 55, three: 60 }, reward: {} },
  { id: 40, objective: { type: 'score', target: 'points', count: 2500 }, moves: 25, stars: { one: 2500, two: 3300, three: 4100 }, reward: { gems: 40 } },
  // BONUS tras nivel 40
  { id: 140, objective: { type: 'score', target: 'points', count: 0 }, moves: 20, stars: { one: 0, two: 0, three: 0 }, reward: { gems: 200 }, bonus: true },

  { id: 41, objective: { type: 'collect', target: 't2', count: 42 }, moves: 22, stars: { one: 42, two: 46, three: 50 }, reward: {} },
  // L42 pico, L43 relief
  { id: 42, objective: { type: 'collect', target: 't3', count: 55 }, moves: 25, stars: { one: 55, two: 59, three: 63 }, reward: {} },
  { id: 43, objective: { type: 'score', target: 'points', count: 2000 }, moves: 25, stars: { one: 2000, two: 2800, three: 3600 }, reward: {} },
  { id: 44, objective: { type: 'collect', target: 't1', count: 50 }, moves: 22, stars: { one: 50, two: 55, three: 60 }, reward: {} },
  { id: 45, objective: { type: 'collect', target: 't4', count: 55 }, moves: 25, stars: { one: 55, two: 60, three: 65 }, reward: { gems: 45 } },
  { id: 46, objective: { type: 'score', target: 'points', count: 2500 }, moves: 25, stars: { one: 2500, two: 3300, three: 4100 }, reward: {} },
  // L47 pico, L48 relief
  { id: 47, objective: { type: 'collect', target: 't2', count: 55 }, moves: 22, stars: { one: 55, two: 59, three: 63 }, reward: {} },
  { id: 48, objective: { type: 'collect', target: 't3', count: 39 }, moves: 25, stars: { one: 39, two: 43, three: 47 }, reward: {} },
  { id: 49, objective: { type: 'score', target: 'points', count: 2500 }, moves: 25, stars: { one: 2500, two: 3300, three: 4100 }, reward: {} },
  { id: 50, objective: { type: 'collect', target: 't1', count: 60 }, moves: 30, stars: { one: 60, two: 65, three: 70 }, reward: { gems: 50 } },
  // BONUS tras nivel 50
  { id: 150, objective: { type: 'score', target: 'points', count: 0 }, moves: 20, stars: { one: 0, two: 0, three: 0 }, reward: { gems: 200 }, bonus: true },
];
