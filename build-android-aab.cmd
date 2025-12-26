@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Always run from the project root (where this .cmd is located)
cd /d "%~dp0"

echo ==== Mystic Garden: Android AAB build (Release) ====

if not exist "package.json" (
  echo ERROR: No estoy en la carpeta del proyecto - no veo package.json
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

echo [3.5/4] Actualizar versionCode y versionName en build.gradle
echo.
echo =====================================================
echo   CAMBIA ESTOS VALORES EN EL ARCHIVO QUE SE ABRE:
echo   versionCode 2  -^>  versionCode 3
echo   versionName "1.0.1"  -^>  versionName "1.0.2"
echo =====================================================
echo.
echo Guarda el archivo y cierra Notepad para continuar...
echo.
start /wait notepad android\app\build.gradle
echo Continuando con el build...

pushd android

if not exist "gradlew.bat" (
  echo ERROR: No existe android\gradlew.bat
  echo Si acabas de exportar el proyecto, ejecuta primero: npx cap add android
  popd
  pause
  exit /b 1
)

REM Read signing data from key.properties
set "STORE_FILE="
set "KEY_ALIAS="
for /f "usebackq tokens=1,* delims==" %%A in ("key.properties") do (
  set "LINE=%%A"
  if defined LINE (
    if not "!LINE:~0,1!"=="#" (
      if /I "%%A"=="storeFile" set "STORE_FILE=%%B"
      if /I "%%A"=="keyAlias" set "KEY_ALIAS=%%B"
    )
  )
)

if not defined STORE_FILE (
  echo ERROR: key.properties no contiene storeFile
  popd
  pause
  exit /b 1
)
if not defined KEY_ALIAS (
  echo ERROR: key.properties no contiene keyAlias
  popd
  pause
  exit /b 1
)

set "STORE_FILE=!STORE_FILE:/=\!"

REM Resolve storeFile to ABSOLUTE path (fixes Gradle double-path bug)
set "STORE_PATH=%CD%\app\!STORE_FILE!"
if not exist "!STORE_PATH!" (
  set "STORE_PATH=%CD%\!STORE_FILE!"
)
if not exist "!STORE_PATH!" (
  echo ERROR: No encuentro el keystore: !STORE_FILE!
  echo Buscado en:
  echo   %CD%\app\!STORE_FILE!
  echo   %CD%\!STORE_FILE!
  echo.
  echo Archivos .keystore en android\app:
  dir /b app\*.jks app\*.keystore 2>nul
  popd
  pause
  exit /b 1
)
echo Keystore encontrado: !STORE_PATH!

echo [4/4] Gradle: bundleRelease - signed
echo.
echo Se pediran contrasenas ahora - no se guardan en archivos

REM Read from CON to avoid empty input when stdin is redirected
set /p STORE_PWD=Contrasena del keystore (storePassword): <con
if "!STORE_PWD!"=="" (
  echo ERROR: storePassword vacio.
  popd
  pause
  exit /b 1
)

set /p KEY_PWD=Contrasena de la key (keyPassword): <con
if "!KEY_PWD!"=="" (
  echo ERROR: keyPassword vacio.
  popd
  pause
  exit /b 1
)

REM --- Pre-check: verify keystore password + alias BEFORE Gradle (avoids guessing) ---
set "KEYTOOL_EXE="
if exist "%PROGRAMFILES%\Android\Android Studio\jbr\bin\keytool.exe" set "KEYTOOL_EXE=%PROGRAMFILES%\Android\Android Studio\jbr\bin\keytool.exe"
if not defined KEYTOOL_EXE (
  for /f "delims=" %%K in ('where keytool 2^>nul') do (
    if not defined KEYTOOL_EXE set "KEYTOOL_EXE=%%K"
  )
)

if defined KEYTOOL_EXE (
  echo.
  echo Verificando keystore (contrasena + alias) antes de Gradle...
  "%KEYTOOL_EXE%" -list -keystore "!STORE_PATH!" -storepass "!STORE_PWD!" > "%TEMP%\mg_keystore_list.txt" 2>nul
  if errorlevel 1 (
    echo ERROR: La contrasena del keystore NO coincide con el archivo:
    echo   !STORE_PATH!
    echo Nota: revisa teclado/Mayusculas y si era "mystic123" vs "mistico123" (con o sin acento).
    del "%TEMP%\mg_keystore_list.txt" 2>nul
    popd
    pause
    exit /b 1
  )

  REM Check if key alias exists; if not, show aliases and ask user
  findstr /i /c:"Alias name: !KEY_ALIAS!" "%TEMP%\mg_keystore_list.txt" >nul
  if errorlevel 1 findstr /i /c:"Nombre de alias: !KEY_ALIAS!" "%TEMP%\mg_keystore_list.txt" >nul

  if errorlevel 1 (
    echo.
    echo ERROR: El alias configurado en key.properties no existe: "!KEY_ALIAS!"
    echo Alias disponibles en el keystore:
    findstr /i /c:"Alias name:" /c:"Nombre de alias:" "%TEMP%\mg_keystore_list.txt"
    echo.
    set /p KEY_ALIAS=Escribe el alias correcto EXACTO (tal cual aparece arriba): <con
    if "!KEY_ALIAS!"=="" (
      echo ERROR: alias vacio.
      del "%TEMP%\mg_keystore_list.txt" 2>nul
      popd
      pause
      exit /b 1
    )
  )

  del "%TEMP%\mg_keystore_list.txt" 2>nul
) else (
  echo [AVISO] No encuentro keytool para verificar el keystore; sigo con Gradle.
)

call gradlew.bat clean :app:bundleRelease --stacktrace -Pandroid.injected.signing.store.file="!STORE_PATH!" -Pandroid.injected.signing.store.password="!STORE_PWD!" -Pandroid.injected.signing.key.alias="!KEY_ALIAS!" -Pandroid.injected.signing.key.password="!KEY_PWD!"
set "GRADLE_ERR=!ERRORLEVEL!"

if not "!GRADLE_ERR!"=="0" (
  echo ERROR: Gradle fallo generando el AAB.
  popd
  pause
  exit /b 1
)

echo ==== AAB generado ====
dir /s /b app\build\outputs\bundle\release\*.aab

if exist "app\build\outputs\bundle\release" (
  start "" "app\build\outputs\bundle\release"
) else (
  echo ERROR: No se creo la carpeta de salida
)

popd

echo ==== FIN ====
pause
