@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

echo ==== Mystic Garden: Android AAB build (Release) ====

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

echo [1/4] npm install
call npm install
if errorlevel 1 (
  echo ERROR: npm install fallo.
  pause
  exit /b 1
)

echo [2/4] npm run build
call npm run build
if errorlevel 1 (
  echo ERROR: npm run build fallo.
  pause
  exit /b 1
)

echo [3/4] npx cap sync android
call npx cap sync android
if errorlevel 1 (
  echo ERROR: npx cap sync android fallo.
  pause
  exit /b 1
)

echo [3.5/4] Forzando package (applicationId) + version...
set "TARGET_APP_ID=com.mysticgarden.game"
set "TARGET_VERSION_CODE=700"
set "TARGET_VERSION_NAME=7.0.0"

echo Localizando capacitor.build.gradle (el archivo correcto con versionCode)...
set "GRADLE_FILE=android\app\capacitor.build.gradle"

if not exist "%GRADLE_FILE%" (
  echo ERROR: No existe %GRADLE_FILE% - ejecuta primero: npx cap sync android
  pause
  exit /b 1
)

echo Gradle objetivo: "%GRADLE_FILE%"

echo Parcheando versionCode %TARGET_VERSION_CODE% y versionName %TARGET_VERSION_NAME%...
powershell -NoProfile -Command "$f='%GRADLE_FILE%'; $c=Get-Content $f -Raw; $c=$c -replace 'versionCode\\s+\\d+','versionCode %TARGET_VERSION_CODE%'; $c=$c -replace 'versionName\\s+[''\""][^''\"]+[''\""]','versionName \"%TARGET_VERSION_NAME%\"'; [IO.File]::WriteAllText($f,$c); Write-Host 'PARCHADO: '+$f"

echo.
echo === Verificando %GRADLE_FILE% ===
findstr /n /c:"versionCode" /c:"versionName" "%GRADLE_FILE%"
echo.
echo Abriendo %GRADLE_FILE% para que verifiques...
start "" notepad "%GRADLE_FILE%"
start "" explorer /select,"%GRADLE_FILE%"
echo.
echo VERIFICA que diga: versionCode 700 y versionName "7.0.0"
echo Guarda Notepad si hiciste cambios, luego pulsa una tecla para continuar.
pause
echo.

pushd android

if not exist "gradlew.bat" (
  echo ERROR: No existe android\gradlew.bat
  popd
  pause
  exit /b 1
)

set "STORE_PATH=%CD%\app\mystic-garden-release-key.keystore"
if not exist "!STORE_PATH!" (
  echo ERROR: No encuentro el keystore
  popd
  pause
  exit /b 1
)
echo Keystore: !STORE_PATH!

echo [4/4] Gradle bundleRelease
echo Limpiando salida anterior (para no subir un AAB viejo)...
if exist "app\build\outputs\bundle\release" rmdir /s /q "app\build\outputs\bundle\release"

set /p STORE_PWD="Contrasena keystore: "
set /p KEY_PWD="Contrasena key: "

call gradlew.bat :app:bundleRelease -Pandroid.injected.signing.store.file="!STORE_PATH!" -Pandroid.injected.signing.store.password="!STORE_PWD!" -Pandroid.injected.signing.key.alias="mystic-garden" -Pandroid.injected.signing.key.password="!KEY_PWD!"

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
