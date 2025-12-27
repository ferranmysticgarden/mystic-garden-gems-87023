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
set "GRADLE_GROOVY=android\app\build.gradle"
set "GRADLE_KTS=android\app\build.gradle.kts"
set "GRADLE_FILE="
if exist "%GRADLE_GROOVY%" set "GRADLE_FILE=%GRADLE_GROOVY%"
if not defined GRADLE_FILE if exist "%GRADLE_KTS%" set "GRADLE_FILE=%GRADLE_KTS%"
if not defined GRADLE_FILE (
  echo ERROR: No existe android\app\build.gradle ni android\app\build.gradle.kts
  pause
  exit /b 1
)

powershell -NoProfile -Command "$p='com.mysticgarden.game';$dq=[char]34;$f='%GRADLE_FILE%';$isKts=$f.ToLower().EndsWith('.kts');$appId=if($isKts){'applicationId = '+$dq+$p+$dq}else{'applicationId '+$dq+$p+$dq};$ns=if($isKts){'namespace = '+$dq+$p+$dq}else{'namespace '+$dq+$p+$dq};$vCode=if($isKts){'versionCode = 5'}else{'versionCode 5'};$vName=if($isKts){'versionName = '+$dq+'1.0.4'+$dq}else{'versionName '+$dq+'1.0.4'+$dq};$c=Get-Content $f -Raw;$c=$c -replace 'applicationId\s*(=)?\s*[''\x22][^''\x22]+[''\x22]',$appId;$c=$c -replace 'namespace\s*(=)?\s*[''\x22][^''\x22]+[''\x22]',$ns;$c=$c -replace 'versionCode\s*(=)?\s*\d+',$vCode;$c=$c -replace 'versionName\s*(=)?\s*[''\x22][^''\x22]+[''\x22]',$vName;[IO.File]::WriteAllText($f,$c);$mf='android\app\src\main\AndroidManifest.xml';if(Test-Path $mf){$m=Get-Content $mf -Raw;$m=$m -replace 'package\s*=\s*[''\x22][^''\x22]+[''\x22]','package='+$dq+$p+$dq;[IO.File]::WriteAllText($mf,$m)}"

echo Verificando cambios:
findstr /n /c:"applicationId" /c:"namespace" /c:"versionCode" /c:"versionName" "%GRADLE_FILE%"
if exist "android\app\src\main\AndroidManifest.xml" findstr /n /c:"package=" "android\app\src\main\AndroidManifest.xml"
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

set /p STORE_PWD="Contrasena keystore: "
set /p KEY_PWD="Contrasena key: "

call gradlew.bat clean :app:bundleRelease -Pandroid.injected.signing.store.file="!STORE_PATH!" -Pandroid.injected.signing.store.password="!STORE_PWD!" -Pandroid.injected.signing.key.alias="mystic-garden" -Pandroid.injected.signing.key.password="!KEY_PWD!"

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
