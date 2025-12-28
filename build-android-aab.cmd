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

if not exist "android\key.properties" (
  echo ERROR: No existe android\key.properties
  pause
  exit /b 1
)

REM --- Build config ---
set "TARGET_APP_ID=com.mysticgarden.game"
set "TARGET_VERSION_CODE=713"
set "TARGET_VERSION_NAME=7.1.3"

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

set "STORE_PATH=%CD%\app\mystic-garden-release-key.keystore"
if not exist "%STORE_PATH%" (
  echo ERROR: No encuentro el keystore
  echo Buscado en: %STORE_PATH%
  popd
  pause
  exit /b 1
)

echo Keystore: %STORE_PATH%

echo [4/4] Gradle bundleRelease
echo Limpiando salida anterior (para no subir un AAB viejo)...
if exist "app\build\outputs\bundle\release" rmdir /s /q "app\build\outputs\bundle\release"

set /p STORE_PWD="Contrasena keystore: "
set /p KEY_PWD="Contrasena key: "

call gradlew.bat :app:bundleRelease ^
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

echo ==== AAB generado ====
dir /s /b app\build\outputs\bundle\release\*.aab

start "" "app\build\outputs\bundle\release"

popd
pause
