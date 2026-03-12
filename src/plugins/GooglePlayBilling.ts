import { registerPlugin } from '@capacitor/core';

export interface ProductDetails {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

export interface PurchaseResult {
  purchaseToken: string;
  orderId: string;
  productId: string;
  purchaseTime: number;
}

export interface GooglePlayBillingPlugin {
  isReady(): Promise<{ ready: boolean }>;
  queryProducts(options: { productIds: string[] }): Promise<Record<string, ProductDetails>>;
  purchase(options: { productId: string }): Promise<PurchaseResult>;
  consumePurchase(options: { purchaseToken: string }): Promise<{ consumed: boolean }>;
  restorePurchases(): Promise<Record<string, PurchaseResult>>;
  addListener(
    eventName: 'billingReady',
    listenerFunc: (data: { ready: boolean }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'purchaseCompleted',
    listenerFunc: (data: PurchaseResult) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'purchaseCancelled',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'purchaseError',
    listenerFunc: (data: { error: string }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'purchasePending',
    listenerFunc: (data: { productId: string; purchaseToken: string; state: string }) => void
  ): Promise<{ remove: () => void }>;
}

const GooglePlayBilling = registerPlugin<GooglePlayBillingPlugin>('GooglePlayBilling');

export default GooglePlayBilling;
