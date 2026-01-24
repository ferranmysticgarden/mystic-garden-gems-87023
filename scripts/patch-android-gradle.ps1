param(
  [Parameter(Mandatory = $true)] [string] $GradleFile,
  [Parameter(Mandatory = $true)] [ValidateSet('groovy','kts')] [string] $Kind,
  [Parameter(Mandatory = $true)] [string] $AppId,
  [Parameter(Mandatory = $true)] [int] $VersionCode,
  [Parameter(Mandatory = $true)] [string] $VersionName
)

try {
  $original = Get-Content -LiteralPath $GradleFile -Raw -ErrorAction Stop
  $content = $original

  if ($Kind -eq 'kts') {
    $content = [regex]::Replace($content, 'namespace\s*=\s*"[^"]+"', ('namespace = "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'applicationId\s*=\s*"[^"]+"', ('applicationId = "' + $AppId + '"'), 1)

    # Accept both numeric and non-numeric existing values; force the requested one.
    $content = [regex]::Replace($content, 'versionCode\s*=\s*[^\r\n]+', ('versionCode = ' + $VersionCode), 1)
    $content = [regex]::Replace($content, 'versionName\s*=\s*[^\r\n]+', ('versionName = "' + $VersionName + '"'), 1)
  } else {
    $content = [regex]::Replace($content, 'namespace\s+"[^"]+"', ('namespace "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'applicationId\s+"[^"]+"', ('applicationId "' + $AppId + '"'), 1)

    # Support both "versionCode 123" and "versionCode = 123" (and even non-numeric tokens)
    $content = [regex]::Replace($content, 'versionCode\s*(?:=\s*)?[^\r\n]+', ('versionCode ' + $VersionCode), 1)
    $content = [regex]::Replace($content, 'versionName\s*(?:=\s*)?[^\r\n]+', ('versionName "' + $VersionName + '"'), 1)
  }

  # Fail fast if we didn't actually patch what we need.
  $ok = $true
  if ($content -eq $original) {
    Write-Host 'ERROR: El archivo Gradle no cambio tras aplicar los parches (patrones no encontrados).'
    $ok = $false
  }
  if ($Kind -eq 'kts') {
    if ($content -notmatch ('versionCode\s*=\s*' + [regex]::Escape([string]$VersionCode))) { Write-Host 'ERROR: No pude fijar versionCode en el Gradle (.kts).'; $ok = $false }
    if ($content -notmatch ('versionName\s*=\s*"' + [regex]::Escape([string]$VersionName) + '"')) { Write-Host 'ERROR: No pude fijar versionName en el Gradle (.kts).'; $ok = $false }
  } else {
    if ($content -notmatch ('versionCode\s+' + [regex]::Escape([string]$VersionCode))) { Write-Host 'ERROR: No pude fijar versionCode en el Gradle (groovy).'; $ok = $false }
    if ($content -notmatch ('versionName\s+"' + [regex]::Escape([string]$VersionName) + '"')) { Write-Host 'ERROR: No pude fijar versionName en el Gradle (groovy).'; $ok = $false }
  }
  if (-not $ok) {
    exit 1
  }

  [System.IO.File]::WriteAllText($GradleFile, $content)
  Write-Host ('PARCHADO: ' + $GradleFile)
  exit 0
}
catch {
  Write-Host ('ERROR: No pude parchear el Gradle. ' + $_.Exception.Message)
  exit 1
}
