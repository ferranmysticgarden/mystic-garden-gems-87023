param(
  [Parameter(Mandatory = $true)] [string] $GradleFile
)

$ErrorActionPreference = 'Stop'

try {
  if (-not (Test-Path -LiteralPath $GradleFile)) {
    Write-Host ('ERROR: No existe el archivo: ' + $GradleFile)
    exit 1
  }

  $content = Get-Content -LiteralPath $GradleFile -Raw

  # Check if billing dependency already exists
  if ($content -match 'com\.android\.billingclient') {
    Write-Host 'OK: Billing dependency ya existe en el archivo.'
    exit 0
  }

  # Determine if it's Kotlin DSL (.kts) or Groovy (.gradle)
  $isKts = $GradleFile -match '\.kts$'

  if ($isKts) {
    # Kotlin DSL format
    $billingLine = '    implementation("com.android.billingclient:billing:6.1.0")'
  } else {
    # Groovy format
    $billingLine = "    implementation 'com.android.billingclient:billing:6.1.0'"
  }

  # Find the dependencies block and inject billing library
  # Pattern: find "dependencies {" and inject after the first line inside it
  $pattern = '(dependencies\s*\{[^\}]*?)(implementation)'
  
  if ($content -match $pattern) {
    # Insert billing before the first implementation line
    $content = [regex]::Replace($content, $pattern, ('$1' + $billingLine + "`r`n    " + '$2'), 1)
  } else {
    # Fallback: just append before the last closing brace of dependencies
    $depPattern = '(dependencies\s*\{)'
    if ($content -match $depPattern) {
      $content = [regex]::Replace($content, $depPattern, ('$1' + "`r`n" + $billingLine), 1)
    } else {
      Write-Host 'ERROR: No encontre bloque dependencies en el archivo.'
      exit 1
    }
  }

  [System.IO.File]::WriteAllText($GradleFile, $content, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host ('OK: Billing dependency inyectada en ' + $GradleFile)
  exit 0
}
catch {
  Write-Host ('ERROR: ' + $_.Exception.Message)
  exit 1
}
