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

    # ============================================
    # FIX: Force AndroidX versions compatible with AGP 8.2.1 / compileSdk 34
    # Capacitor v7 pulls newer AndroidX that requires compileSdk 36 + AGP 8.9.1
    # ============================================
    $forceBlock = @"

configurations.all {
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.core:core-ktx:1.13.1'
        force 'androidx.activity:activity:1.9.3'
        force 'androidx.activity:activity-ktx:1.9.3'
    }
}
"@
    if ($content -notmatch 'resolutionStrategy') {
      # Insert before the final "apply from: 'capacitor.build.gradle'" line
      if ($content -match "apply from:\s*['\`"]capacitor\.build\.gradle['\`"]") {
        $content = $content -replace "(apply from:\s*['\`"]capacitor\.build\.gradle['\`"])", ($forceBlock + "`r`n`r`n" + '$1')
        Write-Host 'OK: Bloque resolutionStrategy inyectado (fix AndroidX).'
      } else {
        # Fallback: append at end
        $content = $content + "`r`n" + $forceBlock
        Write-Host 'OK: Bloque resolutionStrategy añadido al final.'
      }
    } else {
      Write-Host 'OK: resolutionStrategy ya existe.'
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
