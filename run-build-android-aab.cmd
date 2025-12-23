@echo off
setlocal

REM Abre una ventana de CMD que NO se cierra al terminar.
cd /d "%~dp0"

if not exist "build-android-aab.cmd" (
  echo ERROR: No existe build-android-aab.cmd en esta carpeta:
  echo   %CD%
  echo.
  echo TIP: Puede que se haya guardado como build-android-aab.cmd.txt por error.
  echo Ejecuta:
  echo   dir /b build-android-aab*
  echo Si ves build-android-aab.cmd.txt, renombralo asi:
  echo   ren build-android-aab.cmd.txt build-android-aab.cmd
  echo.
  pause
  exit /b 1
)

cmd /k call build-android-aab.cmd
