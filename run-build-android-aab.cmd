@echo off
setlocal

REM Abre una ventana de CMD que NO se cierra al terminar.
cd /d "%~dp0"

if not exist "build-android-aab.cmd" (
  echo ERROR: No existe build-android-aab.cmd en esta carpeta:
  echo   %CD%
  echo.
  echo Crea/coloca build-android-aab.cmd en la raiz del proyecto.
  pause
  exit /b 1
)

cmd /k call build-android-aab.cmd
