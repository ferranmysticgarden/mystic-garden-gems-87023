@echo off
setlocal

cd /d "%~dp0"

if not exist "build-android-aab.cmd" (
  echo ERROR: No existe build-android-aab.cmd en esta carpeta
  echo   %CD%
  pause
  exit /b 1
)

cmd /k call build-android-aab.cmd
