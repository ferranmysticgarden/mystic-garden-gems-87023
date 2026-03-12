# AUDITORÍA PASS 12–16 (2026-03-12)

## Estado
Se ejecutaron 5 pasadas adicionales consecutivas con foco en los 4 bloqueos críticos reportados:
1. Google Play API 403
2. Battle Pass Premium sin pago
3. Duplicidad de `garden_pass`
4. Políticas backend permisivas

---

## PASS 12 — Battle Pass (bypass premium)

### Hallazgo previo
`BattlePass.tsx` permitía activar Premium con `localStorage` sin compra real.

### Corrección aplicada
- Eliminado el unlock por `localStorage` (`battle-pass-premium-*`).
- Compra premium ahora usa flujo real de pago (`createPayment('garden_pass')`).
- Premium se habilita solo tras `success === true` del flujo de pago.

### Evidencia
- Búsqueda de bypass anterior:
  - `localStorage.setItem(\`battle-pass-premium-` → **0 coincidencias**

---

## PASS 13 — Duplicidad `garden_pass`

### Hallazgo previo
`Index.tsx` hacía grant/registro duplicado para `garden_pass`.

### Corrección aplicada
- Eliminada la rama duplicada `if (productId === 'garden_pass')`.
- Eliminado el autogrant persistente de entitlements premium desde cliente (sin ads/pase): ahora solo backend tras verificación.

### Evidencia
- Búsqueda de duplicidad:
  - `productId === 'garden_pass'` → **0 coincidencias** en frontend.

---

## PASS 14 — Backend RLS (hardening)

### Hallazgos previos
- `user_purchases`: usuarios autenticados podían auto-insertar compras.
- `game_progress`: update sin `WITH CHECK`, superficie de manipulación.
- `app_events`: política con `WITH CHECK true` (permisiva).

### Correcciones aplicadas
#### `user_purchases`
- Eliminada política de inserción cliente:
  - `DROP POLICY "Users can insert their own purchases"`

#### `game_progress`
- Rehechas políticas con rol `authenticated` y `WITH CHECK (auth.uid() = user_id)` para UPDATE.

#### `app_events`
- Reemplazada política `WITH CHECK true` por validación:
  - `event_name IS NOT NULL`
  - `length(btrim(event_name)) > 0`
  - `length(event_name) <= 120`

### Evidencia
Consulta de políticas actualizadas:
- `user_purchases`: solo SELECT propio
- `game_progress`: SELECT/INSERT/UPDATE propios con checks correctos
- `app_events`: INSERT validado (no `true`)

---

## PASS 15 — verify-google-purchase (robustez y entitlements)

### Hallazgos previos
- Error 403 poco accionable.
- Entitlements premium dependían de insert cliente en `user_purchases`.

### Correcciones aplicadas
- Mensaje explícito para Google Play 403 (permisos API).
- `gp_verify_failed` ahora guarda `googleStatus`.
- Respuesta HTTP usa `503` cuando Google devuelve `403`.
- Input inválido (`purchaseToken`/`productId` faltante) ahora devuelve `400`.
- Grabación de entitlement canónico en backend para productos premium/no-ads (además del registro inmutable `gp_*`).

### Validación técnica
- Edge Function redeploy: `verify-google-purchase` ✅
- Invocación de prueba:
  - body inválido → HTTP `400` esperado ✅

---

## PASS 16 — Verificación final de bloqueos críticos

### 1) Google Play 403
**Sigue activo a nivel de consola/permisos externos** (no de código).

Evidencia en `app_events`:
- `gp_verify_failed` con `error: Google Play API error: 403`
- Último recuento: **4 eventos 403**

### 2) Battle Pass sin pago
**Corregido en frontend** (sin unlock directo por storage).

### 3) Duplicidad `garden_pass`
**Corregido**.

### 4) Backend permisivo
**Corregido en tablas críticas auditadas** (`user_purchases`, `game_progress`, `app_events`).

---

## Riesgo abierto (fuera de SQL app)

### Leaked password protection disabled
El linter marca 1 warning restante de configuración de autenticación global:
- `Leaked Password Protection Disabled`

No es una política SQL de tabla; requiere activación en la configuración de autenticación del proyecto.

---

## Archivos modificados en esta ronda (pass 12–16)
- `src/components/game/BattlePass.tsx`
- `src/pages/Index.tsx`
- `src/hooks/usePurchases.ts`
- `src/hooks/useGooglePlayBilling.ts`
- `supabase/functions/verify-google-purchase/index.ts`

---

## Conclusión técnica
- Se cerraron los 3 bloqueos internos de código (BattlePass bypass, duplicidad garden_pass, RLS permisivo).
- El bloqueo crítico restante de monetización Android es **externo**: permisos Google Play API (403).
