# Estado del Reset de Upload Key - Mystic Garden Pro

> **Última actualización:** 24 diciembre 2025  
> **SHA-1 VERIFICADO:** ✅ `37:62:75:43:D5:7F:0E:BE:AE:F1:78:D6:79:6C:D2:DF:52:36:C3:09`  
> **Contraseña keystore:** `mystic123`

---

## 📱 Información de la App

| Campo | Valor |
|-------|-------|
| **Package name** | `com.mysticgarden.game` |
| **Play App Signing** | ✅ ACTIVO (Google gestiona la clave de firma) |
| **Proyecto local** | `C:\Users\PC\mystic-garden-gems-87023` |

---

## 🔑 Claves y Huellas

### Clave de FIRMA de Google (no cambia nunca)
- **SHA-1:** `A7:0A:8D:B6:18:BC:95:EF:1C:4F:3A:1C:93:59:97:B0:45:51:BC:37`
- **SHA-256:** `AB:10:13:CB:93:61:87:46:32:C8:EA:E9:82:A6:09:34:57:8A:89:76:7F:92:48:92:C1:F2:C2:A9:29:60:CF:E7`

### Upload Key ANTIGUA (contraseña perdida)
- **SHA-1:** `41:F2:6F:24:9C:43:F1:90:35:96:71:23:47:8C:4C:B8:39:4B:A5:E0`
- **Archivo:** `mystic-garden-release-key.OLD.keystore` (renombrado como backup)

### Upload Key NUEVA (creada 24/dic/2025)
- **SHA-1:** `37:62:75:43:D5:7F:0E:BE:AE:F1:78:D6:79:6C:D2:DF:52:36:C3:09`
- **Archivo:** `android/app/mystic-garden-release-key.keystore`
- **Alias:** `mystic-garden`
- **Contraseña:** *(el usuario la sabe - NO guardar aquí)*
- **Certificado exportado:** `android/app/upload_certificate.pem`

---

## ✅ Pasos COMPLETADOS

1. ✅ Solicitar cambio de upload key en Google Play Console (hace 2 días)
2. ✅ Google aprobó el cambio (a partir del 23/dic/2025)
3. ✅ Crear NUEVO keystore (`mystic-garden-release-key.keystore`)
4. ✅ Exportar certificado (`upload_certificate.pem`)
5. ✅ Subir `upload_certificate.pem` a Google Play Console

---

## ⏳ Pasos PENDIENTES

### Paso 6: Verificar que Play Console muestra el SHA-1 NUEVO
En **Play Console → Integridad de la app → Certificado de clave de subida**:
- El SHA-1 debe ser ahora: `37:62:75:43:D5:7F:0E:BE:AE:F1:78:D6:79:6C:D2:DF:52:36:C3:09`
- Si sigue mostrando `41:F2:...` → el reset aún no se ha aplicado

### Paso 7: Generar el AAB
```cmd
cd C:\Users\PC\mystic-garden-gems-87023
build-android-aab.cmd
```
- Usar la contraseña del keystore NUEVO
- El script pedirá: storePassword y keyPassword (son la misma)

### Paso 8: Subir AAB a Google Play
- Play Console → Producción → Crear nueva versión
- Subir el AAB generado en: `android/app/build/outputs/bundle/release/app-release.aab`
- **IMPORTANTE:** El versionCode debe ser mayor que el anterior

### Paso 9: Publicar
- Rellenar notas de la versión
- Enviar a revisión

---

## 🛠️ Comandos Útiles

### Ver SHA-1 del keystore nuevo
```cmd
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore "C:\Users\PC\mystic-garden-gems-87023\android\app\mystic-garden-release-key.keystore" -alias mystic-garden | findstr /i "SHA1 SHA-1"
```

### Ver SHA-1 del certificado .pem
```cmd
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -printcert -file "C:\Users\PC\mystic-garden-gems-87023\android\app\upload_certificate.pem" | findstr /i "SHA1 SHA-1"
```

### Listar archivos keystore existentes
```cmd
dir C:\Users\PC\mystic-garden-gems-87023\android\app\*.keystore C:\Users\PC\mystic-garden-gems-87023\android\app\*.jks
```

---

## 📁 Archivos en android/app/

| Archivo | Descripción |
|---------|-------------|
| `mystic-garden-release-key.keystore` | ✅ Keystore NUEVO (usar este) |
| `mystic-garden-release-key.OLD.keystore` | ❌ Keystore antiguo (backup, contraseña perdida) |
| `mysticgarden-release.jks` | ❓ Otro keystore antiguo (02/dic/2025) |
| `upload_certificate.pem` | Certificado para subir a Google Play |

---

## ⚠️ Recordatorios Importantes

1. **NUNCA** perder la contraseña del keystore nuevo
2. **GUARDAR** backup del keystore en lugar seguro (fuera del proyecto)
3. El archivo `key.properties` NO debe contener contraseñas en texto plano en producción
4. La clave de FIRMA de Google (`A7:0A:8D:...`) es la que usan los usuarios finales
5. La clave de SUBIDA (`37:62:75:...`) solo sirve para autenticar las subidas a Play Console
