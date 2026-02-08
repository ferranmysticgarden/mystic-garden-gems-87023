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

REM Puedes sobreescribir estos valores SIN editar el .cmd usando:
REM   set MG_VERSION_CODE=971
REM   set MG_VERSION_NAME=9.7.1
REM   (opcional) set MG_APP_ID=com.mysticgarden.game

if not "%MG_APP_ID%"=="" set "TARGET_APP_ID=%MG_APP_ID%"

if not "%MG_VERSION_CODE%"=="" (
  set "TARGET_VERSION_CODE=%MG_VERSION_CODE%"
) else (
  set "TARGET_VERSION_CODE=988"
)

if not "%MG_VERSION_NAME%"=="" (
  set "TARGET_VERSION_NAME=%MG_VERSION_NAME%"
) else (
  set "TARGET_VERSION_NAME=9.8.8"
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

REM --- Step 3.2.1/4: Ensure gradle.properties has required flags ---
echo [3.2.1/4] Configurando gradle.properties...
(
  echo org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
  echo android.useAndroidX=true
  echo android.enableJetifier=true
) > android\gradle.properties

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

REM Detectar gradle file (kts tiene prioridad)
set "GRADLE_FILE="
set "GRADLE_KIND="

if exist "android\app\build.gradle.kts" (
  set "GRADLE_FILE=android\app\build.gradle.kts"
  set "GRADLE_KIND=kts"
)
if "%GRADLE_FILE%"=="" if exist "android\app\build.gradle" (
  set "GRADLE_FILE=android\app\build.gradle"
  set "GRADLE_KIND=groovy"
)
if "%GRADLE_FILE%"=="" (
  echo ERROR: No encuentro build.gradle ni build.gradle.kts
  echo Ejecutando cap sync para regenerar...
  call npx cap sync android
  if exist "android\app\build.gradle.kts" (
    set "GRADLE_FILE=android\app\build.gradle.kts"
    set "GRADLE_KIND=kts"
  )
  if exist "android\app\build.gradle" if "%GRADLE_FILE%"=="" (
    set "GRADLE_FILE=android\app\build.gradle"
    set "GRADLE_KIND=groovy"
  )
)
if "%GRADLE_FILE%"=="" (
  echo ERROR FATAL: No se pudo generar build.gradle
  pause
  exit /b 1
)

echo Parcheando archivo: %GRADLE_FILE%
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\patch-android-gradle.ps1" -GradleFile "%GRADLE_FILE%" -Kind "%GRADLE_KIND%" -AppId "%TARGET_APP_ID%" -VersionCode %TARGET_VERSION_CODE% -VersionName "%TARGET_VERSION_NAME%"

if errorlevel 1 (
  echo ERROR: PowerShell fallo al parchear.
  pause
  exit /b 1
)

echo.
echo === VERIFICACION VERSION ===
findstr /i "versionCode versionName minSdk" "%GRADLE_FILE%"
echo.
echo Si no ves %TARGET_VERSION_CODE% arriba, PULSA CTRL+C AHORA
timeout /t 5

REM --- Step 3.6/4: Ensure MainActivity exists ---
echo [3.6/4] Verificando MainActivity...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\ensure-android-mainactivity.ps1" -AppId "%TARGET_APP_ID%"
if errorlevel 1 (
  echo ERROR: No pude asegurar MainActivity.
  pause
  exit /b 1
)

REM --- Step 3.7/4: Inject BILLING permission and library ---
echo [3.7/4] Inyectando BILLING permission y billing library...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\inject-billing.ps1" -AppId "%TARGET_APP_ID%"
if errorlevel 1 (
  echo ERROR: No pude inyectar billing.
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
REM Keystore correcto (ENERO 2026):
REM   D:\keys_upload_new\mystic-upload-key.jks
REM   Alias: mystic-garden
REM   Password: (se pide por prompt o por variables STORE_PWD/KEY_PWD)

REM Selecciona el primer keystore que exista (en este orden):
REM 1) %UPLOAD_KEYSTORE_PATH% (override)
REM 2) D:\keys_upload_new\mystic-upload-key.jks (DEFAULT)
REM 3) D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore (backup)
REM 4) %USERPROFILE%\OneDrive\Escritorio\keys\mystic-garden-release-key.keystore (legacy)
REM 5) app\mystic-garden-release-key.keystore (legacy dentro de android\)

set "STORE_PATH="

if not "%UPLOAD_KEYSTORE_PATH%"=="" (
  if exist "%UPLOAD_KEYSTORE_PATH%" set "STORE_PATH=%UPLOAD_KEYSTORE_PATH%"
)

if "%STORE_PATH%"=="" (
  if exist "D:\keys_upload_new\mystic-upload-key.jks" set "STORE_PATH=D:\keys_upload_new\mystic-upload-key.jks"
)

if "%STORE_PATH%"=="" (
  if exist "D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore" set "STORE_PATH=D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore"
)

if "%STORE_PATH%"=="" (
  if exist "%USERPROFILE%\OneDrive\Escritorio\keys\mystic-garden-release-key.keystore" set "STORE_PATH=%USERPROFILE%\OneDrive\Escritorio\keys\mystic-garden-release-key.keystore"
)

if "%STORE_PATH%"=="" (
  if exist "app\mystic-garden-release-key.keystore" set "STORE_PATH=app\mystic-garden-release-key.keystore"
)

if "%STORE_PATH%"=="" (
  echo ERROR: No encuentro ningun keystore valido.
  echo.
  echo Rutas comprobadas:
  echo  - ^(env^)  %%UPLOAD_KEYSTORE_PATH%%
  echo  - D:\keys_upload_new\mystic-upload-key.jks
  echo  - D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore
  echo  - %%USERPROFILE%%\OneDrive\Escritorio\keys\mystic-garden-release-key.keystore
  echo  - %CD%\app\mystic-garden-release-key.keystore
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

call gradlew.bat clean :app:bundleRelease ^
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

REM --- Step 4.1/4: Verify BILLING permission in AAB ---
echo [4.1/4] Verificando permiso BILLING en AAB...
popd
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\verify-aab-billing.ps1" -AabPath "%AAB_PATH%"
if errorlevel 1 (
  echo.
  echo ============================================
  echo FAIL: El AAB NO contiene permiso BILLING!
  echo Google Play rechazara esta build.
  echo ============================================
  pause
  exit /b 1
)

REM --- Step 4.2/4: Verify Billing Library classes exist in AAB ---
echo [4.2/4] Verificando Billing Library dentro del AAB...
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\verify-aab-billing-library.ps1" -AabPath "%AAB_PATH%"
if errorlevel 1 (
  echo.
  echo ============================================
  echo FAIL: El AAB NO contiene Billing Library!
  echo Google Play NO lo detectara.
  echo ============================================
  pause
  exit /b 1
)
pushd android

echo ==== AAB generado ====
dir /s /b app\build\outputs\bundle\release\*.aab

echo.
echo ============================================
echo OK: AAB listo para subir a Google Play
echo Version: %TARGET_VERSION_NAME% (code %TARGET_VERSION_CODE%)
echo Permiso BILLING: Verificado
echo ============================================

start "" "app\build\outputs\bundle\release"

popd
pause
