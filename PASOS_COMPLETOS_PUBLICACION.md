# Pasos Completos para Publicar Nueva App

## PASO 1: Preparar el Proyecto
```bash
cd D:\Escritorio\mystic-garden-gems-87023
git pull
npm install
```

## PASO 2: Eliminar Keystore Antigua y Regenerar
```bash
# Eliminar keystore antigua
del android\app\my-upload-key.keystore

# Generar nueva keystore
keytool -genkey -v -keystore android/app/my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Datos para rellenar:**
- Password del keystore: `mysticgarden2024` (anótalo)
- First and last name: `Evoluxe Studios`
- Organizational unit: `Games`
- Organization: `Evoluxe`
- City: `Madrid`
- State: `Madrid`
- Country code: `ES`

## PASO 3: Actualizar key.properties
Abre `android/key.properties` y asegúrate que tenga:
```
storePassword=mysticgarden2024
keyPassword=mysticgarden2024
keyAlias=my-key-alias
storeFile=my-upload-key.keystore
```

## PASO 4: Sincronizar Capacitor
```bash
npx cap sync android
```

## PASO 5: Construir el Bundle
```bash
cd android
gradlew clean
gradlew bundleRelease
```

**El nuevo bundle estará en:**
`android\app\build\outputs\bundle\release\app-release.aab`

## PASO 6: Crear Nueva App en Google Play Console

1. **Ir a:** https://play.google.com/console
2. **Clic en:** "Crear aplicación"
3. **Rellenar:**
   - **Nombre:** Mystic Garden Pro
   - **Idioma:** Español (España)
   - **Tipo:** Juego
   - **Gratis o de pago:** Gratis
   - **App ID interno:** (se genera automático)
4. **Aceptar políticas** y clic "Crear aplicación"

## PASO 7: Completar Ficha de Play Store

### Descripción Corta (80 caracteres):
```
¡Combina gemas mágicas en este adictivo puzzle match-3!
```

### Descripción Completa:
```
🌸 Bienvenido a Mystic Garden Pro - El Juego de Puzzles Match-3 Más Adictivo 🌸

Sumérgete en un jardín mágico lleno de gemas brillantes y desafíos emocionantes. Mystic Garden Pro te ofrece la experiencia de match-3 definitiva con gráficos impresionantes, niveles desafiantes y mecánicas de juego adictivas.

✨ CARACTERÍSTICAS PRINCIPALES ✨
• 50+ Niveles únicos y desafiantes
• Gemas mágicas con efectos especiales deslumbrantes
• Power-ups estratégicos para superar los niveles más difíciles
• Sistema de vidas con recarga automática cada 30 minutos
• Tienda integrada con paquetes especiales de gemas
• Música relajante y efectos de sonido inmersivos
• Gráficos HD optimizados para todos los dispositivos

🎮 MECÁNICA DE JUEGO 🎮
Combina 3 o más gemas del mismo tipo para hacerlas desaparecer y completar objetivos. Cada nivel presenta nuevos retos y obstáculos que pondrán a prueba tu estrategia y habilidad.

💎 SISTEMA DE PROGRESIÓN 💎
Desbloquea nuevos niveles mientras avanzas por el jardín místico. Cada nivel completado te recompensa con gemas que puedes usar para comprar power-ups y continuar tu aventura.

🌟 PERFECTO PARA 🌟
• Amantes de los juegos match-3 y puzzles
• Jugadores casuales que buscan relajarse
• Competidores que quieren dominar todos los niveles
• Fans de juegos de combinar gemas

Descarga Mystic Garden Pro ahora y comienza tu aventura en el jardín mágico. ¡Demuestra tus habilidades y conviértete en el maestro de las gemas!
```

### Categoría:
- **Principal:** Puzles
- **Secundaria:** Casual

### Tags:
`match-3, puzzle, gemas, casual, jardín`

## PASO 8: Gráficos

**Icono (512x512):**
`D:\Escritorio\mystic-garden-gems-87023\public\app-icon-512.png`

**Gráfico de funciones (1024x500):**
`D:\Escritorio\mystic-garden-gems-87023\public\feature-graphic-1024x500.png`

**Capturas de pantalla:**
Necesitas tomar MÍNIMO 2 capturas desde tu móvil o emulador mostrando:
1. Menú principal / Selección de niveles
2. Gameplay con gemas en pantalla
3. (Opcional) Tienda
4. (Opcional) Nivel completado

## PASO 9: Clasificación de Contenido

1. Ir a "Clasificación de contenido"
2. **Categoría:** Juego casual
3. Responder cuestionario:
   - Violencia: NO
   - Contenido sexual: NO
   - Lenguaje ofensivo: NO
   - Drogas/alcohol/tabaco: NO
   - Juegos de azar: NO
4. Guardar → Obtendrás **PEGI 3 / Everyone**

## PASO 10: Público Objetivo

1. Ir a "Público objetivo y contenido"
2. **Edad objetivo:** 13 años o más
3. **¿Dirigido a niños?** NO
4. **Compras dentro de la app:** SÍ
5. **Contiene anuncios:** SÍ (si usas AdMob)

## PASO 11: Política de Privacidad

**URL obligatoria:**
Usa tu archivo `privacy-policy.html` subido a tu dominio:
```
https://mysticgardenpro.com/privacy-policy.html
```

## PASO 12: Datos de Contacto

- **Email:** tu-email@dominio.com
- **Sitio web:** https://mysticgardenpro.com
- **Teléfono:** (opcional)

## PASO 13: Precios y Distribución

1. Ir a "Países y regiones"
2. **Seleccionar:** Todos los países disponibles
3. **Precio:** Gratis
4. Confirmar cumplimiento leyes de exportación EE.UU.

## PASO 14: Subir el Bundle

1. Ir a **"Producción"** en menú lateral
2. Clic **"Crear nueva versión"**
3. **Subir:** `android\app\build\outputs\bundle\release\app-release.aab`
4. **Nombre de versión:** 1.0.0
5. **Código de versión:** (se rellena automático)
6. **Notas de la versión:**
```
Primera versión de Mystic Garden Pro
• 50+ niveles de puzzles match-3
• Sistema de gemas y power-ups
• Tienda integrada
• Efectos visuales y sonoros
```
7. Clic **"Guardar"**

## PASO 15: Revisar y Enviar

1. Ir a **"Panel de control"**
2. Verificar que TODO tenga ✓ verde
3. Clic **"Enviar a revisión"**

## PASO 16: Esperar Aprobación

⏱️ Google revisará tu app en **1-7 días**
📧 Recibirás email cuando sea aprobada
✅ Una vez aprobada, estará en Play Store

---

## ⚠️ IMPORTANTE

1. **Guarda bien la nueva keystore** en `android/app/my-upload-key.keystore`
2. **Anota las contraseñas** que usaste
3. **Haz backup del keystore** - si la pierdes, no podrás actualizar la app nunca más
4. **No uses la keystore antigua** - esta es la nueva y definitiva

---

## 🆘 Si Hay Problemas

- **Bundle no firma:** Verifica `key.properties`
- **Gradle falla:** Ejecuta `gradlew clean` primero
- **Play Console rechaza:** Revisa que TODOS los campos estén completos
- **Capturas de pantalla:** Asegúrate que sean PNG/JPG con resolución correcta

¡Buena suerte! 🎮
