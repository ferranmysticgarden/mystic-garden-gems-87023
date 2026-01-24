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
set "TARGET_VERSION_CODE=920"
set "TARGET_VERSION_NAME=9.2.0"

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

REM --- Step 4/4 ---
pushd android

if not exist "gradlew.bat" (
  echo ERROR: No existe android\gradlew.bat
  popd
  pause
  exit /b 1
)

REM --- Signing (Upload Key) ---
REM Selecciona el primer keystore que exista (en este orden):
REM 1) %UPLOAD_KEYSTORE_PATH% (si existe)
REM 2) D:\keys_upload_new\mystic-upload-key.jks
REM 3) app\mystic-garden-release-key.keystore   (dentro de la carpeta android\)
REM 4) D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore

set "STORE_PATH="

if not "%UPLOAD_KEYSTORE_PATH%"=="" (
  if exist "%UPLOAD_KEYSTORE_PATH%" set "STORE_PATH=%UPLOAD_KEYSTORE_PATH%"
)

if "%STORE_PATH%"=="" (
  if exist "D:\keys_upload_new\mystic-upload-key.jks" set "STORE_PATH=D:\keys_upload_new\mystic-upload-key.jks"
)

if "%STORE_PATH%"=="" (
  if exist "app\mystic-garden-release-key.keystore" set "STORE_PATH=app\mystic-garden-release-key.keystore"
)

if "%STORE_PATH%"=="" (
  if exist "D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore" set "STORE_PATH=D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore"
)

if "%STORE_PATH%"=="" (
  echo ERROR: No encuentro ningun keystore valido.
  echo.
  echo Rutas comprobadas:
  echo  - ^(env^)  %%UPLOAD_KEYSTORE_PATH%%
  echo  - D:\keys_upload_new\mystic-upload-key.jks
  echo  - %CD%\app\mystic-garden-release-key.keystore
  echo  - D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore
  echo.
  echo Prueba estos comandos para ver cual existe:
  echo  dir /a "D:\keys_upload_new\mystic-upload-key.jks"
  echo  dir /a "%CD%\app\mystic-garden-release-key.keystore"
  echo  dir /a "D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore"
  popd
  pause
  exit /b 1
)

REM Normaliza a ruta absoluta
for %%I in ("%STORE_PATH%") do set "STORE_PATH=%%~fI"

echo.

echo Keystore (upload): %STORE_PATH%

echo [4/4] Gradle bundleRelease
echo Limpiando salida anterior (para no subir un AAB viejo)...
if exist "app\build\outputs\bundle\release" rmdir /s /q "app\build\outputs\bundle\release"

REM Asegura que no reutilice artefactos viejos
call gradlew.bat --stop >nul 2>&1

REM Passwords: NO se hardcodean en el repo.
REM - Si defines STORE_PWD/KEY_PWD en entorno, no pregunta.
REM - Si no, pide por consola.
if "%STORE_PWD%"=="" set /p STORE_PWD="Contrasena keystore: "
if "%KEY_PWD%"=="" set /p KEY_PWD="Contrasena key: "

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
