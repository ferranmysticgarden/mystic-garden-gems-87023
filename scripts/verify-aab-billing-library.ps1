param(
  [Parameter(Mandatory = $true)] [string] $AabPath
)

$ErrorActionPreference = 'Stop'

Write-Host '=== VERIFICACION AAB: BILLING LIBRARY (CLASES EN DEX) ==='
Write-Host ''

if (-not (Test-Path -LiteralPath $AabPath)) {
  Write-Host ('ERROR: No existe el AAB: ' + $AabPath)
  exit 1
}

function Test-BytesContains {
  param(
    [Parameter(Mandatory = $true)] [byte[]] $Haystack,
    [Parameter(Mandatory = $true)] [byte[]] $Needle
  )

  if ($Needle.Length -eq 0) { return $true }
  if ($Haystack.Length -lt $Needle.Length) { return $false }

  for ($i = 0; $i -le ($Haystack.Length - $Needle.Length); $i++) {
    $match = $true
    for ($j = 0; $j -lt $Needle.Length; $j++) {
      if ($Haystack[$i + $j] -ne $Needle[$j]) {
        $match = $false
        break
      }
    }
    if ($match) { return $true }
  }
  return $false
}

try {
  Add-Type -AssemblyName System.IO.Compression.FileSystem

  $zip = [System.IO.Compression.ZipFile]::OpenRead($AabPath)
  try {
    # Dentro de un .aab (zip), el módulo base suele tener base/dex/classes*.dex
    $dexEntries = $zip.Entries | Where-Object {
      $_.FullName -match '^base/dex/classes(\d*)?\.dex$'
    }

    if (-not $dexEntries -or $dexEntries.Count -eq 0) {
      Write-Host 'FAIL: No encontre clases DEX en el modulo base (base/dex/classes*.dex).'
      Write-Host 'Esto normalmente indica que el AAB no es valido o no es una app Android compilada.'
      exit 1
    }

    $needle1 = [System.Text.Encoding]::ASCII.GetBytes('com/android/billingclient/api/BillingClient')
    $needle2 = [System.Text.Encoding]::ASCII.GetBytes('Lcom/android/billingclient/api/BillingClient;')

    $found = $false
    foreach ($entry in $dexEntries) {
      Write-Host ('Analizando: ' + $entry.FullName)
      $stream = $entry.Open()
      try {
        $ms = New-Object System.IO.MemoryStream
        $stream.CopyTo($ms)
        $bytes = $ms.ToArray()

        if (Test-BytesContains -Haystack $bytes -Needle $needle1) { $found = $true; break }
        if (Test-BytesContains -Haystack $bytes -Needle $needle2) { $found = $true; break }
      } finally {
        $stream.Dispose()
      }
    }

    if ($found) {
      Write-Host ''
      Write-Host 'PASS: Billing Library detectada en el DEX (BillingClient presente)'
      exit 0
    }

    Write-Host ''
    Write-Host 'FAIL: NO detecte BillingClient dentro de las clases DEX.'
    Write-Host 'Si Google Play dice "no detecta billing", este AAB probablemente NO incluye la Billing Library.'
    exit 1
  }
  finally {
    $zip.Dispose()
  }
}
catch {
  Write-Host ('ERROR: verify-aab-billing-library.ps1 fallo: ' + $_.Exception.Message)
  exit 1
}
