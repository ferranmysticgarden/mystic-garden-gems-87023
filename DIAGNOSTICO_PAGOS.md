# Diagnóstico de Pagos – Mystic Garden

## Lo mínimo para que empiecen a funcionar

1. **Secret `GOOGLE_PLAY_SERVICE_ACCOUNT`** en Supabase Edge Functions con el JSON completo de la cuenta de servicio de Google.
2. **Google Play Android Developer API** activada en Google Cloud Console (proyecto de la cuenta de servicio).
3. **Cuenta de servicio vinculada** en Google Play Console → Configuración → Acceso a la API, con permisos:
   - Ver datos financieros
   - Gestionar pedidos y suscripciones

---

## Secrets necesarios en Edge Functions

| Secret | Descripción |
|--------|-------------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | JSON completo de la cuenta de servicio de Google Cloud (contiene `client_email`, `private_key`, `project_id`) |
| `ANDROID_PACKAGE_NAME` | Paquete de la app Android: `com.mysticgarden.game` |

## API requerida

- **Google Play Android Developer API** debe estar **habilitada** en el proyecto de Google Cloud Console que corresponde a la cuenta de servicio.
- Sin esta API activa, todas las verificaciones devuelven error 403 `service_disabled`.

## Permisos en Google Play Console

La cuenta de servicio (`play-billing@friendly-brand-475719-s8.iam.gserviceaccount.com`) debe tener:

1. **Acceso a la API** → vinculada en Configuración → Acceso a la API
2. **Usuarios y permisos** → permisos para `com.mysticgarden.game`:
   - ✅ Ver datos financieros
   - ✅ Gestionar pedidos y suscripciones
   - ✅ Ver información de la app

## Product IDs en Google Play Console

Los IDs de producto deben estar creados y **activos** en Google Play Console → Monetización → Productos en la app. Referencia completa en `src/hooks/googlePlayCatalog.ts`.

## Flujo de verificación

```
Shop.tsx → usePayment.createPayment() → useGooglePlayBilling.purchase()
  → Plugin nativo (BillingPlugin.java) → Google Play UI
  → purchaseCompleted event → verifyAndProcessPurchase()
  → Edge Function verify-google-purchase → Google Play API
  → Recompensas en BD (usuario autenticado) o client-side (guest)
```

## Logs de diagnóstico

Eventos en `app_events`:
- `gp_verify_started` – Se inició la verificación
- `gp_verify_ok` – Verificación exitosa con Google Play
- `gp_verify_failed` – Verificación fallida (ver `event_data.reason`)
- `gp_purchase_granted` – Recompensas otorgadas en BD
- `gp_purchase_guest_verified` – Compra de invitado verificada

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `server_not_configured` | Falta el secret `GOOGLE_PLAY_SERVICE_ACCOUNT` | Añadir el JSON en Edge Functions secrets |
| `service_disabled` | API no activada en Google Cloud | Activar Google Play Android Developer API |
| `permission_denied` (403) | Cuenta sin permisos en Play Console | Revisar Acceso a la API + permisos |
| `invalid_credentials` | JSON malformado o clave expirada | Re-descargar JSON de la cuenta de servicio |
| `product_not_loaded` | Producto no existe/activo en Play Console | Crear y activar el producto |
