@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Always run from the project root (where this .cmd is located)
cd /d "%~dp0"

echo ==== Mystic Garden: Android AAB build (Release) ====

if not exist "package.json" (
  echo ERROR: No estoy en la carpeta del proyecto (no veo package.json).
  echo Ruta actual: %CD%
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

pushd android

if not exist "gradlew.bat" (
  echo ERROR: No existe android\gradlew.bat. (Te falta la carpeta Android nativa completa.)
  echo Si acabas de exportar el proyecto, ejecuta primero: npx cap add android
  popd
  pause
  exit /b 1
)

REM Read signing data from key.properties (NO passwords here)
set "STORE_FILE="
set "KEY_ALIAS="
for /f "usebackq tokens=1,* delims==" %%A in ("key.properties") do (
  if /I "%%A"=="storeFile" set "STORE_FILE=%%B"
  if /I "%%A"=="keyAlias" set "KEY_ALIAS=%%B"
)

if not defined STORE_FILE (
  echo ERROR: key.properties no contiene storeFile=...
  popd
  pause
  exit /b 1
)
if not defined KEY_ALIAS (
  echo ERROR: key.properties no contiene keyAlias=...
  popd
  pause
  exit /b 1
)


set "STORE_FILE=!STORE_FILE:/=\!"

REM Resolve storeFile path (some templates expect it in android/app)
set "STORE_PATH=!STORE_FILE!"
if not exist "!STORE_PATH!" (
  if exist "app\!STORE_FILE!" set "STORE_PATH=app\!STORE_FILE!"
)

if not exist "!STORE_PATH!" (
  echo ERROR: No encuentro el keystore indicado en key.properties.
  echo   storeFile=!STORE_FILE!
  echo Probado:
  echo   !STORE_FILE!
  echo   app\!STORE_FILE!
  echo Archivos encontrados en android\app:
  dir /b app\*.jks app\*.keystore 2>nul
  popd
  pause
  exit /b 1
)

echo [4/4] Gradle: bundleRelease (signed)

echo.
echo (Se pediran contrasenas ahora; no se guardan en key.properties)
setlocal DisableDelayedExpansion
set /p STORE_PWD=Introduce la contraseña del keystore (storePassword): 
if "%STORE_PWD%"=="" (
  echo ERROR: storePassword vacio.
  endlocal
  popd
  pause
  exit /b 1
)
set /p KEY_PWD=Introduce la contraseña de la key (keyPassword): 
if "%KEY_PWD%"=="" (
  echo ERROR: keyPassword vacio.
  endlocal
  popd
  pause
  exit /b 1
)

call gradlew.bat clean :app:bundleRelease --stacktrace -Pandroid.injected.signing.store.file="%STORE_PATH%" -Pandroid.injected.signing.store.password="%STORE_PWD%" -Pandroid.injected.signing.key.alias="%KEY_ALIAS%" -Pandroid.injected.signing.key.password="%KEY_PWD%"
set "GRADLE_ERR=%ERRORLEVEL%"
endlocal

if not "%GRADLE_ERR%"=="0" (
  echo ERROR: Gradle fallo generando el AAB.
  popd
  pause
  exit /b 1
)


echo ==== AAB generado(s) ====
dir /s /b app\build\outputs\bundle\release\*.aab

if exist "app\build\outputs\bundle\release" (
  start "" "app\build\outputs\bundle\release"
) else (
  echo ERROR: No se creo la carpeta app\build\outputs\bundle\release
)

popd

echo ==== FIN ====
pause
