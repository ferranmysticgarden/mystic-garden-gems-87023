export interface Product {
  id: string;
  name: string;
  nameKey: string;
  price: number;
  currency: string;
  amount?: number;
  lives?: number | 'unlimited';
  gems?: number;
  powerups?: number;
  dailyGems?: number;
  noAdsDays?: number;
  noAdsForever?: boolean;
  instantGems?: number;
  allLevelsAccess?: boolean;
}

export const PRODUCTS: Product[] = [
  { 
    id: 'quick_pack', 
    nameKey: 'shop.quickPack',
    name: '3 Vidas + 20 Gemas', 
    price: 0.99, 
    currency: 'EUR',
    lives: 3,
    gems: 20
  },
  { 
    id: 'gems_100', 
    nameKey: 'shop.gems100',
    name: '100 Gemas', 
    price: 0.99, 
    currency: 'EUR',
    amount: 100 
  },
  { 
    id: 'gems_300', 
    nameKey: 'shop.gems300',
    name: '300 Gemas', 
    price: 3.99, 
    currency: 'EUR',
    amount: 300 
  },
  { 
    id: 'gems_1200', 
    nameKey: 'shop.gems1200',
    name: '1200 Gemas', 
    price: 9.99, 
    currency: 'EUR',
    amount: 1200 
  },
  { 
    id: 'no_ads_month', 
    nameKey: 'shop.noAdsMonth',
    name: 'Quitar Anuncios (1 Mes)', 
    price: 4.99, 
    currency: 'EUR',
    noAdsDays: 30
  },
  { 
    id: 'no_ads_forever', 
    nameKey: 'shop.noAdsForever',
    name: 'Quitar Anuncios (Para Siempre)', 
    price: 9.99, 
    currency: 'EUR',
    noAdsForever: true
  },
  { 
    id: 'garden_pass', 
    nameKey: 'shop.gardenPass',
    name: 'Pase de Jardín Mensual', 
    price: 9.99, 
    currency: 'EUR',
    instantGems: 1000,
    noAdsDays: 30
  },
  // Flash Offer - 2 hour limited
  { 
    id: 'flash_offer', 
    nameKey: 'shop.flashOffer',
    name: 'Pack Relámpago', 
    price: 0.99, 
    currency: 'EUR',
    lives: 10,
    gems: 150,
    noAdsDays: 0 // 30 mins handled separately
  },
  // Victory Multiplier
  { 
    id: 'victory_multiplier', 
    nameKey: 'shop.victoryMultiplier',
    name: 'Multiplicador x3', 
    price: 0.99, 
    currency: 'EUR',
    lives: 2
  },
  // Ice Breaker - Termina este nivel (primera compra psicológica)
  { 
    id: 'finish_level', 
    nameKey: 'shop.finishLevel',
    name: 'Termina Este Nivel', 
    price: 0.99, 
    currency: 'EUR',
    powerups: 5 // +5 movimientos
  },
  // Almost had it - extra moves
  { 
    id: 'extra_moves', 
    nameKey: 'shop.extraMoves',
    name: 'Última Oportunidad', 
    price: 0.49, 
    currency: 'EUR',
    powerups: 5
  },
  // Chest Silver
  { 
    id: 'chest_silver', 
    nameKey: 'shop.chestSilver',
    name: 'Cofre Plata', 
    price: 0.99, 
    currency: 'EUR'
  },
  // Chest Gold
  { 
    id: 'chest_gold', 
    nameKey: 'shop.chestGold',
    name: 'Cofre Oro', 
    price: 2.99, 
    currency: 'EUR'
  },
  // First purchase pack
  { 
    id: 'first_purchase', 
    nameKey: 'shop.firstPurchase',
    name: 'Pack Primera Compra x5', 
    price: 0.99, 
    currency: 'EUR',
    gems: 500,
    lives: 20,
    noAdsDays: 1
  }
];
