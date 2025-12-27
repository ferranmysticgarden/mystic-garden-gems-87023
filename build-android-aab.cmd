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

echo [3.5/4] Forzando version (versionCode/versionName) en build.gradle REAL...
set "TARGET_APP_ID=com.mysticgarden.game"
set "TARGET_VERSION_CODE=701"
set "TARGET_VERSION_NAME=7.0.4"

REM IMPORTANTE:
REM - NO tocar android\app\capacitor.build.gradle (es generado por Capacitor).
REM - versionCode/versionName se deben cambiar en android\app\build.gradle (o build.gradle.kts).

set "GRADLE_FILE="

REM 1) Ruta esperada
if exist "android\app\build.gradle" set "GRADLE_FILE=android\app\build.gradle"
if not defined GRADLE_FILE if exist "android\app\build.gradle.kts" set "GRADLE_FILE=android\app\build.gradle.kts"

REM 2) Fallback: buscar por si la estructura cambia
if not defined GRADLE_FILE (
  for /f "delims=" %%F in ('dir /b /s "android\app\build.gradle" 2^>nul') do if not defined GRADLE_FILE set "GRADLE_FILE=%%F"
)
if not defined GRADLE_FILE (
  for /f "delims=" %%F in ('dir /b /s "android\app\build.gradle.kts" 2^>nul') do if not defined GRADLE_FILE set "GRADLE_FILE=%%F"
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

set "GRADLE_KIND=groovy"
echo %GRADLE_FILE% | findstr /i "\.kts$" >nul && set "GRADLE_KIND=kts"

echo Gradle objetivo: "%GRADLE_FILE%" (%GRADLE_KIND%)

echo Parcheando applicationId %TARGET_APP_ID% ^| versionCode %TARGET_VERSION_CODE% ^| versionName %TARGET_VERSION_NAME%...
set "GRADLE=%GRADLE_FILE%"
set "KIND=%GRADLE_KIND%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$f=$env:GRADLE; $c=Get-Content -LiteralPath $f -Raw; if ($env:KIND -eq 'kts') { $c=[regex]::Replace($c,'applicationId\s*=\s*\"[^\"]+\"',('applicationId = \"'+$env:TARGET_APP_ID+'\"'),1); $c=[regex]::Replace($c,'versionCode\s*=\s*\d+',('versionCode = '+$env:TARGET_VERSION_CODE),1); $c=[regex]::Replace($c,'versionName\s*=\s*\"[^\"]+\"',('versionName = \"'+$env:TARGET_VERSION_NAME+'\"'),1); } else { $c=[regex]::Replace($c,'applicationId\s+\"[^\"]+\"',('applicationId \"'+$env:TARGET_APP_ID+'\"'),1); $c=[regex]::Replace($c,'versionCode\s+\d+',('versionCode '+$env:TARGET_VERSION_CODE),1); $c=[regex]::Replace($c,'versionName\s+\"[^\"]+\"',('versionName \"'+$env:TARGET_VERSION_NAME+'\"'),1); } [IO.File]::WriteAllText($f,$c); Write-Host ('PARCHADO: '+$f); (Get-Item -LiteralPath $f).LastWriteTime"

if errorlevel 1 (
  echo ERROR: No pude parchear el build.gradle (PowerShell fallo).
  pause
  exit /b 1
)

echo.
echo === Verificando %GRADLE_FILE% ===
findstr /n /c:"applicationId" /c:"versionCode" /c:"versionName" "%GRADLE_FILE%"
for %%A in ("%GRADLE_FILE%") do echo Timestamp: %%~tA

echo.
echo Abriendo %GRADLE_FILE% para que lo edites (version 700)...
start "" notepad.exe "%GRADLE_FILE%"
start "" explorer.exe /select,"%GRADLE_FILE%"
echo.
echo EDITA/REVISA y GUARDA. Luego vuelve aqui y pulsa una tecla para continuar con el AAB.
pause


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
