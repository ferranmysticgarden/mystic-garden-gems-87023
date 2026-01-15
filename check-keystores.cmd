@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "TARGET_SHA1=37:62:75:43:D5:7F:0E:BE:AE:F1:78:D6:79:6C:D2:DF:52:36:C3:09"

REM --- Archivos a probar ---
set "K1=C:\Users\PC\OneDrive\Escritorio\mystic ZIP.CASI ACABAT\mystic-garden-gems-87023-main\android\app\mystic-garden-release-key.keystore"
set "K2=C:\Users\PC\OneDrive\Escritorio\keys\mystic-garden-release-key.keystore"
set "K3=C:\Users\PC\OneDrive\Escritorio\keys\mystic-garden-release2-key.keystore"
set "K4=C:\Users\PC\OneDrive\Escritorio\keys\mystic-garden.keystore"
set "K5=C:\Users\PC\OneDrive\Escritorio\keys\mi_clave_android.jks"
set "K6=D:\BACKUP_MYSTIC_GARDEN_20260114\android\app\mystic-garden-release-key.keystore"
set "K7=D:\mystic-garden-gems-87023\android_OLD\app\mystic-garden-release-key.keystore"
set "K8=D:\mystic-garden-gems-87023\android\app\mystic-garden-release-key.OLD.keystore"
set "K9=D:\mystic-garden-gems-87023\android\app\mystic-garden-release-key.BAD.20260115.keystore"
set "K10=D:\mystic-garden-gems-87023\android\app\mystic-garden-release-key.keystore"
set "K11=D:\mystic-garden-gems-87023\android\app\mysticgarden-release.jks"
set "K12=D:\keystore.jks"

REM --- Passwords a probar ---
set "P1=mystic123"
set "P2=mystic 123"
set "P3=evoluxe2025"
set "P4=android"
set "P5=123456"
set "P6=changeit"
set "P7=password"
set "P8=mystic2026"

for %%K in ("%K1%" "%K2%" "%K3%" "%K4%" "%K5%" "%K6%" "%K7%" "%K8%" "%K9%" "%K10%" "%K11%" "%K12%") do (
  call :TEST_ONE "%%~fK"
)

echo.
echo FIN. Si no salio "*** MATCH ***", el keystore correcto NO esta en estos archivos.
pause
exit /b 0

:TEST_ONE
set "FILE=%~1"
if not exist "%FILE%" (
  echo.
  echo [SKIP] No existe: %FILE%
  goto :eof
)

echo.
echo ==========================
echo Keystore: %FILE%

for %%T in (PKCS12 JKS) do (
  for %%I in (1 2 3 4 5 6 7 8) do (
    set "PASS=!P%%I!"
    call :TRY "%FILE%" "%%T" "!PASS!"
  )
)
goto :eof

:TRY
set "FILE=%~1"
set "TYPE=%~2"
set "PASS=%~3"

set "TMP=%TEMP%\kt_out.txt"
keytool -list -v -keystore "%FILE%" -storetype %TYPE% -storepass "%PASS%" > "%TMP%" 2>&1
if errorlevel 1 goto :eof

echo OK OPEN: type=%TYPE% pass=%PASS%

for /f "usebackq delims=" %%L in (`findstr /i /c:"Alias name:" /c:"Nombre de alias:" "%TMP%"`) do echo %%L
for /f "usebackq delims=" %%L in (`findstr /i /c:"SHA1:" "%TMP%"`) do echo %%L

findstr /c:"%TARGET_SHA1%" "%TMP%" >nul
if not errorlevel 1 (
  echo.
  echo *** MATCH ***
  echo FILE=%FILE%
  echo TYPE=%TYPE%
  echo PASS=%PASS%
  echo.
  exit /b 0
)
goto :eof
