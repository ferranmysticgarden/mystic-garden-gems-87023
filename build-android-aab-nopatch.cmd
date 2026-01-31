@echo off
setlocal EnableExtensions

cd /d "%~dp0"

REM Root absoluto del repo (para que los scripts funcionen incluso tras pushd android)
set "ROOT=%CD%"

echo ==== Mystic Garden: Android AAB build (Release - SIN parche de version) ====
echo (Usa este script si build-android-aab.cmd falla en el paso 3.5)

REM --- Sanity checks ---
if not exist "package.json" (
  echo ERROR: No estoy en la carpeta del proyecto
  pause
  exit /b 1
)

if not exist "android\key.properties" (
  echo ERROR: No existe android\key.properties
  pause
  exit /b 1
)

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

REM --- Step 3.6/4: Ensure MainActivity exists ---
echo [3.6/4] Verificando MainActivity...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\ensure-android-mainactivity.ps1" -AppId "com.mysticgarden.game"
if errorlevel 1 (
  echo ERROR: No pude asegurar MainActivity.
  pause
  exit /b 1
)

REM --- Step 3.62/4: Ensure BILLING permission is present in the manifest ---
echo [3.62/4] Asegurando permiso BILLING en AndroidManifest...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\ensure-billing-permission.ps1" -ManifestPath "%ROOT%\android\app\src\main\AndroidManifest.xml"
if errorlevel 1 (
  echo ERROR: No pude asegurar com.android.vending.BILLING en el AndroidManifest.
  pause
  exit /b 1
)

REM --- Step 3.65/4: Verify BILLING permission is present in the manifest ---
echo [3.65/4] Verificando permiso BILLING en AndroidManifest...
findstr /i "com.android.vending.BILLING" "android\app\src\main\AndroidManifest.xml" >nul
if errorlevel 1 (
  echo ERROR: No encuentro com.android.vending.BILLING en android\app\src\main\AndroidManifest.xml
  pause
  exit /b 1
)

REM --- Step 4/4 ---
pushd android

if not exist "gradlew.bat" (
  echo ERROR: No existe android\gradlew.bat
  popd
  pause
  exit /b 1
)

set "STORE_PATH=%UPLOAD_KEYSTORE_PATH%"
if "%STORE_PATH%"=="" set "STORE_PATH=D:\keys_upload_new\mystic-upload-key.jks"
if not exist "%STORE_PATH%" (
  echo ERROR: No encuentro el keystore de subida (Upload Key)
  echo Buscado en: %STORE_PATH%
  popd
  pause
  exit /b 1
)

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

REM Verificacion de firma del AAB (Google Play lo exige)
set "AAB_PATH=%CD%\app\build\outputs\bundle\release\app-release.aab"
if not exist "%AAB_PATH%" (
  echo ERROR: No encuentro el AAB generado: %AAB_PATH%
  popd
  pause
  exit /b 1
)

echo Verificando firma del AAB...
jarsigner -verify -verbose -certs "%AAB_PATH%" | findstr /i /c:"jar verified" >nul
if errorlevel 1 (
  echo ERROR: El AAB NO parece estar firmado. NO lo subas a Google Play.
  echo Prueba a ejecutar este script de nuevo y revisa las contrasenas.
  popd
  pause
  exit /b 1
) else (
  echo OK: AAB firmado correctamente.
)

REM --- Step 4.1/4: Verify BILLING permission is present INSIDE the final AAB ---
echo.
echo [4.1/4] Verificando BILLING dentro del AAB (bundletool)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\verify-aab-billing.ps1" -AabPath "%AAB_PATH%"
if errorlevel 1 (
  echo ERROR: El AAB final NO contiene com.android.vending.BILLING.
  echo NO LO SUBAS a Google Play (bloquea "Productos unicos").
  popd
  pause
  exit /b 1
)

echo ==== AAB generado ====
dir /s /b app\build\outputs\bundle\release\*.aab

start "" "app\build\outputs\bundle\release"

popd
pause
