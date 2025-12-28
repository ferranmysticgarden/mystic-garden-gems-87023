# 📱 RESUMEN COMPLETO - MYSTIC GARDEN PRO

## 🔑 DATOS DEL KEYSTORE (FIRMA)

| Campo | Valor |
|-------|-------|
| **Archivo** | `android/app/mystic-garden-release-key.keystore` |
| **Alias** | `mystic-garden` |
| **Contraseña keystore** | `mystic123` |
| **Contraseña key** | `mystic123` |
| **SHA-1** | `37:62:75:43:D5:7F:0E:BE:AE:F1:78:D6:79:6C:D2:DF:52:36:C3:09` |

---

## 📦 DATOS DE LA APP

| Campo | Valor |
|-------|-------|
| **Package name** | `com.mysticgarden.game` |
| **App name** | `Mystic Garden Pro` |
| **versionCode actual** | `711` |
| **versionName actual** | `7.1.1` |

---

## 📁 UBICACIÓN DE ARCHIVOS IMPORTANTES

### En el repositorio (Lovable/GitHub):
```
mystic-garden-gems-87023/
├── build-android-aab.cmd          # Script principal para generar AAB
├── build-android-aab-nopatch.cmd  # Script alternativo sin parche de versión
├── capacitor.config.ts            # Configuración de Capacitor
├── src/                           # Código fuente del juego
│   ├── App.tsx                    # Componente principal
│   ├── pages/Index.tsx            # Pantalla principal del juego
│   ├── components/
│   │   ├── GameScreen.tsx         # Pantalla de juego (victoria/derrota)
│   │   ├── Board.tsx              # Tablero Match-3
│   │   ├── Tile.tsx               # Fichas del juego
│   │   ├── LevelSelect.tsx        # Selector de niveles
│   │   ├── Shop.tsx               # Tienda
│   │   └── AuthPage.tsx           # Página de login
│   └── hooks/
│       ├── useGameState.ts        # Estado del juego (vidas, gemas, niveles)
│       └── useAuth.ts             # Autenticación
├── android/
│   ├── app/
│   │   ├── mystic-garden-release-key.keystore  # ⚠️ KEYSTORE - NO BORRAR
│   │   └── key.properties         # Configuración de firma
│   └── local.properties           # Ruta SDK (generado localmente)
└── scripts/
    ├── patch-android-gradle.ps1         # Script PowerShell para parchear versión
    └── ensure-android-mainactivity.ps1  # Script para asegurar MainActivity existe

### Generados localmente (después de `npx cap sync android`):
```
android/
├── app/
│   ├── build.gradle               # ⚠️ Aquí está versionCode/versionName
│   ├── src/main/
│   │   ├── AndroidManifest.xml    # Manifiesto Android
│   │   ├── res/                   # Recursos (iconos, etc.)
│   │   └── assets/public/         # Tu web compilada (dist/)
│   └── build/outputs/bundle/release/
│       └── app-release.aab        # ⚠️ ARCHIVO PARA SUBIR A GOOGLE PLAY
├── gradlew.bat                    # Ejecutable Gradle
└── gradle/                        # Wrapper de Gradle
```

---

## ✅ PASOS PARA GENERAR AAB (COPIAR Y PEGAR)

### Paso 1: Abrir CMD y navegar al proyecto
```bat
cd C:\Users\PC\mystic-garden-gems-87023
```

### Paso 2: Actualizar desde GitHub (si hay conflictos)
```bat
git status

copy build-android-aab.cmd build-android-aab.cmd.BACKUP

git stash push -u -m "backup antes de pull"

git pull

