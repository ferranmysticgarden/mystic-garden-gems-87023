# Diagnóstico: por qué no llegan pagos (0 cobros con miles de descargas)

## Lo mínimo para que empiecen a funcionar (hazlo en este orden)

1. **Supabase** → tu proyecto → **Project Settings** → **Edge Functions** (o **Secrets**).  
   Añade el secret **`GOOGLE_PLAY_SERVICE_ACCOUNT`** con el JSON completo de la cuenta de servicio de Google (el archivo .json que descargas en Google Cloud → IAM → Cuentas de servicio → Crear clave).  
   Sin esto, **todas** las compras se rechazan.

2. **Google Cloud Console** → mismo proyecto de la cuenta de servicio → **APIs y servicios** → **Biblioteca** → busca **Google Play Android Developer API** → **Habilitar**.

3. **Google Play Console** → tu app → **Configuración** → **Acceso a la API** → vincula la cuenta de servicio y asígnale **Ver datos financieros** y **Gestionar pedidos y suscripciones**.

Cuando 1, 2 y 3 estén hechos, redespliega la Edge Function `verify-google-purchase` (o reinicia funciones) y prueba una compra de prueba. Si algo falla, usa la lista detallada abajo.

---

Sigue la lista detallada **en orden** si sigue sin funcionar. Lo más habitual es el punto 1.

---

## 1. Secret `GOOGLE_PLAY_SERVICE_ACCOUNT` en Supabase (lo más común)

Si **no** está configurado, **todas** las compras se rechazan en el servidor (por seguridad). El usuario paga en Google pero tu backend no verifica el token y no concede recompensas.

**Qué hacer:**

1. Entra en **Supabase** → tu proyecto → **Project Settings** → **Edge Functions** (o **Secrets**).
2. Añade un secret:
   - **Name:** `GOOGLE_PLAY_SERVICE_ACCOUNT`
   - **Value:** el JSON completo de la **cuenta de servicio** de Google (el que descargas desde Google Cloud Console). Debe contener al menos `client_email`, `private_key`, `project_id`.
