# Configuración de Pagos y Notificaciones

## ✅ Lo que ya está implementado:

### 1. Productos creados en Stripe
- 100 Gemas: €0.99
- 300 Gemas: €3.99
- 1200 Gemas: €9.99
- Sin Anuncios (1 Mes): €4.99
- Sin Anuncios (Para Siempre): €9.99
- Pase de Jardín Mensual: €9.99

### 2. Edge Functions creadas
- `send-registration-email`: Envía notificaciones cuando un usuario se registra
- `create-payment`: Crea sesiones de pago en Stripe
- `handle-stripe-webhook`: Procesa los eventos de pago de Stripe

### 3. Dashboard de Administración
- Accesible en `/admin`
- Muestra estadísticas en tiempo real
- Lista de usuarios recientes
- Lista de compras recientes
- Notificaciones en tiempo real

## 🔧 Configuración necesaria (IMPORTANTE):

### 1. Configurar Email de Administrador
Edita el archivo `src/config/admin.ts` y cambia `'tu-email@ejemplo.com'` por tu email real:

```typescript
export const ADMIN_EMAIL = 'tu-email-real@ejemplo.com';
export const ADMIN_EMAILS = [ADMIN_EMAIL];
```

También debes actualizar este email en las edge functions:
- `supabase/functions/send-registration-email/index.ts` (línea 10)
- `supabase/functions/handle-stripe-webhook/index.ts` (línea 9)

### 2. Configurar Dominio en Resend
1. Ve a https://resend.com/domains
2. Añade tu dominio (o usa el dominio de prueba)
3. Verifica tu dominio siguiendo las instrucciones de Resend

### 3. Configurar Webhook de Stripe

**IMPORTANTE**: Necesitas configurar el webhook de Stripe para que los pagos se procesen automáticamente.

#### Desarrollo (Local):
1. Instala Stripe CLI: https://stripe.com/docs/stripe-cli
2. Ejecuta: `stripe listen --forward-to https://faenacounjayntrjgqvy.supabase.co/functions/v1/handle-stripe-webhook`
3. Copia el webhook secret que te da (comienza con `whsec_`)
4. Añade el secret en Lovable:
   - Nombre: `STRIPE_WEBHOOK_SECRET`
   - Valor: el webhook secret que copiaste

#### Producción:
1. Ve al Dashboard de Stripe: https://dashboard.stripe.com/webhooks
2. Crea un nuevo webhook endpoint
3. URL: `https://faenacounjayntrjgqvy.supabase.co/functions/v1/handle-stripe-webhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
5. Copia el webhook secret (comienza con `whsec_`)
6. Añade el secret en Lovable:
   - Nombre: `STRIPE_WEBHOOK_SECRET`
   - Valor: el webhook secret que copiaste

### 4. Habilitar Realtime en Supabase (Opcional)

Para que el dashboard reciba notificaciones en tiempo real, ejecuta este SQL en tu base de datos:

```sql
-- Habilitar realtime para la tabla de perfiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Habilitar realtime para la tabla de compras
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_purchases;
```

## 📊 Cómo usar el sistema:

### Para Usuarios:
1. Los usuarios hacen clic en "Comprar" en la tienda
2. Se abre Stripe Checkout en una nueva pestaña
3. Completan el pago
4. Automáticamente reciben su compra en el juego
5. Reciben un email de confirmación

### Para Administradores:
1. Accede a `/admin` con tu cuenta de administrador
2. Verás estadísticas en tiempo real:
   - Usuarios totales y nuevos hoy
   - Ingresos totales y de hoy
   - Tasa de conversión
3. Recibirás emails automáticos:
   - Cuando un usuario se registra
   - Cuando se realiza un pago

## 🚀 Para Publicar y Generar Beneficios:

### Ya tienes listo:
✅ Sistema de autenticación
✅ Base de datos configurada
✅ Pagos con Stripe
✅ Notificaciones por email
✅ Dashboard de administración

### Falta configurar:
1. **Email del administrador** en `src/config/admin.ts`
2. **Webhook de Stripe** (ver sección 3 arriba)
3. **Dominio de Resend** para emails personalizados (opcional)

### Para publicar en móvil:
Sigue las instrucciones en `NEXT_STEPS.md` para:
- Exportar a Android/iOS
- Integrar Google Play Billing / Apple IAP
- Publicar en las tiendas

### Monetización adicional:
Revisa `MONETIZATION.md` para:
- Integrar AdMob para anuncios
- Añadir más productos
- Estrategias de precios regionales

## 🐛 Solución de Problemas:

### Los emails no se envían:
- Verifica que el dominio esté validado en Resend
- Revisa que la API key de Resend sea correcta
- Mira los logs en Lovable Cloud

### Los pagos no se procesan:
- Verifica que el webhook esté configurado correctamente
- Comprueba que `STRIPE_WEBHOOK_SECRET` esté configurado
- Revisa los logs del webhook en Stripe Dashboard

### El dashboard no muestra datos:
- Verifica que seas un administrador (email en `ADMIN_EMAILS`)
- Comprueba que haya datos en la base de datos
- Habilita Realtime si quieres actualizaciones automáticas

## 📈 Próximos Pasos:

1. Configura el email del admin
2. Configura el webhook de Stripe
3. Prueba el flujo completo:
   - Registrar usuario → Verificar email de notificación
   - Hacer una compra de prueba → Verificar email de pago
   - Revisar el dashboard → Verificar que aparezcan los datos
4. Publica tu app y empieza a generar ingresos! 🎉
