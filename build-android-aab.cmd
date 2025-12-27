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
set "TARGET_VERSION_CODE=700"
set "TARGET_VERSION_NAME=7.0.0"

REM IMPORTANTE:
REM - NO tocamos android\app\capacitor.build.gradle (es generado por Capacitor).
REM - versionCode/versionName se deben cambiar en android\app\build.gradle (o build.gradle.kts).

set "GRADLE_FILE="
for /f "usebackq delims=" %%F in (`powershell -NoProfile -Command "$prefs=@('android/app/build.gradle','android/app/build.gradle.kts'); $p=$prefs | Where-Object { Test-Path $_ } | Select-Object -First 1; if ($p) { (Resolve-Path $p).Path; exit 0 } $found=Get-ChildItem -Path 'android/app' -Recurse -File -Include 'build.gradle','build.gradle.kts' -ErrorAction SilentlyContinue | Select-Object -First 1; if ($found) { $found.FullName; exit 0 } exit 1"`) do set "GRADLE_FILE=%%F"

if not defined GRADLE_FILE (
  echo ERROR: No encuentro android\app\build.gradle ni build.gradle.kts.
  echo Si has hecho git pull en una maquina nueva, puede que te falte generar la plataforma Android.
  echo Prueba: npx cap add android  (y luego vuelve a ejecutar este script)
  start "" explorer "android"
  pause
  exit /b 1
)

set "GRADLE_KIND=groovy"
echo %GRADLE_FILE% | findstr /i "\.kts$" >nul && set "GRADLE_KIND=kts"

echo Gradle objetivo: "%GRADLE_FILE%" (%GRADLE_KIND%)

echo Parcheando applicationId %TARGET_APP_ID% ^| versionCode %TARGET_VERSION_CODE% ^| versionName %TARGET_VERSION_NAME%...
powershell -NoProfile -Command "$f='%GRADLE_FILE%'; $c=Get-Content $f -Raw; if ('%GRADLE_KIND%' -eq 'kts') {
  $c=[regex]::Replace($c,'applicationId\s*=\s*\"[^\"]+\"','applicationId = \"%TARGET_APP_ID%\"',1);
  $c=[regex]::Replace($c,'versionCode\s*=\s*\d+','versionCode = %TARGET_VERSION_CODE%',1);
  $c=[regex]::Replace($c,'versionName\s*=\s*\"[^\"]+\"','versionName = \"%TARGET_VERSION_NAME%\"',1);
} else {
  $c=[regex]::Replace($c,'applicationId\s+\"[^\"]+\"','applicationId \"%TARGET_APP_ID%\"',1);
  $c=[regex]::Replace($c,'versionCode\s+\d+','versionCode %TARGET_VERSION_CODE%',1);
  $c=[regex]::Replace($c,'versionName\s+\"[^\"]+\"','versionName \"%TARGET_VERSION_NAME%\"',1);
}
[IO.File]::WriteAllText($f,$c); Write-Host ('PARCHADO: '+$f)"

echo.
echo === Verificando %GRADLE_FILE% ===
findstr /n /c:"applicationId" /c:"versionCode" /c:"versionName" "%GRADLE_FILE%"
echo.
echo Abriendo %GRADLE_FILE% para que lo edites (version 700)...
powershell -NoProfile -Command "Start-Process notepad.exe -ArgumentList @('%GRADLE_FILE%')"
start "" explorer /select,"%GRADLE_FILE%"
echo.
echo EDITA/REVISA y GUARDA. Luego pulsa una tecla para continuar con el AAB.
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
