param(
  [Parameter(Mandatory = $true)] [string] $AabPath
)

$ErrorActionPreference = 'Stop'

Write-Host '=== VERIFICACION AAB: BILLING ==='
Write-Host ''

# Check if bundletool is available
$bundletool = $null
$bundletoolPaths = @(
  'bundletool.jar',
  'bundletool-all.jar',
  (Join-Path $env:USERPROFILE 'bundletool.jar'),
  (Join-Path $env:USERPROFILE 'Downloads\bundletool.jar'),
  'D:\tools\bundletool.jar'
)

foreach ($p in $bundletoolPaths) {
  if (Test-Path $p) {
    $bundletool = $p
    break
  }
}

if (-not $bundletool) {
  Write-Host 'WARN: bundletool.jar no encontrado. Descargalo de:'
  Write-Host '  https://github.com/google/bundletool/releases'
  Write-Host ''
  Write-Host 'Intentando verificacion alternativa con aapt2/zipinfo...'
  
  # Fallback: use PowerShell to inspect the AAB (it's a zip file)
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($AabPath)
  
  $manifestEntry = $zip.Entries | Where-Object { $_.FullName -like '*/AndroidManifest.xml' } | Select-Object -First 1
  
  if ($manifestEntry) {
    Write-Host 'Encontrado AndroidManifest.xml en AAB (binario, no se puede leer directamente)'
    Write-Host ''
    Write-Host 'Para verificacion completa, instala bundletool y ejecuta:'
    Write-Host ('  java -jar bundletool.jar dump manifest --bundle="' + $AabPath + '"')
  }
  
  $zip.Dispose()
  
  Write-Host ''
  Write-Host 'MANUAL: Verifica en Google Play Console si el permiso BILLING aparece.'
  exit 0
}

Write-Host ('Usando bundletool: ' + $bundletool)
Write-Host ''

# Dump manifest
Write-Host 'Extrayendo manifest del AAB...'
$manifestDump = & java -jar $bundletool dump manifest --bundle="$AabPath" 2>&1

if ($LASTEXITCODE -ne 0) {
  Write-Host 'ERROR: bundletool fallo al extraer manifest'
  Write-Host $manifestDump
  exit 1
}

# Check for BILLING permission
$billingPermission = 'com.android.vending.BILLING'
$adIdPermission = 'com.google.android.gms.permission.AD_ID'

Write-Host ''
Write-Host '=== PERMISOS EN AAB ==='

if ($manifestDump -match [regex]::Escape($billingPermission)) {
  Write-Host ('PASS: ' + $billingPermission)
} else {
  Write-Host ('FAIL: ' + $billingPermission + ' NO ENCONTRADO!')
  Write-Host ''
  Write-Host 'El AAB no contiene el permiso de billing.'
  Write-Host 'Google Play rechazara la app si usa billing sin este permiso.'
  exit 1
}

if ($manifestDump -match [regex]::Escape($adIdPermission)) {
  Write-Host ('PASS: ' + $adIdPermission)
} else {
  Write-Host ('WARN: ' + $adIdPermission + ' no encontrado (opcional para ads)')
}

# Additional checks
Write-Host ''
Write-Host '=== VERIFICACION ADICIONAL ==='

# Check package name
if ($manifestDump -match 'package="([^"]+)"') {
  Write-Host ('Package: ' + $Matches[1])
}

# Check version
if ($manifestDump -match 'android:versionCode="(\d+)"') {
  Write-Host ('VersionCode: ' + $Matches[1])
}

if ($manifestDump -match 'android:versionName="([^"]+)"') {
  Write-Host ('VersionName: ' + $Matches[1])
}

Write-Host ''
Write-Host 'OK: AAB verificado - contiene permiso BILLING'
Write-Host ''
exit 0
