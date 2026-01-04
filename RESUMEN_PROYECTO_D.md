# 🎮 MYSTIC GARDEN GEMS - RESUMEN COMPLETO

## 📍 Nueva Ubicación
```
D:\mystic-garden-gems-87023
```

---

## 🎯 Información del Juego

| Campo | Valor |
|-------|-------|
| **Nombre** | Mystic Garden Gems |
| **Package** | com.mysticgarden.game |
| **Versión Actual** | 7.2.0 (código 720) |
| **Tipo** | Match-3 Puzzle Game |
| **Plataforma** | Android + Web |

---

## 🎮 Características del Juego

- ✅ 100+ niveles de puzzles Match-3
- ✅ Sistema de vidas/corazones
- ✅ Moneda virtual (gemas)
- ✅ Progresión de niveles guardada en la nube
- ✅ Compras dentro de la app (Stripe)
- ✅ Multiidioma (ES, EN, PT)
- ✅ Efectos visuales místicos

---

## 💰 Productos de Compra (Stripe)

| Producto | Precio | ID Stripe |
|----------|--------|-----------|
| 100 Gemas | €1.99 | price_1SOlwBFOm1x8pT7S6ypXNaT5 |
| 300 Gemas | €4.99 | price_1SOlwPFOm1x8pT7SOXMgNxIl |
| 1200 Gemas | €14.99 | price_1SOlwfFOm1x8pT7S8Ym9qEAv |
| Sin Anuncios (Mes) | €2.99 | price_1SOlxtFOm1x8pT7SqKoeeYTq |
| Sin Anuncios (Siempre) | €7.99 | price_1SOly7FOm1x8pT7SypwYMFz9 |
| Garden Pass | €9.99 | price_1SOlyNFOm1x8pT7SzEKZMpYY |
| **Quick Life (1 vida)** | **€0.20** | price_1SlRBPB6GI8NmIPnV7x0f6mH |

---

## 🔐 Keystore (Firma Android)

| Campo | Valor |
|-------|-------|
| **Archivo** | mystic-garden-release-key.keystore |
| **Ubicación** | D:\mystic-garden-gems-87023\android\app\ |
| **Contraseña Keystore** | mystic123 |
| **Alias** | mystic-garden |
| **Contraseña Key** | mystic123 |
| **SHA1** | 41:F2:6F:24:9C:43:F1:90:35:96:71:23:47:8C:4C:B8:39:4B:A5:E0 |

**Backup:** D:\Escritorio\BACKUP_KEYSTORE\mystic-garden-release-key.keystore

---

## 📁 Estructura de Carpetas Importantes

```
D:\mystic-garden-gems-87023\
├── android\                    # Proyecto Android nativo
│   ├── app\
│   │   ├── mystic-garden-release-key.keystore  # ⭐ KEYSTORE
│   │   └── build\outputs\bundle\release\       # 📦 AAB generado
│   └── key.properties          # Configuración de firma
├── src\                        # Código fuente React
│   ├── components\             # Componentes del juego
│   ├── hooks\                  # Hooks personalizados
│   ├── data\                   # Niveles y productos
│   └── locales\                # Traducciones (es, en, pt)
├── supabase\
│   └── functions\              # Edge functions (pagos, webhooks)
├── public\                     # Assets públicos
├── scripts\                    # Scripts de build
├── build-android-aab.cmd       # ⭐ Script principal de build
└── package.json                # Dependencias
```

---

## 🚀 PASOS PARA GENERAR AAB

### Opción 1: Script Automatizado (Recomendado)

```cmd
cd /d "D:\mystic-garden-gems-87023"
git pull origin main
build-android-aab.cmd
```

Cuando pregunte contraseñas:
- **Contraseña keystore:** `mystic123`
- **Contraseña key:** `mystic123`

### Opción 2: Pasos Manuales

```cmd
cd /d "D:\mystic-garden-gems-87023"

REM 1. Actualizar código
git pull origin main

REM 2. Instalar dependencias
npm install

REM 3. Compilar web
npm run build

REM 4. Sincronizar con Android
npx cap sync android

REM 5. Generar AAB
cd android
gradlew.bat :app:bundleRelease
```

### Opción 3: Si Hay Errores de Build

```cmd
cd /d "D:\mystic-garden-gems-87023"

REM Limpiar y resetear
git reset --hard
git clean -fd
git pull origin main

REM Regenerar carpeta android
rmdir /s /q android
npx cap add android
npx cap sync android

REM Restaurar keystore
git restore android/key.properties
git restore android/app/mystic-garden-release-key.keystore

REM Compilar
build-android-aab.cmd
```

---

## 📦 Ubicación del AAB Generado

```
D:\mystic-garden-gems-87023\android\app\build\outputs\bundle\release\app-release.aab
```

Para abrir la carpeta:
```cmd
start "" "D:\mystic-garden-gems-87023\android\app\build\outputs\bundle\release"
```

---

## ⏱️ Tiempos de Google Play

| Tipo de Testing | Tiempo Aproximado |
|-----------------|-------------------|
| Internal Testing | < 10 minutos |
| Closed Testing | 1-2 horas |
| Open Testing | 2-4 horas |
| Producción | 1-3 días |

---

## 🔧 Comandos Útiles

```cmd
REM Ir al proyecto
cd /d "D:\mystic-garden-gems-87023"

REM Ver estado de git
git status

REM Actualizar código
git pull origin main

REM Verificar keystore
keytool -list -v -keystore "android\app\mystic-garden-release-key.keystore"

REM Abrir carpeta AAB
start "" "android\app\build\outputs\bundle\release"
```

---

## ✅ Checklist Pre-Publicación

- [ ] Código actualizado (`git pull`)
- [ ] Versión incrementada en build-android-aab.cmd
- [ ] AAB generado sin errores
- [ ] Probado en dispositivo Android
- [ ] Subido a Google Play Console
- [ ] Screenshots actualizados (si hay cambios visuales)

---

*Última actualización: Enero 2026*
*Versión del documento: 2.0*