git stash pop
```

### Paso 3: Generar el AAB
```bat
build-android-aab.cmd
```

### Paso 4: Cuando pida contraseñas
```
Contraseña keystore: mystic123
Contraseña key: mystic123
```

### Paso 5: Abrir carpeta con el AAB generado
```bat
explorer android\app\build\outputs\bundle\release
```

---

## 🔄 SI NECESITAS CAMBIAR EL NÚMERO DE VERSIÓN

### Opción A: Editar el script (recomendado)
Abre `build-android-aab.cmd` y cambia estas líneas:
```bat
set "TARGET_VERSION_CODE=710"
set "TARGET_VERSION_NAME=7.1.0"
```

### Opción B: Editar build.gradle directamente
```bat
notepad android\app\build.gradle
```
Busca y cambia:
- `versionCode` → número siguiente
- `versionName` → versión legible

---

## ⚠️ SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "git pull" falla por cambios locales
```bat
git stash push -u -m "backup"
git pull
git stash pop
```

### Error: "AndroidManifest.xml no encontrado"
```bat
npm run build
npx cap sync android
```

### Error: "versionCode ya usado"
Incrementa `TARGET_VERSION_CODE` en `build-android-aab.cmd`

### Error: "Clave de firma incorrecta"
Verifica en Google Play Console → Integridad de la app → Certificado de clave de subida
SHA-1 debe ser: `37:62:75:43:D5:7F:0E:BE:AE:F1:78:D6:79:6C:D2:DF:52:36:C3:09`

---

## 📋 CHECKLIST PRE-PUBLICACIÓN

- [ ] versionCode es mayor al anterior (actual: 711)
- [ ] Keystore correcto (`mystic-garden-release-key.keystore`)
- [ ] Contraseña: `mystic123`
- [ ] Package: `com.mysticgarden.game`
- [ ] AAB generado sin errores
- [ ] AAB firmado (SHA-1: 37:62:75:43...)

---

## 🎮 FUNCIONALIDADES DEL JUEGO

1. **Match-3 gameplay** - Combina 3+ fichas iguales
2. **100+ niveles** - Progresión desbloqueada
3. **Sistema de vidas** - 5 vidas, regeneración automática
4. **Gemas** - Moneda del juego
5. **Tienda** - Compras in-app
6. **Autenticación** - Login con email
7. **Guardado en la nube** - Progreso sincronizado
8. **Pantalla de victoria** - Confetti y recompensas
9. **Música de fondo** - Con control de silencio

---

## 📅 HISTORIAL DE VERSIONES

| versionCode | versionName | Fecha | Cambios |
|-------------|-------------|-------|---------|
| 711 | 7.1.1 | 28 dic 2025 | **FIX CRÍTICO**: Solución ClassNotFoundException MainActivity |
| 710 | 7.1.0 | 27 dic 2025 | Correcciones de versión |
| 709 | 7.0.9 | 26 dic 2025 | Actualización |
| 703 | 7.0.7 | 24 dic 2025 | Nueva clave de firma |
| ... | ... | ... | ... |

---

## 🔧 CAMBIOS VERSIÓN 7.1.1 (FIX CRÍTICO)

### Problema resuelto:
**ClassNotFoundException: com.mysticgarden.game.MainActivity**
- La app crasheaba inmediatamente al abrirse
- Capacitor generaba MainActivity en ruta incorrecta

### Archivos creados/modificados:

#### 1. `scripts/ensure-android-mainactivity.ps1` (NUEVO)
**Ubicación:** `scripts/ensure-android-mainactivity.ps1`
**Función:** Asegura que MainActivity exista en la ruta correcta

```powershell
# Lo que hace:
# 1. Crea carpeta: android/app/src/main/java/com/mysticgarden/game/
# 2. Genera MainActivity.java con package correcto
# 3. Parchea AndroidManifest.xml para usar .MainActivity
```

#### 2. `scripts/patch-android-gradle.ps1` (MODIFICADO)
**Ubicación:** `scripts/patch-android-gradle.ps1`
**Cambios:** Ahora también parchea el `namespace` en build.gradle

#### 3. `build-android-aab.cmd` (MODIFICADO)
**Ubicación:** `build-android-aab.cmd`
**Cambios:**
- Versión actualizada a 711/7.1.1
- Añadido paso 3.6: ejecuta ensure-android-mainactivity.ps1

#### 4. `build-android-aab-nopatch.cmd` (MODIFICADO)
**Ubicación:** `build-android-aab-nopatch.cmd`
**Cambios:** Añadido paso 3.6 para ensure-android-mainactivity.ps1

### Estructura de archivos Android después del fix:

```
android/
├── app/
│   ├── mystic-garden-release-key.keystore
│   ├── build.gradle                    # Con namespace=com.mysticgarden.game
│   └── src/main/
│       ├── AndroidManifest.xml         # Con android:name=".MainActivity"
│       ├── java/
│       │   └── com/
│       │       └── mysticgarden/
│       │           └── game/
│       │               └── MainActivity.java  # ⚠️ GENERADO POR SCRIPT
│       ├── res/
│       └── assets/
└── ...
```

### Flujo del build actualizado:

```
1. npm install
2. npm run build
3. npx cap sync android
   ↓
3.5 patch-android-gradle.ps1      → Parchea versionCode, versionName, namespace
   ↓
3.6 ensure-android-mainactivity.ps1 → Crea/parchea MainActivity + AndroidManifest
   ↓
4. gradlew bundleRelease         → Genera AAB firmado
```

### Si el problema vuelve a ocurrir:

1. Verifica que existe: `android/app/src/main/java/com/mysticgarden/game/MainActivity.java`
2. Verifica AndroidManifest.xml tiene: `android:name=".MainActivity"`
3. Verifica build.gradle tiene: `namespace "com.mysticgarden.game"`
4. Ejecuta manualmente:
   ```powershell
   powershell -File scripts\ensure-android-mainactivity.ps1 -AppId "com.mysticgarden.game"
   ```

---

## 🆘 COMANDOS RÁPIDOS

```bat
# Generar AAB completo
cd C:\Users\PC\mystic-garden-gems-87023
git pull
build-android-aab.cmd

# Abrir carpeta AAB
explorer android\app\build\outputs\bundle\release

# Ver versión del keystore
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore android\app\mystic-garden-release-key.keystore

# Verificar firma del AAB
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -printcert -jarfile android\app\build\outputs\bundle\release\app-release.aab
```

---

**Última actualización:** 27 diciembre 2025
