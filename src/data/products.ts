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
}

export const PRODUCTS: Product[] = [
  { 
    id: 'gems_100', 
    nameKey: 'shop.gems100',
    name: '100 Gems', 
    price: 0.99, 
    currency: 'USD',
    amount: 100 
  },
  { 
    id: 'gems_550', 
    nameKey: 'shop.gems550',
    name: '550 Gems', 
    price: 4.99, 
    currency: 'USD',
    amount: 550 
  },
  { 
    id: 'gems_1200', 
    nameKey: 'shop.gems1200',
    name: '1200 Gems', 
    price: 9.99, 
    currency: 'USD',
    amount: 1200 
  },
  { 
    id: 'unlimited_lives', 
    nameKey: 'shop.unlimitedLives',
    name: 'Unlimited Lives (1h)', 
    price: 1.99, 
    currency: 'USD',
    lives: 'unlimited' 
  },
  { 
    id: 'starter_pack', 
    nameKey: 'shop.starterPack',
    name: 'Starter Pack (60% OFF)', 
    price: 2.99, 
    currency: 'USD',
    gems: 200, 
    lives: 5, 
    powerups: 3 
  },
  { 
    id: 'garden_pass', 
    nameKey: 'shop.gardenPass',
    name: 'Garden Pass Monthly', 
    price: 9.99, 
    currency: 'USD',
    dailyGems: 50 
  }
];
