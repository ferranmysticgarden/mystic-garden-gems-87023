# Integración Google Play Billing

## Archivos creados/modificados

### Android Native
- `android/app/src/main/AndroidManifest.xml` - Añadido permiso `com.android.vending.BILLING`
- `android/app/src/main/java/com/mysticgarden/game/BillingPlugin.java` - Plugin Capacitor para Google Play Billing
- `android/app/src/main/java/com/mysticgarden/game/MainActivity.java` - Registro del plugin

### Dependencia (añadir manualmente)
En `android/app/build.gradle`, añadir en `dependencies`:
```groovy
implementation 'com.android.billingclient:billing:6.1.0'
```

### Frontend
- `src/plugins/GooglePlayBilling.ts` - Definición TypeScript del plugin
- `src/hooks/useGooglePlayBilling.ts` - Hook para Google Play Billing
- `src/hooks/usePayment.ts` - Hook unificado (Android → Google Play, Web → Stripe)
- `src/hooks/useStripePayment.ts` - Refactorizado para usar usePayment (backward compatible)

### Backend
- `supabase/functions/verify-google-purchase/index.ts` - Verificación y procesamiento de compras

## Configuración en Google Play Console

1. Ve a "Monetización" → "Productos" → "Productos en la aplicación"
2. Crea productos INAPP (consumibles) con estos IDs:
   - `quick_pack`
   - `gems_100`, `gems_300`, `gems_1200`
   - `starter_pack`
   - `continue_game`, `buy_moves`
   - `reward_doubler`
   - `pack_victoria_segura`, `pack_racha_infinita`
   - etc.

3. Configura los precios según `src/data/products.ts`

## Flujo de compra

### Android:
1. Usuario pulsa "Comprar"
2. `usePayment.createPayment()` → detecta Android
3. `GooglePlayBilling.purchase()` → lanza UI de Google Play
4. Usuario completa pago
5. `BillingPlugin` consume el producto (consumable)
6. `verify-google-purchase` verifica y otorga recompensas

### Web:
1. Usuario pulsa "Comprar"
2. `usePayment.createPayment()` → detecta web
3. `create-payment` → crea Stripe Checkout session
4. Usuario redirigido a Stripe
5. `handle-stripe-webhook` procesa el pago
