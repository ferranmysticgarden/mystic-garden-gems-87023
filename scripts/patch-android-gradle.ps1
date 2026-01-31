param(
  [Parameter(Mandatory = $true)] [string] $GradleFile,
  [Parameter(Mandatory = $true)] [ValidateSet('groovy','kts')] [string] $Kind,
  [Parameter(Mandatory = $true)] [string] $AppId,
  [Parameter(Mandatory = $true)] [int] $VersionCode,
  [Parameter(Mandatory = $true)] [string] $VersionName,
  # Capacitor v7 plugins (e.g. @capacitor/app) require minSdk >= 24.
  # Keep this default so build-android-aab.cmd doesn't need changes.
  [Parameter(Mandatory = $false)] [int] $MinSdk = 24
)

try {
  $content = Get-Content -LiteralPath $GradleFile -Raw -ErrorAction Stop

  if ($Kind -eq 'kts') {
    $content = [regex]::Replace($content, 'namespace\s*=\s*"[^"]+"', ('namespace = "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'applicationId\s*=\s*"[^"]+"', ('applicationId = "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'versionCode\s*=\s*\d+', ('versionCode = ' + $VersionCode), 1)
    $content = [regex]::Replace($content, 'versionName\s*=\s*"[^"]+"', ('versionName = "' + $VersionName + '"'), 1)

    # minSdk
    $before = $content
    $content = [regex]::Replace($content, 'minSdk\s*=\s*\d+', ('minSdk = ' + $MinSdk), 1)
    if ($before -eq $content) {
      # Fallback: inject into defaultConfig block if not present
      $content = [regex]::Replace(
        $content,
        '(defaultConfig\s*\{)',
        ('$1' + "`r`n        minSdk = " + $MinSdk),
        1
      )
    }
  } else {
    $content = [regex]::Replace($content, 'namespace\s+"[^"]+"', ('namespace "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'applicationId\s+"[^"]+"', ('applicationId "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'versionCode\s+\d+', ('versionCode ' + $VersionCode), 1)
    $content = [regex]::Replace($content, 'versionName\s+"[^"]+"', ('versionName "' + $VersionName + '"'), 1)

    # minSdk (support both modern `minSdk 23` and legacy `minSdkVersion 23`)
    $before = $content
    $content = [regex]::Replace($content, 'minSdk\s+\d+', ('minSdk ' + $MinSdk), 1)
    if ($before -eq $content) {
      $content = [regex]::Replace($content, 'minSdkVersion\s+\d+', ('minSdkVersion ' + $MinSdk), 1)
    }
    if ($before -eq $content) {
      # Fallback: inject into defaultConfig block if not present
      $content = [regex]::Replace(
        $content,
        '(defaultConfig\s*\{)',
        ('$1' + "`r`n        minSdk " + $MinSdk),
        1
      )
    }
  }

  [System.IO.File]::WriteAllText($GradleFile, $content)
  Write-Host ('PARCHADO: ' + $GradleFile)
  exit 0
}
catch {
  Write-Host ('ERROR: No pude parchear el Gradle. ' + $_.Exception.Message)
  exit 1
}
