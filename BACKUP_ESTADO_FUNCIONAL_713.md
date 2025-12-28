# 🎮 BACKUP ESTADO FUNCIONAL - Mystic Garden v7.1.3 (713)
> Fecha: 28 Diciembre 2024
> Estado: ✅ FUNCIONANDO

---

## 📋 DATOS DE LA APP

| Campo | Valor |
|-------|-------|
| **Package ID** | `com.mysticgarden.game` |
| **Nombre** | Mystic Garden Pro |
| **Version Code** | `713` |
| **Version Name** | `7.1.3` |
| **Keystore Alias** | `mystic-garden` |

---

## 📁 ARCHIVOS CRÍTICOS Y SU CONTENIDO

### 1. build-android-aab.cmd (Configuración de versión)
```batch
set "TARGET_APP_ID=com.mysticgarden.game"
set "TARGET_VERSION_CODE=713"
set "TARGET_VERSION_NAME=7.1.3"
```

### 2. capacitor.config.ts
```typescript
appId: 'app.lovable.b7778f9666614e96a891680abe7f31b6'
appName: 'mystic-garden-gems-87023'
webDir: 'dist'
```

### 3. scripts/ensure-android-mainactivity.ps1
- Elimina TODOS los MainActivity existentes de cualquier paquete
- Crea MainActivity.java en `com/mysticgarden/game/`
- Actualiza AndroidManifest.xml con package correcto
- Usa FQCN: `com.mysticgarden.game.MainActivity`

### 4. scripts/patch-android-gradle.ps1
- Parchea applicationId a `com.mysticgarden.game`
- Actualiza versionCode y versionName
- Configura namespace correctamente

---

## 🔑 KEYSTORE

| Campo | Valor |
|-------|-------|
| **Ubicación** | `android/app/mystic-garden-release-key.keystore` |
| **Alias** | `mystic-garden` |
| **SHA-1** | (guardado en key.properties) |

---

## 📂 ESTRUCTURA DE ARCHIVOS ANDROID (después de sync)

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/
│   │       └── com/
│   │           └── mysticgarden/
│   │               └── game/
│   │                   └── MainActivity.java  ← CRÍTICO
│   └── build.gradle(.kts)
├── key.properties
└── mystic-garden-release-key.keystore
```

---

## 🛠️ COMANDOS PARA GENERAR AAB

```cmd
cd C:\Users\PC\mystic-garden-gems-87023
git pull
build-android-aab.cmd
```

---

## 📝 FLUJO DE BUILD

1. `npm install`
2. `npm run build`
3. `npx cap sync android`
4. PowerShell: `patch-android-gradle.ps1` → parchea versión y applicationId
5. PowerShell: `ensure-android-mainactivity.ps1` → crea MainActivity correcto
6. Gradle: `bundleRelease` → genera AAB firmado

---

## 🐛 FIX APLICADO EN 7.1.3

**Problema:** `ClassNotFoundException: MainActivity`
**Causa:** MainActivity se creaba en paquete incorrecto
**Solución:**
- Script elimina TODOS los MainActivity existentes
- Crea MainActivity.java en ruta exacta: `com/mysticgarden/game/`
- AndroidManifest.xml usa FQCN: `android:name="com.mysticgarden.game.MainActivity"`

---

## 📊 HISTORIAL DE VERSIONES

| Version | Code | Fecha | Cambio |
|---------|------|-------|--------|
| 7.1.0 | 710 | Dic 2024 | Inicial |
| 7.1.1 | 711 | Dic 2024 | Fix MainActivity script |
| 7.1.2 | 712 | Dic 2024 | Fix FQCN en manifest |
| 7.1.3 | 713 | 28/Dic/2024 | Fix completo ClassNotFoundException |

---

## ✅ CHECKLIST PRE-PUBLICACIÓN

- [ ] git pull ejecutado
- [ ] build-android-aab.cmd ejecutado sin errores
- [ ] AAB generado en `android/app/build/outputs/bundle/release/`
- [ ] Subir AAB a Play Console
- [ ] Crear release en pruebas cerradas
- [ ] Verificar en dispositivo real

---

## 🚨 SI ALGO FALLA

1. **Error npm:** `npm cache clean --force` y reintentar
2. **Error Gradle:** Borrar `android/.gradle` y reintentar
3. **Error MainActivity:** Verificar que script PowerShell se ejecutó
4. **Error firma:** Verificar contraseñas de keystore

---

## 📞 COMANDOS ÚTILES

### Generar AAB completo:
```cmd
cd C:\Users\PC\mystic-garden-gems-87023
git pull
build-android-aab.cmd
```

### Abrir carpeta del AAB:
```cmd
start "" "C:\Users\PC\mystic-garden-gems-87023\android\app\build\outputs\bundle\release"
```

### Abrir Play Console:
```cmd
start "" "https://play.google.com/console/"
```

### Ver firma del AAB:
```cmd
cd C:\Users\PC\mystic-garden-gems-87023\android
jarsigner -verify -verbose -certs app\build\outputs\bundle\release\app-release.aab
```
