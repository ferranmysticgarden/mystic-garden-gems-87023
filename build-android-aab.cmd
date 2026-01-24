@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo ==== Mystic Garden: Android AAB build (Release) ====

REM --- Sanity checks ---
if not exist "package.json" (
  echo ERROR: No estoy en la carpeta del proyecto
  pause
  exit /b 1
)

REM key.properties es opcional: la firma se inyecta por linea de comandos (keystore externo)

REM --- Build config ---
set "TARGET_APP_ID=com.mysticgarden.game"
set "TARGET_VERSION_CODE=914"
set "TARGET_VERSION_NAME=9.1.4"

REM --- Step 1/4 ---
echo [1/4] npm install
call npm install
if errorlevel 1 (
  echo ERROR: npm install fallo.
  pause
  exit /b 1
)

REM --- Step 2/4 ---
echo [2/4] npm run build
call npm run build
if errorlevel 1 (
  echo ERROR: npm run build fallo.
  pause
  exit /b 1
)

REM --- Step 3/4 ---
echo [3/4] npx cap sync android
call npx cap sync android
if errorlevel 1 (
  echo ERROR: npx cap sync android fallo.
  pause
  exit /b 1
)

REM --- Step 3.1/4: Ensure Android platform exists ---
if not exist "android\gradlew.bat" (
  echo [3.1/4] Android no encontrado o corrupto. Regenerando plataforma...
  if exist "android" rmdir /s /q "android"
  call npx cap add android
  if errorlevel 1 (
    echo ERROR: npx cap add android fallo.
    pause
    exit /b 1
  )
  echo [3.2/4] npx cap sync android (tras regenerar)
  call npx cap sync android
  if errorlevel 1 (
    echo ERROR: npx cap sync android fallo tras regenerar.
    pause
    exit /b 1
  )
)

REM --- Step 3.3/4: Generate Android icons ---
echo [3.3/4] Generando iconos Android...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\generate-android-icons.ps1"
if errorlevel 1 (
  echo ERROR: No se pudieron generar los iconos.
  pause
  exit /b 1
)

REM --- Step 3.5/4: Patch version ---
echo [3.5/4] Parcheando version en build.gradle...

if exist "android\app\build.gradle" (
  set "GRADLE_FILE=android\app\build.gradle"
  set "GRADLE_KIND=groovy"
) else (
  if exist "android\app\build.gradle.kts" (
    set "GRADLE_FILE=android\app\build.gradle.kts"
    set "GRADLE_KIND=kts"
  ) else (
    echo ERROR: No encuentro build.gradle
    pause
    exit /b 1
  )
)

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\patch-android-gradle.ps1" -GradleFile "%GRADLE_FILE%" -Kind "%GRADLE_KIND%" -AppId "%TARGET_APP_ID%" -VersionCode %TARGET_VERSION_CODE% -VersionName "%TARGET_VERSION_NAME%"

if errorlevel 1 (
  echo ERROR: PowerShell fallo al parchear.
  pause
  exit /b 1
)

REM --- Step 3.6/4: Ensure MainActivity exists ---
echo [3.6/4] Verificando MainActivity...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\ensure-android-mainactivity.ps1" -AppId "%TARGET_APP_ID%"
if errorlevel 1 (
  echo ERROR: No pude asegurar MainActivity.
  pause
  exit /b 1
)

REM --- Step 3.6.1/4: Verify AD_ID permission exists in manifest (pre-Gradle) ---
echo [3.6.1/4] Verificando permiso AD_ID en AndroidManifest...
findstr /C:"com.google.android.gms.permission.AD_ID" "android\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
  echo ERROR: El AndroidManifest NO contiene el permiso AD_ID.
  echo Revisa android\app\src\main\AndroidManifest.xml y scripts\ensure-android-mainactivity.ps1
  pause
  exit /b 1
) else (
  echo OK: Permiso AD_ID presente en AndroidManifest.xml
)

REM --- Step 4/4 ---
pushd android

if not exist "gradlew.bat" (
  echo ERROR: No existe android\gradlew.bat
  popd
  pause
  exit /b 1
)

REM --- Signing (Upload Key) ---

REM Permite sobreescribir la ruta por variable de entorno, pero la normaliza para evitar problemas con comillas
set "STORE_PATH=%UPLOAD_KEYSTORE_PATH%"
if "%STORE_PATH%"=="" set "STORE_PATH=D:\keys_upload_new\mystic-upload-key.jks"
for %%I in ("%STORE_PATH%") do set "STORE_PATH=%%~fI"

