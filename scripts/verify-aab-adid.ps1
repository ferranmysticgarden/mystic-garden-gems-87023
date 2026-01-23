param(
  [Parameter(Mandatory = $true)] [string] $AabPath
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Msg) {
  Write-Host ('ERROR: ' + $Msg)
  exit 1
}

try {
  if (-not (Test-Path -LiteralPath $AabPath)) {
    Fail ('No existe el AAB: ' + $AabPath)
  }

  $jar = Join-Path $env:TEMP 'bundletool-all-1.16.0.jar'
  if (-not (Test-Path -LiteralPath $jar)) {
    Write-Host ('Descargando bundletool: ' + $jar)
    Invoke-WebRequest -Uri 'https://github.com/google/bundletool/releases/download/1.16.0/bundletool-all-1.16.0.jar' -OutFile $jar -UseBasicParsing
  }

  $perm = 'com.google.android.gms.permission.AD_ID'

  # Intento 1: manifest del módulo base (lo normal)
  $out1 = & java -jar $jar dump manifest --bundle="$AabPath" --module=base 2>&1
  $code1 = $LASTEXITCODE

  # Intento 2: dump sin módulo (fallback)
  $out2 = ''
  $code2 = 0
  if ($code1 -ne 0 -or ($out1 -notmatch '<manifest')) {
    $out2 = & java -jar $jar dump manifest --bundle="$AabPath" 2>&1
    $code2 = $LASTEXITCODE
  }

  # NOTA: bundletool a veces devuelve exit code != 0 aunque el stdout contenga el manifest.
  # Nos fiamos del contenido: si hay <manifest>, lo consideramos válido.
  $dump = $out1
  if ($dump -notmatch '<manifest') { $dump = $out2 }
  if ($dump -notmatch '<manifest') {
    Write-Host ($out1 + "`n" + $out2)
    Fail 'bundletool no pudo extraer el AndroidManifest.xml del AAB.'
  }

  if ($dump -match [regex]::Escape($perm)) {
    Write-Host 'OK: AD_ID esta dentro del AAB.'
    exit 0
  }

  # Si no lo encuentra, imprimimos un trozo del dump para diagnosticar
  Write-Host 'WARN: No he encontrado AD_ID en el manifest del AAB. Extracto:'
  ($dump -split "`n" | Select-Object -First 120) | ForEach-Object { Write-Host $_ }
  Fail 'FALTA_AD_ID_EN_AAB'
}
catch {
  Fail $_.Exception.Message
}
