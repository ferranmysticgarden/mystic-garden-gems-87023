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
set "TARGET_VERSION_CODE=702"
set "TARGET_VERSION_NAME=7.0.6"

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

REM --- Patch Gradle (REAL) ---
echo [3_5/4] Forzando version (versionCode/versionName) en build.gradle REAL...

REM IMPORTANTE:
REM - NO tocar android\app\capacitor.build.gradle (es generado por Capacitor).
REM - versionCode/versionName se deben cambiar en android\app\build.gradle (o build.gradle.kts).

set "GRADLE_FILE="
set "GRADLE_KIND="

if exist "android\app\build.gradle" (
  set "GRADLE_FILE=android\app\build.gradle"
  set "GRADLE_KIND=groovy"
) else if exist "android\app\build.gradle.kts" (
  set "GRADLE_FILE=android\app\build.gradle.kts"
  set "GRADLE_KIND=kts"
)

if not defined GRADLE_FILE (
  echo ERROR: No encuentro android\app\build.gradle ni build.gradle.kts.
  echo Esto normalmente significa que NO tienes la plataforma Android generada.
  echo Prueba: npx cap add android
  start "" explorer "android"
  pause
  exit /b 1
)

REM Normalizar a ruta absoluta
for %%I in ("%GRADLE_FILE%") do set "GRADLE_FILE=%%~fI"

echo Gradle objetivo: "%GRADLE_FILE%" (%GRADLE_KIND%)
echo Parcheando applicationId %TARGET_APP_ID%  versionCode %TARGET_VERSION_CODE%  versionName %TARGET_VERSION_NAME%...

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\patch-android-gradle.ps1" -GradleFile "%GRADLE_FILE%" -Kind "%GRADLE_KIND%" -AppId "%TARGET_APP_ID%" -VersionCode %TARGET_VERSION_CODE% -VersionName "%TARGET_VERSION_NAME%"

if errorlevel 1 (
  echo ERROR: No pude parchear el build.gradle (PowerShell fallo).
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

set /p STORE_PWD=Contrasena keystore: 
set /p KEY_PWD=Contrasena key: 

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
