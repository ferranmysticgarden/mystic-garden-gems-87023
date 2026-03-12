# AUDITORÍA PASS 6 — SISTEMA COMPLETO DE MONETIZACIÓN
## Fecha: 2026-03-12
## Total archivos revisados: 36
## Bugs NUEVOS encontrados: 7

---

## 🔴 BUGS ENCONTRADOS Y CORREGIDOS EN PASS 6

### BUG 1 (CRÍTICO): GemsBanner NO otorgaba recompensas al cliente
**Archivo:** `src/components/game/GemsBanner.tsx`
**Problema:** Compraba `welcome_pack` pero solo llamaba `dispatchPurchaseCompleted()`. No tenía callback `onPurchaseSuccess` para otorgar powerups/vidas al gameState del cliente.
**Fix:** Añadido prop `onPurchaseSuccess` y se llama tras compra exitosa. En `GameScreen.tsx` ahora pasa callback que añade +5 movimientos.

### BUG 2 (CRÍTICO): GameScreen FlashOffer tenía onPurchaseSuccess VACÍO
**Archivo:** `src/components/GameScreen.tsx` línea 452-454
**Problema:** El callback `onPurchaseSuccess` del FlashOffer dentro de GameScreen estaba vacío — el jugador compraba y no pasaba NADA en el juego activo.
**Fix:** Ahora `onPurchaseSuccess` establece `setMoves(5)` y `setGameOver(false)` para que el jugador continúe jugando.

### BUG 3 (MEDIO): CloseDefeatOffer inconsistencia de productId
**Archivo:** `src/components/game/CloseDefeatOffer.tsx` línea 23
**Problema:** Compra `finish_level` pero hacía `dispatchPurchaseCompleted('continue_game')` — inconsistencia de tracking.
**Fix:** Cambiado a `dispatchPurchaseCompleted('finish_level')`.

### BUG 4 (MEDIO): LoseBundle NO llamaba dispatchPurchaseCompleted
**Archivo:** `src/components/game/LoseBundle.tsx`
**Problema:** Faltaba import de `dispatchPurchaseCompleted` y nunca se llamaba tras compra exitosa. El purchase gate nunca se desbloqueaba.
**Fix:** Añadido import y llamada a `dispatchPurchaseCompleted('pack_revancha')`.

### BUG 5 (CRÍTICO): googlePlayCatalog faltaban 14 aliases de productos
**Archivo:** `src/hooks/googlePlayCatalog.ts`
**Problema:** Solo tenía aliases para 16 de los 30 productos. Faltaban: `flash_offer`, `buy_moves`, `finish_level`, `starter_pack`, `continue_game`, `victory_multiplier`, `reward_doubler`, `chest_silver`, `chest_gold`, `mega_pack_inicial`, `pack_revancha`, `lifesaver_pack`, `streak_protection`, `extra_spin`.
**Impacto:** En Android, estos productos NUNCA se resolverían si Google Play los devolvía con ID alfanumérico.
**Fix:** Añadidos los 14 aliases faltantes.

### BUG 6 (CRÍTICO): verify-google-purchase faltaban 14 aliases en servidor
**Archivo:** `supabase/functions/verify-google-purchase/index.ts`
**Problema:** GOOGLE_PLAY_PRODUCT_ALIASES no tenía los mismos 14 productos que faltaban en el catálogo del cliente. Si Google Play enviaba `flashoffer1`, el servidor no lo normalizaría a `flash_offer` y la compra fallaría con "Unknown product".
**Fix:** Añadidos los 14 aliases + sufijos numéricos (28 entradas nuevas). Edge function re-desplegada.

### BUG 7 (MENOR): pack_victoria_segura_pro tenía alias incorrecto
**Archivo:** `src/hooks/googlePlayCatalog.ts` línea 18
**Problema:** Tenía `['packvictoriasegurapro', 'packvictoriasegura']` — el segundo alias `packvictoriasegura` podía confundirse con `pack_victoria_segura` (sin "pro").
**Fix:** Eliminado el alias ambiguo, dejando solo `['packvictoriasegurapro']`.

---

## ✅ VERIFICACIÓN POST-FIX DE TODOS LOS ARCHIVOS

