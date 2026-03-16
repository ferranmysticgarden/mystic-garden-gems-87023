# Prompt para Lovable – pagos y lo ya hecho

**Copia y pega todo el texto de abajo (desde "INSTRUCCIONES" hasta "FIN DEL PROMPT") en Lovable.**

---

## INSTRUCCIONES

**NO TOQUES NADA de lo siguiente.** Ya está hecho y debe quedar exactamente igual:

1. **`src/hooks/useGooglePlayBilling.ts`**
   - Variable `verificationFailReason` dentro del async de verificación.
   - Asignación `verificationFailReason = data?.reason ?? data?.code ?? null` antes del `throw` cuando `!data?.success`.
   - En `trackEvent('purchase_verification_failed', ...)` debe incluir `reason: verificationFailReason ?? undefined`.
   - La variable `isServerNotConfigured` y el toast que usa ese caso (mensaje sobre "el servidor no tiene configurada la verificación de Google Play").
   No cambies la lógica de compra, ni los listeners, ni `purchase()`, ni `verifyAndProcessPurchase`.

2. **`supabase/functions/verify-google-purchase/index.ts`**
   - Cuando no hay `serviceAccountKey`: el `return` con `valid: false`, `error` con texto "Server verification not configured...", y `reason: 'server_not_configured'`.
   - En el tipo de retorno de `verifyWithGooglePlay`, el `reason` debe incluir `'server_not_configured'`.
   - Cuando la verificación falla, el `responsePayload` y la condición `if (verification.reason === 'server_not_configured')` que pone `responsePayload.code = 'SERVER_VERIFICATION_NOT_CONFIGURED'`.
   No cambies el flujo de verificación con Google Play ni las recompensas.

3. **`DIAGNOSTICO_PAGOS.md`**
   - No borres ni reescribas este archivo. Debe seguir teniendo la sección "Lo mínimo para que empiecen a funcionar" al principio y el resto del diagnóstico (secret, API, permisos, IDs, package, logs).

**LO QUE SÍ PUEDES HACER (sin tocar lo de arriba):**

- Revisar que el flujo de pagos siga intacto: `Shop.tsx` → `usePayment` → `useGooglePlayBilling.purchase()` → plugin nativo → `verify-google-purchase` → recompensas. Si ves algún fallo obvio (import roto, referencia incorrecta), corrígelo sin cambiar la lógica ya implementada.
- Si existe un `.env.example` o documentación de variables de entorno, puedes añadir una línea que documente que la Edge Function `verify-google-purchase` usa el secret `GOOGLE_PLAY_SERVICE_ACCOUNT` (sin poner valores reales). Si no existe, no es obligatorio crearlo.
- No crees cuentas, contraseñas ni nuevos servicios. No cambies la lógica de compra ni la verificación en servidor.

**Al terminar:** Responde con una lista breve de lo que hayas comprobado o cambiado (si algo). Si no has tenido que tocar nada porque todo está consistente, dilo también.

---

## PARA EL USUARIO (solo tú puedes hacerlo, Lovable no puede)

Esto tiene que hacerlo el usuario en sus propias cuentas; no está en el código:

1. **Supabase** → tu proyecto → **Project Settings** → **Edge Functions** (o **Secrets**). Añadir el secret **`GOOGLE_PLAY_SERVICE_ACCOUNT`** con el JSON completo de la cuenta de servicio de Google (archivo .json de Google Cloud → IAM → Cuentas de servicio → Crear clave). Sin esto, todas las compras se rechazan.

2. **Google Cloud Console** → mismo proyecto de la cuenta de servicio → **APIs y servicios** → **Biblioteca** → buscar **Google Play Android Developer API** → **Habilitar**.

3. **Google Play Console** → tu app → **Configuración** → **Acceso a la API** → vincular la cuenta de servicio y darle **Ver datos financieros** y **Gestionar pedidos y suscripciones**.

Después, redesplegar (o reiniciar) la Edge Function `verify-google-purchase` y probar una compra de prueba.

---

## FIN DEL PROMPT
