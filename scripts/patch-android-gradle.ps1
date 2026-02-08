param(
  [Parameter(Mandatory = $true)] [string] $GradleFile,
  [Parameter(Mandatory = $true)] [ValidateSet('groovy','kts')] [string] $Kind,
  [Parameter(Mandatory = $true)] [string] $AppId,
  [Parameter(Mandatory = $true)] [int] $VersionCode,
  [Parameter(Mandatory = $true)] [string] $VersionName,
  [Parameter(Mandatory = $false)] [int] $MinSdk = 24,
  [Parameter(Mandatory = $false)] [int] $TargetSdk = 35
)

try {
  # LINE-BY-LINE reading to avoid out-of-memory on low-RAM PCs
  $lines = Get-Content -LiteralPath $GradleFile -ErrorAction Stop
  $content = $lines -join "`r`n"

  if ($Kind -eq 'kts') {
    $content = [regex]::Replace($content, 'namespace\s*=\s*"[^"]+"', ('namespace = "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'applicationId\s*=\s*"[^"]+"', ('applicationId = "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'versionCode\s*=\s*\d+', ('versionCode = ' + $VersionCode), 1)
    $content = [regex]::Replace($content, 'versionName\s*=\s*"[^"]+"', ('versionName = "' + $VersionName + '"'), 1)

    # targetSdk
    $before = $content
    $content = [regex]::Replace($content, 'targetSdk\s*=\s*\d+', ('targetSdk = ' + $TargetSdk), 1)
    if ($before -eq $content) {
      $content = [regex]::Replace($content, '(defaultConfig\s*\{)', ('$1' + "`r`n        targetSdk = " + $TargetSdk), 1)
    }

    # minSdk
    $before = $content
    $content = [regex]::Replace($content, 'minSdk\s*=\s*\d+', ('minSdk = ' + $MinSdk), 1)
    if ($before -eq $content) {
      $content = [regex]::Replace($content, '(defaultConfig\s*\{)', ('$1' + "`r`n        minSdk = " + $MinSdk), 1)
    }

    # Force AndroidX versions
    $forceBlock = @"

/* MG_FORCE_ANDROIDX_START */
configurations.all {
    resolutionStrategy {
        force("androidx.core:core:1.13.1")
        force("androidx.core:core-ktx:1.13.1")
        force("androidx.activity:activity:1.9.3")
        force("androidx.activity:activity-ktx:1.9.3")
    }
}
/* MG_FORCE_ANDROIDX_END */
"@

    # Remove old block if exists
    $content = [regex]::Replace($content, '(?s)/\* MG_FORCE_ANDROIDX_START \*/.*?/\* MG_FORCE_ANDROIDX_END \*/', '')

    # Append at end
    $content = $content.TrimEnd() + "`r`n" + $forceBlock + "`r`n"

  } else {
    # Groovy DSL
    $content = [regex]::Replace($content, 'namespace\s+"[^"]+"', ('namespace "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'applicationId\s+"[^"]+"', ('applicationId "' + $AppId + '"'), 1)
    $content = [regex]::Replace($content, 'versionCode\s+\d+', ('versionCode ' + $VersionCode), 1)
    $content = [regex]::Replace($content, 'versionName\s+"[^"]+"', ('versionName "' + $VersionName + '"'), 1)

    # targetSdk
    $before = $content
    $content = [regex]::Replace($content, 'targetSdk\s+\d+', ('targetSdk ' + $TargetSdk), 1)
    if ($before -eq $content) {
      $content = [regex]::Replace($content, 'targetSdkVersion\s+\d+', ('targetSdkVersion ' + $TargetSdk), 1)
    }
    if ($before -eq $content) {
      $content = [regex]::Replace($content, '(defaultConfig\s*\{)', ('$1' + "`r`n        targetSdk " + $TargetSdk), 1)
    }

    # minSdk
    $before = $content
    $content = [regex]::Replace($content, 'minSdk\s+\d+', ('minSdk ' + $MinSdk), 1)
    if ($before -eq $content) {
      $content = [regex]::Replace($content, 'minSdkVersion\s+\d+', ('minSdkVersion ' + $MinSdk), 1)
    }
    if ($before -eq $content) {
      $content = [regex]::Replace($content, '(defaultConfig\s*\{)', ('$1' + "`r`n        minSdk " + $MinSdk), 1)
    }

    # Force AndroidX versions
    $forceBlock = @"

/* MG_FORCE_ANDROIDX_START */
configurations.all {
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.core:core-ktx:1.13.1'
        force 'androidx.activity:activity:1.9.3'
        force 'androidx.activity:activity-ktx:1.9.3'
    }
}
/* MG_FORCE_ANDROIDX_END */
"@

    # Remove old block if exists
    $content = [regex]::Replace($content, '(?s)/\* MG_FORCE_ANDROIDX_START \*/.*?/\* MG_FORCE_ANDROIDX_END \*/', '')

    # Append at end
    $content = $content.TrimEnd() + "`r`n" + $forceBlock + "`r`n"
  }

  [System.IO.File]::WriteAllText($GradleFile, $content)
  Write-Host ('PARCHADO: ' + $GradleFile)
  exit 0
}
catch {
  Write-Host ('ERROR: No pude parchear el Gradle. ' + $_.Exception.Message)
  exit 1
}