### 1. verify-google-purchase/index.ts (Edge Function) — ✅ CORREGIDO + DESPLEGADO
- Security: Rechaza si falta GOOGLE_PLAY_SERVICE_ACCOUNT ✅
- PRODUCT_REWARDS: 30 productos definidos ✅
- GOOGLE_PLAY_PRODUCT_ALIASES: 60 aliases (30 base + 30 con sufijo "1") ✅
- normalizeId + NORMALIZED_CANONICAL_PRODUCT_IDS ✅
- Auditoría completa: gp_verify_started, gp_verify_ok, gp_verify_failed, gp_purchase_granted ✅
- Guest support ✅

### 2. googlePlayCatalog.ts — ✅ CORREGIDO
- GOOGLE_PLAY_ID_OVERRIDES: 30 productos mapeados ✅
- getGooglePlayCandidates genera: [original, alias, normalized, +1 suffix] ✅
- getGooglePlayQueryProductIds cubre TODOS los productos ✅

### 3. useGooglePlayBilling.ts — ✅ OK
- Retry 3 intentos ✅
- Deduplicación con verificationTasksRef ✅
- Verify-then-consume ✅
- Consume solo tras verificación server ✅

### 4. usePayment.ts — ✅ OK
- Android → Google Play Billing ✅
- Web → Stripe Checkout ✅
- getPrice con fallback ✅

### 5. products.ts — ✅ OK
- 24 productos con IDs canónicos ✅
- Tipos correctos (amount, gems, lives, powerups, noAdsDays, noAdsForever) ✅

### 6. useGameState.ts — ✅ OK
- addLives cap 99 ✅
- addGems sin cap ✅
- addHammer/addShuffle/addUndo incrementan 1 cada uno ✅
- Guest mode con localStorage ✅

### 7. Index.tsx — ✅ OK (correcciones previas verificadas)
- handlePurchase otorga gems + lives + powerups + noAds ✅
- StarterPack con onPurchaseSuccess: 500 gems, 10 lives, 3 powerups ✅
- FlashOffer con onPurchaseSuccess: 10 lives, 150 gems ✅
- FirstDayOffer con onPurchaseSuccess: 500 gems, 10 lives, 3 powerups, 24h unlimited ✅
- WelcomeOffer con onPurchase: 3 lives, 5 powerups ✅
- PostVictoryOffer con onMultiply: gems x3 ✅
- NoLivesModal con onQuickLifePurchased ✅

### 8. GameScreen.tsx — ✅ CORREGIDO
- GemsBanner ahora tiene onPurchaseSuccess (+5 moves) ✅
- FlashOffer ahora tiene onPurchaseSuccess (setMoves(5), setGameOver(false)) ✅
- BuyMovesOffer → setMoves(5) ✅
- DefeatPacksOffer → setMoves(5) ✅
- Level6Offer → setMoves(3) ✅
- Level10Paywall → setMoves(5) ✅
- CloseDefeatOffer → setMoves(5) ✅

### 9. StarterPack.tsx — ✅ OK
- dispatchPurchaseCompleted('starter_pack') ✅
- onPurchaseSuccess callback ✅

### 10. FlashOffer.tsx — ✅ OK
- dispatchPurchaseCompleted('flash_offer') ✅
- onPurchaseSuccess callback ✅

### 11. FirstDayOffer.tsx — ✅ OK
- dispatchPurchaseCompleted('mega_pack_inicial') ✅
- onPurchaseSuccess callback ✅

### 12. WelcomeOffer.tsx — ✅ OK
- dispatchPurchaseCompleted('welcome_pack') ✅
- onPurchase callback ✅

### 13. GemsBanner.tsx — ✅ CORREGIDO
- dispatchPurchaseCompleted('welcome_pack') ✅
- onPurchaseSuccess callback NUEVO ✅

### 14. PostVictoryOffer.tsx — ✅ OK
- dispatchPurchaseCompleted('victory_multiplier') ✅
- onMultiply(multipliedGems) ✅

### 15. BuyMovesOffer.tsx — ✅ OK
- dispatchPurchaseCompleted('buy_moves') ✅
- onBuy callback ✅

