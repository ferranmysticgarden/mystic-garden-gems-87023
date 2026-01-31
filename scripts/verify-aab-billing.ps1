param(
  [Parameter(Mandatory = $true)] [string] $AabPath,
  [string] $Permission = 'com.android.vending.BILLING'
)

$ErrorActionPreference = 'Stop'

try {
  if (-not (Test-Path -LiteralPath $AabPath)) {
    Write-Host ('ERROR: No existe el AAB: ' + $AabPath)
    exit 1
  }

  # bundletool jar location (kept in repo folder to make builds deterministic)
  # IMPORTANT: Use PSScriptRoot so it works even if CMD did `pushd android`.
  $bundletoolJar = Join-Path -Path $PSScriptRoot -ChildPath 'bundletool.jar'
  if (-not (Test-Path -LiteralPath $bundletoolJar)) {
    Write-Host 'INFO: bundletool.jar no encontrado. Descargando...'
    $url = 'https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar'
    Invoke-WebRequest -Uri $url -OutFile $bundletoolJar
  }

  Write-Host ('Verificando permiso dentro del AAB: ' + $Permission)
  Write-Host ('AAB: ' + $AabPath)

  # Dump base module manifest. Capture output even if bundletool returns non-zero for any reason.
  $out = (& java -jar $bundletoolJar dump manifest --bundle=$AabPath --module=base 2>&1 | Out-String)

  if (($out -match '<manifest') -and ($out -match [regex]::Escape($Permission))) {
    Write-Host ('OK: El AAB contiene el permiso: ' + $Permission)
    exit 0
  }

  Write-Host 'ERROR: El AAB NO contiene el permiso requerido (o bundletool no pudo detectarlo).'
  Write-Host ('Permiso esperado: ' + $Permission)
  Write-Host '--- Salida (primeras lineas) ---'
  ($out -split "`r?`n" | Select-Object -First 60) | ForEach-Object { Write-Host $_ }
  Write-Host '--------------------------------'
  exit 1
}
catch {
  Write-Host ('ERROR: verify-aab-billing.ps1 fallo: ' + $_.Exception.Message)
  exit 1
}