REM NOTE: En algunos entornos, `if exist` puede fallar por permisos/expansion rara.
REM Usamos PowerShell Test-Path (LiteralPath) que es mas robusto.
echo Keystore (upload) buscado en: "%STORE_PATH%"
REM Verificacion directa con CMD if exist (sin PowerShell para evitar problemas de expansion)
if exist "%STORE_PATH%" (
  echo OK: Keystore encontrado.
  goto :keystore_found
)
echo ERROR: No encuentro el keystore de subida (Upload Key)
echo Buscado en: %STORE_PATH%
echo TIP: Puedes definir UPLOAD_KEYSTORE_PATH con la ruta correcta.
popd
pause
exit /b 1

:keystore_found

echo Keystore (upload): %STORE_PATH%

echo [4/4] Gradle bundleRelease
echo Limpiando salida anterior (para no subir un AAB viejo)...
if exist "app\build\outputs\bundle\release" rmdir /s /q "app\build\outputs\bundle\release"

REM Asegura que no reutilice artefactos viejos
call gradlew.bat --stop >nul 2>&1

set /p STORE_PWD="Contrasena keystore: "
set /p KEY_PWD="Contrasena key: "

call gradlew.bat :app:clean :app:bundleRelease ^
  -Pandroid.injected.signing.store.file="%STORE_PATH%" ^
  -Pandroid.injected.signing.store.password="%STORE_PWD%" ^
  -Pandroid.injected.signing.key.alias="mystic-garden" ^
  -Pandroid.injected.signing.key.password="%KEY_PWD%"

if errorlevel 1 (
  echo ERROR: Gradle fallo
  popd
  pause
  exit /b 1
)

REM --- Post-build sanity: Check merged manifests contain AD_ID (best-effort) ---
echo Verificando permiso AD_ID en manifests mergeados (best-effort)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root='app\\build\\intermediates'; if (!(Test-Path $root)) { Write-Host 'WARN: No existe app\\build\\intermediates (no puedo verificar manifests mergeados).'; exit 0 }; $files = Get-ChildItem -Path $root -Recurse -Filter AndroidManifest.xml -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match 'merged' -or $_.FullName -match 'manifest' }; $ok=$false; foreach($f in $files){ try { $c = Get-Content -LiteralPath $f.FullName -Raw -ErrorAction Stop } catch { continue }; if($c -match 'com.google.android.gms.permission.AD_ID'){ Write-Host ('OK: AD_ID encontrado en: ' + $f.FullName); $ok=$true; break } }; if(-not $ok){ Write-Host 'WARN: No encontre AD_ID en los manifests mergeados que vi. Si Play sigue fallando, revisa el AAB subido (puede ser viejo).'; }"

REM Verificacion de firma del AAB (Google Play lo exige)
set "AAB_PATH=%CD%\app\build\outputs\bundle\release\app-release.aab"
if not exist "%AAB_PATH%" (
  echo ERROR: No encuentro el AAB generado: %AAB_PATH%
  popd
  pause
  exit /b 1
)

 REM --- Post-build AUTHORITATIVE check: Verify AD_ID is inside the final AAB ---
 REM Play Console valida el manifiesto empaquetado dentro del .aab, no el manifest fuente.
 echo Verificando permiso AD_ID dentro del AAB (bundletool)...
 powershell -NoProfile -ExecutionPolicy Bypass -File "..\scripts\verify-aab-adid.ps1" -AabPath "%AAB_PATH%"
 if errorlevel 1 (
   echo ERROR: El AAB generado NO contiene AD_ID (o no pude verificarlo).
   echo NO lo subas a Play Console. Este error es exactamente el que te sale.
   popd
   pause
   exit /b 1
 )

echo Verificando firma del AAB...
jarsigner -verify -verbose -certs "%AAB_PATH%" | findstr /i /c:"jar verified" >nul
if errorlevel 1 (
  echo ERROR: El AAB NO parece estar firmado. NO lo subas.
  echo Prueba de nuevo y revisa las contrasenas.
  popd
  pause
  exit /b 1
) else (
  echo OK: AAB firmado correctamente.
)

echo ==== AAB generado ====
dir /s /b app\build\outputs\bundle\release\*.aab

start "" "app\build\outputs\bundle\release"

popd
pause