### 16. ContinueGameOffer.tsx — ✅ OK
- dispatchPurchaseCompleted('continue_game') ✅
- onContinue callback ✅

### 17. Level6Offer.tsx — ✅ OK
- dispatchPurchaseCompleted('buy_moves') ✅
- onBuy callback ✅

### 18. CloseDefeatOffer.tsx — ✅ CORREGIDO
- dispatchPurchaseCompleted('finish_level') (antes era 'continue_game') ✅
- onBuy callback ✅

### 19. DefeatPacksOffer.tsx — ✅ OK
- dispatchPurchaseCompleted(productId) para cada pack ✅
- onPurchase callback ✅

### 20. Level10Paywall.tsx — ✅ OK
- dispatchPurchaseCompleted('buy_moves') ✅
- onPurchaseSuccess callback ✅

### 21. LootChest.tsx — ✅ OK
- dispatchPurchaseCompleted(chest_id) ✅
- onRewardClaimed callback con gems + lives ✅

### 22. LuckySpin.tsx — ✅ OK
- Giro gratis: reward aplicado vía DB (auth) + localStorage ✅
- Extra spin: dispatchPurchaseCompleted('extra_spin') ✅

### 23. LoseBundle.tsx — ✅ CORREGIDO
- dispatchPurchaseCompleted('pack_revancha') AÑADIDO ✅
- onBuy callback ✅

### 24. LifesaverPack.tsx — ✅ OK
- dispatchPurchaseCompleted('lifesaver_pack') ✅
- onBuy callback ✅

### 25. StreakProtectionOffer.tsx — ✅ OK
- dispatchPurchaseCompleted('streak_protection') ✅
- onBuy callback ✅

### 26. RewardDoubler.tsx — ✅ OK
- dispatchPurchaseCompleted('reward_doubler') ✅
- onDouble(doubledGems) callback ✅

### 27. Shop.tsx — ✅ OK
- handlePurchase → createPayment → onPurchase(productId) ✅
- getPrice para todos los productos ✅

### 28. NoLivesModal.tsx — ✅ OK
- createPayment('quick_pack') ✅
- onQuickLifePurchased callback ✅

### 29. usePurchases.ts — ✅ OK
- hasActiveProduct busca con prefijos gp_ y stripe_ ✅

### 30. usePurchaseGate.ts — ✅ OK
- Sync servidor para auth users ✅
- Fallback localStorage para guests ✅
- dispatchPurchaseCompleted helper ✅

### 31. usePendingPurchase.ts — ✅ OK
- Estado guardado antes de Stripe ✅
- Expiry 30 minutos ✅

### 32. GooglePlayBilling.ts (plugin) — ✅ OK
- Interfaces correctas ✅
- 5 eventos: billingReady, purchaseCompleted, purchaseCancelled, purchaseError, purchasePending ✅

### 33. BillingPlugin.java (nativo) — ✅ OK
- enablePendingPurchases con PendingPurchasesParams ✅
- NO consume automáticamente (verify-then-consume) ✅
- Handle PENDING state ✅
- Null safety ✅

### 34. useAuth.ts — ✅ OK
### 35. trackEvent.ts — ✅ OK
### 36. analytics.ts — ✅ OK

---

## RESUMEN PASS 6

| Categoría | Total | OK | Corregidos Pass 6 | Bugs menores |
|-----------|-------|-----|-------------------|--------------|
| Backend   | 1     | 0   | 1 (aliases)       | 0            |
| Catálogo  | 1     | 0   | 1 (aliases)       | 0            |
| Hooks     | 7     | 7   | 0                 | 0            |
| Plugin    | 2     | 2   | 0                 | 0            |
| Páginas   | 2     | 1   | 1 (GameScreen)    | 0            |
| Modales   | 18    | 14  | 4                 | 0            |
| Analytics | 2     | 2   | 0                 | 0            |
| Tienda    | 1     | 1   | 0                 | 0            |
| **TOTAL** | **36**| **27**| **7**           | **0**        |

### Bugs NUEVOS corregidos en Pass 6: 7
### Bugs pendientes: 0
### Edge function re-desplegada: ✅
