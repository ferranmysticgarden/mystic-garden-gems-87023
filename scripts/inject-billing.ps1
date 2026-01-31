param(
  [Parameter(Mandatory = $false)] [string] $AppId = 'com.mysticgarden.game'
)

$ErrorActionPreference = 'Stop'

try {
  $androidRoot = Join-Path -Path (Get-Location) -ChildPath 'android'
  $manifestPath = Join-Path -Path $androidRoot -ChildPath 'app\src\main\AndroidManifest.xml'
  $gradlePath = Join-Path -Path $androidRoot -ChildPath 'app\build.gradle'
  $gradleKtsPath = Join-Path -Path $androidRoot -ChildPath 'app\build.gradle.kts'

  # ============================================
  # STEP 1: Inject BILLING permission into AndroidManifest.xml
  # ============================================
  if (Test-Path -LiteralPath $manifestPath) {
    Write-Host 'Leyendo AndroidManifest.xml...'
    $manifest = Get-Content -LiteralPath $manifestPath -Raw

    $billingPermission = 'com.android.vending.BILLING'
    $adIdPermission = 'com.google.android.gms.permission.AD_ID'

    # Check and inject BILLING permission
    if ($manifest -notmatch [regex]::Escape($billingPermission)) {
      Write-Host 'Inyectando permiso BILLING...'
      # Insert after INTERNET permission or after opening manifest tag
      if ($manifest -match '<uses-permission android:name="android.permission.INTERNET"') {
        $manifest = $manifest -replace `
          '(<uses-permission android:name="android.permission.INTERNET"\s*/?>)', `
          ('$1' + "`r`n" + '  <uses-permission android:name="' + $billingPermission + '" />')
      } else {
        $manifest = $manifest -replace `
          '(<manifest[^>]*>)', `
          ('$1' + "`r`n`r`n" + '  <uses-permission android:name="' + $billingPermission + '" />')
      }
      Write-Host 'OK: Permiso BILLING inyectado.'
    } else {
      Write-Host 'OK: Permiso BILLING ya existe.'
    }

    # Check and inject AD_ID permission
    if ($manifest -notmatch [regex]::Escape($adIdPermission)) {
      Write-Host 'Inyectando permiso AD_ID...'
      if ($manifest -match [regex]::Escape($billingPermission)) {
        $manifest = $manifest -replace `
          ('(<uses-permission android:name="' + [regex]::Escape($billingPermission) + '"\s*/?>)'), `
          ('$1' + "`r`n" + '  <uses-permission android:name="' + $adIdPermission + '" />')
      }
      Write-Host 'OK: Permiso AD_ID inyectado.'
    } else {
      Write-Host 'OK: Permiso AD_ID ya existe.'
    }

    [System.IO.File]::WriteAllText($manifestPath, $manifest, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host 'AndroidManifest.xml actualizado.'
  } else {
    throw ('No existe AndroidManifest.xml en: ' + $manifestPath)
  }

  # ============================================
  # STEP 2: Inject billing library into build.gradle
  # ============================================
  $billingDep = "implementation 'com.android.billingclient:billing:6.1.0'"
  $billingDepKts = 'implementation("com.android.billingclient:billing:6.1.0")'

  # Check for Kotlin DSL first
  if (Test-Path -LiteralPath $gradleKtsPath) {
    Write-Host 'Leyendo build.gradle.kts...'
    $gradle = Get-Content -LiteralPath $gradleKtsPath -Raw

    if ($gradle -notmatch 'com\.android\.billingclient') {
      Write-Host 'Inyectando billing library en build.gradle.kts...'
      # Find dependencies block and add billing
      if ($gradle -match 'dependencies\s*\{') {
        $gradle = $gradle -replace '(dependencies\s*\{)', ('$1' + "`r`n    " + $billingDepKts)
        Write-Host 'OK: Billing library inyectada.'
      } else {
        Write-Host 'WARN: No encontre bloque dependencies en build.gradle.kts'
      }
    } else {
      Write-Host 'OK: Billing library ya existe en build.gradle.kts'
    }

    [System.IO.File]::WriteAllText($gradleKtsPath, $gradle, (New-Object System.Text.UTF8Encoding($false)))
  }
  # Check for Groovy DSL
  elseif (Test-Path -LiteralPath $gradlePath) {
    Write-Host 'Leyendo build.gradle...'
    $gradle = Get-Content -LiteralPath $gradlePath -Raw

    if ($gradle -notmatch 'com\.android\.billingclient') {
      Write-Host 'Inyectando billing library en build.gradle...'
      # Find dependencies block and add billing
      if ($gradle -match 'dependencies\s*\{') {
        $gradle = $gradle -replace '(dependencies\s*\{)', ('$1' + "`r`n    " + $billingDep)
        Write-Host 'OK: Billing library inyectada.'
      } else {
        Write-Host 'WARN: No encontre bloque dependencies en build.gradle'
      }
    } else {
      Write-Host 'OK: Billing library ya existe en build.gradle'
    }

    [System.IO.File]::WriteAllText($gradlePath, $gradle, (New-Object System.Text.UTF8Encoding($false)))
  }
  else {
    throw 'No encontre build.gradle ni build.gradle.kts'
  }

  # ============================================
  # STEP 3: Verification
  # ============================================
  Write-Host ''
  Write-Host '=== VERIFICACION BILLING ==='
  
  $manifestCheck = Get-Content -LiteralPath $manifestPath -Raw
  if ($manifestCheck -match [regex]::Escape($billingPermission)) {
    Write-Host 'PASS: AndroidManifest.xml contiene permiso BILLING'
  } else {
    Write-Host 'FAIL: AndroidManifest.xml NO contiene permiso BILLING'
    exit 1
  }

  $gradleCheckPath = if (Test-Path $gradleKtsPath) { $gradleKtsPath } else { $gradlePath }
  $gradleCheck = Get-Content -LiteralPath $gradleCheckPath -Raw
  if ($gradleCheck -match 'com\.android\.billingclient') {
    Write-Host 'PASS: build.gradle contiene billing library'
  } else {
    Write-Host 'FAIL: build.gradle NO contiene billing library'
    exit 1
  }

  Write-Host ''
  Write-Host 'OK: Billing configurado correctamente!'
  exit 0
}
catch {
  Write-Host ('ERROR: inject-billing.ps1 fallo: ' + $_.Exception.Message)
  exit 1
}
