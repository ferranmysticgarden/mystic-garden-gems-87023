# COMANDOS COMPLETOS PARA GENERAR AAB FIRMADO

**NO SIMPLIFICAR. NO OMITIR NINGÚN PASO. INCLUIR SIEMPRE EL POWERSHELL.**

## Comandos Completos

```cmd
cd /d "D:\mystic-garden-gems-87023"

taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM javaw.exe >nul 2>&1
taskkill /F /IM gradle.exe >nul 2>&1
taskkill /F /IM adb.exe >nul 2>&1
if exist ".git\index.lock" del /f ".git\index.lock"

git checkout -- android/app/src/main/AndroidManifest.xml build-android-aab.cmd
git pull

powershell -Command "(Get-Content 'android\app\build.gradle') -replace 'versionCode \d+', 'versionCode 950' -replace 'versionName \"[^\"]+\"', 'versionName \"9.5.0\"' | Set-Content 'android\app\build.gradle' -Encoding UTF8"

findstr /i "versionCode versionName" android\app\build.gradle

set STORE_PWD=mystic2026
set KEY_PWD=mystic2026

call build-android-aab.cmd
```

## Explicación de cada paso

1. **cd /d** - Ir al directorio del proyecto
2. **taskkill** (4 líneas) - Matar procesos que bloquean archivos
3. **del .git\index.lock** - Eliminar bloqueo de git si existe
4. **git checkout** - Descartar cambios locales en archivos críticos
5. **git pull** - Descargar última versión del código
6. **powershell** - **CRÍTICO: Parchea versionCode/versionName en build.gradle**
7. **findstr** - Verificar que la versión se aplicó correctamente
8. **set STORE_PWD/KEY_PWD** - Configurar contraseñas (evita prompts)
9. **call build-android-aab.cmd** - Ejecutar script de build

## Versión Actual

- **Versión:** 9.5.0
- **Code:** 950

## Salida

`android\app\build\outputs\bundle\release\app-release.aab`

---

**IMPORTANTE:** El paso de PowerShell es OBLIGATORIO. Sin él, usa la versión que tenga Capacitor.