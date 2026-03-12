# AUDITORÍA PASS 7 → 11 (MONETIZACIÓN)

Fecha: 2026-03-12
Alcance: flujo de compra Android/Web, catálogo de productos, concesión de recompensas, seguridad de datos y telemetría real.

---

## PASS 7 — Verificación backend Google Play (función verify-google-purchase)

### Resultado
**CRÍTICO detectado en producción:** las verificaciones de compra Android están fallando con Google Play API `403`.

### Evidencia real (BD `app_events`)
- `gp_verify_started`: 4 eventos
- `gp_verify_failed`: 4 eventos
- `gp_verify_ok`: 0 eventos
- `gp_purchase_granted`: 0 eventos

Eventos recientes (últimas pruebas):
- `starter_pack` → `Google Play API error: 403`
- `chest_gold` → `Google Play API error: 403`
- `extra_moves` → `Google Play API error: 403`
- `first_purchase` → `Google Play API error: 403`

### Conclusión
El sistema de validación servidor está activo, pero **bloqueado por permisos/configuración externa de Google Play API** (no por falta de código en aliases).

---

## PASS 8 — Integridad de catálogo y mapeo de IDs

### Resultado
Se revisaron:
- `src/hooks/googlePlayCatalog.ts`
- `supabase/functions/verify-google-purchase/index.ts`
- `src/data/products.ts`

### Estado
- Mapeos de aliases principales están presentes (`buy_moves`, `flash_offer`, `finish_level`, `starter_pack`, `continue_game`, `reward_doubler`, `first_purchase`, `extra_moves`, etc.).
- Normalización (`normalizeId`) implementada en cliente y servidor.

### Riesgo residual
Aunque el mapeo está bien en código, **no sirve si Google API responde 403**: la compra seguirá sin validarse.

---

## PASS 9 — Entrega de recompensas y consistencia cliente

### Hallazgo 1 (ALTO)
En `src/pages/Index.tsx` (`handlePurchase`), para `garden_pass` se ejecuta `addPurchase` dos veces:
- una por `product.noAdsDays`
- otra por bloque específico `if (productId === 'garden_pass')`

Impacto:
- duplicidad de registros de compra para el mismo producto.

### Hallazgo 2 (ALTO)
`src/components/game/BattlePass.tsx` permite activar Premium **sin pago real**:
- `handleBuyPremium()` solo hace `localStorage.setItem(...)`.

Impacto:
- bypass completo del paywall de Battle Pass.

### Hallazgo 3 (MEDIO)
Hay componentes de monetización creados pero no montados en flujo actual:
- `ContinueGameOffer`, `RewardDoubler`, `LifesaverPack`, `StreakProtectionOffer`, `LoseBundle`.

Impacto:
- deuda técnica + incoherencia entre diseño comercial y embudo real.

---

## PASS 10 — Telemetría de embudo real (últimos 7 días)

### Datos
- `purchase_attempt`: 45
- `purchase_success`: 1
- `payment_bridge_start`: 61
- `payment_bridge_result`: 60
- `purchase_blocked`: 51
- `gp_verify_failed`: 4

### Patrones relevantes
- Alto volumen de intentos en `welcome_pack`.
- Históricamente hubo bloqueos por mapeo en packs premium (`unknown_product_mapping`), lo que confirma inestabilidad previa del catálogo.

### Conclusión
Conversión técnica insuficiente: existe fuga entre intento de compra y concesión efectiva.

---

## PASS 11 — Seguridad del backend de monetización

### Hallazgos de escaneo
1. **CRÍTICO:** usuarios autenticados pueden insertar en `user_purchases` para sí mismos (autoconcederse productos).
2. **WARN:** usuarios autenticados pueden manipular directamente economía/progreso en `game_progress`.
3. **WARN:** políticas permisivas en pedidos y achievements permiten autoasignación/manipulación.

### Impacto
Riesgo de fraude interno por API directa (autogrant de compras/estado) y pérdida de integridad de métricas de monetización.

---

## RESUMEN EJECUTIVO (PASS 7→11)

Estado actual: **NO se puede asegurar funcionamiento correcto del sistema de monedas/compras end-to-end**.

Bloqueadores principales:
1. Verificación Android fallando con `403` en Google Play API.
2. Battle Pass Premium con bypass sin pago.
3. Duplicidad de registro para `garden_pass`.
4. Políticas de base de datos con vectores de autoconcesión/manipulación.

---

## Evidencia revisada (archivos clave)
- `supabase/functions/verify-google-purchase/index.ts`
- `src/hooks/googlePlayCatalog.ts`
- `src/hooks/useGooglePlayBilling.ts`
- `src/hooks/usePayment.ts`
- `src/pages/Index.tsx`
- `src/data/products.ts`
- `src/components/game/BattlePass.tsx`
- `src/components/game/*` (modales de compra principales)
- `supabase/functions/create-payment/index.ts`
- `supabase/functions/handle-stripe-webhook/index.ts`

---

## Recomendación inmediata
Antes de publicar nueva versión/AAB:
1. corregir permisos Google Play API (error 403),
2. cerrar bypass de Battle Pass,
3. eliminar inserciones directas inseguras en `user_purchases` desde cliente,
4. repetir validación con compras reales y confirmar secuencia `gp_verify_started -> gp_verify_ok -> gp_purchase_granted`.