3. Cómo obtener el JSON:
   - [Google Cloud Console](https://console.cloud.google.com/) → tu proyecto (o el vinculado a tu app).
   - **IAM y administración** → **Cuentas de servicio**.
   - Crea una cuenta de servicio o usa una existente → **Claves** → **Añadir clave** → **JSON**. Descarga el archivo y copia **todo** el contenido como valor del secret.
4. **Redesplegar** la Edge Function `verify-google-purchase` después de guardar el secret (o reiniciar funciones para que carguen el nuevo valor).

**Comprobar:** En Supabase → **Edge Functions** → **Logs** de `verify-google-purchase`. Si ves algo como `No GOOGLE_PLAY_SERVICE_ACCOUNT configured` o `SERVER_VERIFICATION_NOT_CONFIGURED`, el secret no está puesto o no se está leyendo.

---

## 2. API de Google Play activada en el proyecto de la cuenta de servicio

La cuenta de servicio debe usar un proyecto de **Google Cloud** donde esté activada la **Google Play Android Developer API**.

**Qué hacer:**

1. [Google Cloud Console](https://console.cloud.google.com/) → selecciona el **mismo proyecto** donde creaste la cuenta de servicio.
2. **APIs y servicios** → **Biblioteca**.
3. Busca **Google Play Android Developer API** → **Habilitar**.
4. Espera unos minutos y vuelve a probar una compra de prueba.

Si la API no está habilitada, sueles ver errores 403 o “API has not been used” en los logs de `verify-google-purchase`.

---

## 3. Cuenta de servicio con permisos en Google Play Console

La cuenta de servicio debe estar vinculada a tu app en **Play Console** y con los permisos correctos.

**Qué hacer:**

1. [Google Play Console](https://play.google.com/console) → tu app.
2. **Configuración** (o **Setup**) → **Acceso a la API** (o **API access**).
3. En **Cuentas de servicio**, enlaza la cuenta de servicio (el `client_email` del JSON). Si no aparece, créala/vincula desde la sección que te indique Play Console.
4. Asigna permisos:
   - **Ver datos financieros** (View financial data).
   - **Gestionar pedidos y suscripciones** (Manage orders and subscriptions).
   - Cualquier otro que pida la consola para compras in-app.

Sin esto, la verificación suele devolver 401/403 o “permission denied” en los logs.

---

## 4. IDs de producto iguales en la app y en Play Console

Los **product IDs** que usa la app deben coincidir con los creados en Play Console (por ejemplo `gems100`, `starterpack`, `gems_300`).

**Qué hacer:**

1. Play Console → tu app → **Monetización** → **Productos** → **Productos in-app**.
2. Anota los IDs exactos (con mayúsculas/minúsculas y guiones si los tienen).
3. En el código, el mapeo está en:
   - `src/hooks/googlePlayCatalog.ts` → `GOOGLE_PLAY_ID_OVERRIDES` y candidatos.
   - `supabase/functions/verify-google-purchase/index.ts` → `GOOGLE_PLAY_PRODUCT_ALIASES` y `PRODUCT_REWARDS`.

Si en Play Console tienes `gems100`, la app ya tiene candidatos como `gems100` y `gems_100`. Si en Play tienes otro ID (por ejemplo `com.mysticgarden.gems100`), hay que añadir ese ID como candidato en `googlePlayCatalog.ts` y el alias correspondiente en `verify-google-purchase`.

---

## 5. Package name correcto

El servidor usa por defecto `com.mysticgarden.game`. Debe ser el **mismo** que el `applicationId` de tu app en Android.

**Comprobar:**

- En el proyecto: `android/app/build.gradle` → `applicationId`.
- En Play Console: la app está publicada con ese mismo package name.

Si tu app usa otro package (por ejemplo por variantes), puedes definir el secret **ANDROID_PACKAGE_NAME** en Supabase con ese valor. La función `verify-google-purchase` ya usa ese secret y el que envía la app en el body.

---

## 6. Ver qué falla en cada compra (logs)

1. **Supabase** → **Edge Functions** → **verify-google-purchase** → **Logs**.
2. Haz una compra de prueba y mira la petición correspondiente:
   - Si ves `SERVER_VERIFICATION_NOT_CONFIGURED` o que falta `GOOGLE_PLAY_SERVICE_ACCOUNT` → punto 1.
   - Si ves 403 y “API not enabled” / “service disabled” → punto 2.
   - Si ves 401/403 y “permission” → punto 3.
   - Si ves 404 o error de “package” / “product” → puntos 4 y 5.

En la respuesta JSON de la función, cuando la verificación no se puede hacer por falta de configuración, se devuelve `code: "SERVER_VERIFICATION_NOT_CONFIGURED"`. Puedes buscarlo en logs o en cualquier herramienta que inspeccione la respuesta.

---

## Resumen rápido

| Síntoma | Revisar primero |
|--------|------------------|
| 0 pagos, muchos usuarios | 1. Secret `GOOGLE_PLAY_SERVICE_ACCOUNT` en Supabase y redesplegar función. |
| Error 403 “API disabled” | 2. Activar Google Play Android Developer API en Cloud. |
| Error 401/403 “permission” | 3. Permisos de la cuenta de servicio en Play Console. |
| “Producto no encontrado” en la app | 4. IDs en Play Console = IDs/candidatos en `googlePlayCatalog.ts`. |
| Error de package / 404 | 5. Package name = `applicationId` y opcionalmente secret `ANDROID_PACKAGE_NAME`. |

Cuando 1, 2 y 3 estén bien, las compras de prueba deberían empezar a verificarse y a conceder recompensas (y podrás ver pedidos en Play Console → Monetización).
