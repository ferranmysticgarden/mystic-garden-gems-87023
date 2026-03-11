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
    price: 0.50, 
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
  },
  // STARTER PACK - Irresistible offer for new players (after level 3-4)
  { 
    id: 'starter_pack', 
    nameKey: 'shop.starterPack',
    name: 'Starter Pack', 
    price: 0.99, 
    currency: 'EUR',
    gems: 500,
    lives: 10,
    powerups: 3
  },
  // CONTINUE GAME - Emotional offer when losing
  { 
    id: 'continue_game', 
    nameKey: 'shop.continueGame',
    name: 'Continuar Partida', 
    price: 0.99, 
    currency: 'EUR',
    lives: 1,
    powerups: 5 // +5 moves
  },
  // BUY MOVES - Before losing (0 moves) - Soft paywall €0.49
  { 
    id: 'buy_moves', 
    nameKey: 'shop.buyMoves',
    name: 'Comprar Movimientos', 
    price: 0.49, 
    currency: 'EUR',
    powerups: 5
  },
  // WELCOME PACK - First purchase offer after level 1
  {
    id: 'welcome_pack',
    nameKey: 'shop.welcomePack',
    name: 'Pack Bienvenida',
    price: 0.49,
    currency: 'EUR',
    powerups: 5, // +5 movimientos
    lives: 3 // +3 boosters (representado como vidas)
    // x2 monedas 30 min handled by webhook
  },
  // REWARD DOUBLER - Post-victory €0.49
  {
    id: 'reward_doubler',
    nameKey: 'shop.rewardDoubler',
    name: 'Duplicar Recompensa x2',
    price: 0.49,
    currency: 'EUR'
  },
  // PACK VICTORIA SEGURA - Premium €2.99
  {
    id: 'pack_victoria_segura',
    nameKey: 'shop.packVictoriaSegura',
    name: 'Pack Victoria Segura',
    price: 2.99,
    currency: 'EUR',
    powerups: 5, // +5 movimientos
    lives: 3 // boosters / protección
  },
  // PACK RACHA INFINITA - Premium €1.99
  {
    id: 'pack_racha_infinita',
    nameKey: 'shop.packRachaInfinita',
    name: 'Pack Racha Infinita',
    price: 1.99,
    currency: 'EUR',
    lives: 2
    // + streak protection + 1 spin (handled by webhook)
  },
  // NEW MULTI-TIER PACKS
  // Pack Impulso €0.99 - "La mejor opción"
  {
    id: 'pack_impulso',
    nameKey: 'shop.packImpulso',
    name: 'Pack Impulso',
    price: 0.99,
    currency: 'EUR',
    powerups: 5, // +5 movimientos
    lives: 3 // +3 boosters
  },
  // Pack Experiencia €1.99
  {
    id: 'pack_experiencia',
    nameKey: 'shop.packExperiencia',
    name: 'Pack Experiencia',
    price: 1.99,
    currency: 'EUR',
    lives: 2, // 2 vidas extra
    // + protección racha + 1 giro (handled by webhook)
  },
  // Pack Victoria Segura Pro €2.99
  {
    id: 'pack_victoria_segura_pro',
    nameKey: 'shop.packVictoriaSeguraPro',
    name: 'Pack Victoria Segura Pro',
    price: 2.99,
    currency: 'EUR',
    powerups: 8, // +8 movimientos
    // + protección derrota + boosters premium (handled by webhook)
  }
];
