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
    instantGems: 500,
    noAdsDays: 30,
    allLevelsAccess: true
  }
];
