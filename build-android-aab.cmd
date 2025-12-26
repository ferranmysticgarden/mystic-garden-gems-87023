@echo off
setlocal

cd /d "%~dp0"

echo ==== Mystic Garden: Android AAB build ====

call npm install
call npm run build
call npx cap sync android

echo.
echo =====================================================
echo   ABRE android\app\build.gradle Y CAMBIA:
echo   versionCode 2  a  versionCode 3
echo   versionName "1.0.1"  a  versionName "1.0.2"
echo =====================================================
echo.
pause

cd android

echo Generando AAB...
call gradlew.bat clean :app:bundleRelease

echo.
echo ==== AAB generado ====
dir /s /b app\build\outputs\bundle\release\*.aab

start "" "app\build\outputs\bundle\release"

cd ..
pause
