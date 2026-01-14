export interface Achievement {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  requirement: number;
  rewardGems: number;
  category: 'levels' | 'streak' | 'gems' | 'stars';
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    nameKey: 'achievements.firstWin',
    descriptionKey: 'achievements.firstWinDesc',
    icon: '🏆',
    requirement: 1,
    rewardGems: 10,
    category: 'levels'
  },
  {
    id: 'level_10',
    nameKey: 'achievements.level10',
    descriptionKey: 'achievements.level10Desc',
    icon: '🌸',
    requirement: 10,
    rewardGems: 25,
    category: 'levels'
  },
  {
    id: 'level_25',
    nameKey: 'achievements.level25',
    descriptionKey: 'achievements.level25Desc',
    icon: '🌺',
    requirement: 25,
    rewardGems: 50,
    category: 'levels'
  },
  {
    id: 'level_50',
    nameKey: 'achievements.level50',
    descriptionKey: 'achievements.level50Desc',
    icon: '👑',
    requirement: 50,
    rewardGems: 100,
    category: 'levels'
  },
  {
    id: 'streak_3',
    nameKey: 'achievements.streak3',
    descriptionKey: 'achievements.streak3Desc',
    icon: '🔥',
    requirement: 3,
    rewardGems: 20,
    category: 'streak'
  },
  {
    id: 'streak_7',
    nameKey: 'achievements.streak7',
    descriptionKey: 'achievements.streak7Desc',
    icon: '⚡',
    requirement: 7,
    rewardGems: 50,
    category: 'streak'
  },
  {
    id: 'streak_14',
    nameKey: 'achievements.streak14',
    descriptionKey: 'achievements.streak14Desc',
    icon: '💫',
    requirement: 14,
    rewardGems: 100,
    category: 'streak'
  },
  {
    id: 'gems_100',
    nameKey: 'achievements.gems100',
    descriptionKey: 'achievements.gems100Desc',
    icon: '💎',
    requirement: 100,
    rewardGems: 25,
    category: 'gems'
  },
  {
    id: 'gems_500',
    nameKey: 'achievements.gems500',
    descriptionKey: 'achievements.gems500Desc',
    icon: '💍',
    requirement: 500,
    rewardGems: 50,
    category: 'gems'
  },
  {
    id: 'stars_10',
    nameKey: 'achievements.stars10',
    descriptionKey: 'achievements.stars10Desc',
    icon: '⭐',
    requirement: 10,
    rewardGems: 30,
    category: 'stars'
  },
  {
    id: 'stars_30',
    nameKey: 'achievements.stars30',
    descriptionKey: 'achievements.stars30Desc',
    icon: '🌟',
    requirement: 30,
    rewardGems: 75,
    category: 'stars'
  }
];
