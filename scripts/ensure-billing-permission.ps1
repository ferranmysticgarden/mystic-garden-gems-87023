param(
  [Parameter(Mandatory = $true)] [string] $ManifestPath,
  [string] $Permission = 'com.android.vending.BILLING'
)

$ErrorActionPreference = 'Stop'

try {
  if (-not (Test-Path -LiteralPath $ManifestPath)) {
    Write-Host ('ERROR: No existe el AndroidManifest: ' + $ManifestPath)
    exit 1
  }

  $full = (Resolve-Path -LiteralPath $ManifestPath).Path
  $content = Get-Content -LiteralPath $full -Raw

  if ($content -match [regex]::Escape($Permission)) {
    Write-Host ('OK: Permiso ya presente: ' + $Permission)
    exit 0
  }

  if ($content -notmatch '<application') {
    Write-Host 'ERROR: No encontre <application> en AndroidManifest.xml (formato inesperado).'
    exit 1
  }

  # Inserta el uses-permission justo antes de <application>, preservando la indentación.
  $updated = [regex]::Replace(
    $content,
    '(?m)^(\s*)<application',
    {
      param($m)
      $indent = $m.Groups[1].Value
      return ($indent + '<uses-permission android:name="' + $Permission + '" />' + "`r`n" + $indent + '<application')
    },
    1
  )

  [System.IO.File]::WriteAllText($full, $updated, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host ('OK: Permiso inyectado: ' + $Permission)
  Write-Host ('Manifest: ' + $full)
  exit 0
}
catch {
  Write-Host ('ERROR: ensure-billing-permission.ps1 fallo: ' + $_.Exception.Message)
  exit 1
}
