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

REM IMPORTANTE:
REM - NO tocamos android\app\capacitor.build.gradle (es generado por Capacitor).
REM - versionCode/versionName viven en android\app\build.gradle (o build.gradle.kts).

echo Localizando build.gradle de la app...
set "GRADLE_FILE=android\app\build.gradle"
set "GRADLE_FILE_KTS=android\app\build.gradle.kts"

if exist "%GRADLE_FILE%" (
  set "GRADLE_KIND=groovy"
) else if exist "%GRADLE_FILE_KTS%" (
  set "GRADLE_KIND=kts"
  set "GRADLE_FILE=%GRADLE_FILE_KTS%"
) else (
  echo ERROR: No encuentro android\app\build.gradle ni android\app\build.gradle.kts
  echo Ejecuta primero: npx cap sync android
  pause
  exit /b 1
)

echo Gradle objetivo: "%GRADLE_FILE%" (%GRADLE_KIND%)

echo Parcheando applicationId %TARGET_APP_ID% ^| versionCode %TARGET_VERSION_CODE% ^| versionName %TARGET_VERSION_NAME%...
powershell -NoProfile -Command "$f='%GRADLE_FILE%'; $c=Get-Content $f -Raw; $nl=[Environment]::NewLine; if ('%GRADLE_KIND%' -eq 'kts') { 
  if ($c -match 'defaultConfig\\s*\\{') { 
    if ($c -match 'applicationId\\s*=\\s*\\"[^\\\"]+\\"') { $c=[regex]::Replace($c,'applicationId\\s*=\\s*\\"[^\\\"]+\\"','applicationId = \"%TARGET_APP_ID%\"',1) } else { $c=[regex]::Replace($c,'defaultConfig\\s*\\{',('defaultConfig {'+$nl+'        applicationId = \"%TARGET_APP_ID%\"'),1) }
    if ($c -match 'versionCode\\s*=\\s*\\d+') { $c=[regex]::Replace($c,'versionCode\\s*=\\s*\\d+','versionCode = %TARGET_VERSION_CODE%',1) } else { $c=[regex]::Replace($c,'defaultConfig\\s*\\{',('defaultConfig {'+$nl+'        versionCode = %TARGET_VERSION_CODE%'),1) }
    if ($c -match 'versionName\\s*=\\s*\\"[^\\\"]+\\"') { $c=[regex]::Replace($c,'versionName\\s*=\\s*\\"[^\\\"]+\\"','versionName = \"%TARGET_VERSION_NAME%\"',1) } else { $c=[regex]::Replace($c,'defaultConfig\\s*\\{',('defaultConfig {'+$nl+'        versionName = \"%TARGET_VERSION_NAME%\"'),1) }
  } else { throw 'No encuentro defaultConfig { } en build.gradle.kts' }
} else {
  if ($c -match 'defaultConfig\\s*\\{') {
    if ($c -match 'applicationId\\s+\\"[^\\\"]+\\"') { $c=[regex]::Replace($c,'applicationId\\s+\\"[^\\\"]+\\"','applicationId \"%TARGET_APP_ID%\"',1) } else { $c=[regex]::Replace($c,'defaultConfig\\s*\\{',('defaultConfig {'+$nl+'        applicationId \"%TARGET_APP_ID%\"'),1) }
    if ($c -match 'versionCode\\s+\\d+') { $c=[regex]::Replace($c,'versionCode\\s+\\d+','versionCode %TARGET_VERSION_CODE%',1) } else { $c=[regex]::Replace($c,'defaultConfig\\s*\\{',('defaultConfig {'+$nl+'        versionCode %TARGET_VERSION_CODE%'),1) }
    if ($c -match 'versionName\\s+\\"[^\\\"]+\\"') { $c=[regex]::Replace($c,'versionName\\s+\\"[^\\\"]+\\"','versionName \"%TARGET_VERSION_NAME%\"',1) } else { $c=[regex]::Replace($c,'defaultConfig\\s*\\{',('defaultConfig {'+$nl+'        versionName \"%TARGET_VERSION_NAME%\"'),1) }
  } else { throw 'No encuentro defaultConfig { } en build.gradle' }
}
[IO.File]::WriteAllText($f,$c); Write-Host ('PARCHADO: '+$f)"

echo.
echo === Verificando %GRADLE_FILE% ===
findstr /n /c:"applicationId" /c:"versionCode" /c:"versionName" "%GRADLE_FILE%"
echo.
echo Abriendo %GRADLE_FILE% para que verifiques...
start "" notepad "%GRADLE_FILE%"
start "" explorer /select,"%GRADLE_FILE%"
echo.
echo VERIFICA que diga: versionCode 700 y versionName "7.0.0"
echo Guarda Notepad si hiciste cambios, luego pulsa una tecla para continuar.
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
