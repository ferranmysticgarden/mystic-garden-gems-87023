export interface World {
  id: number;
  name: string;
  from: number;
  to: number;
  emoji: string;
  gradient: string;
}

export const WORLDS: World[] = [
  { id: 1, name: 'Jardín Encantado', from: 1, to: 15, emoji: '🌸', gradient: 'from-pink-400 to-rose-500' },
  { id: 2, name: 'Bosque Místico', from: 16, to: 30, emoji: '🍄', gradient: 'from-emerald-400 to-teal-600' },
  { id: 3, name: 'Cielo Estelar', from: 31, to: 45, emoji: '✨', gradient: 'from-indigo-400 to-purple-600' },
  { id: 4, name: 'Reino Dorado', from: 46, to: 999, emoji: '👑', gradient: 'from-yellow-400 to-amber-600' },
];

export const getWorldForLevel = (lvl: number): World =>
  WORLDS.find((w) => lvl >= w.from && lvl <= w.to) ?? WORLDS[0];
