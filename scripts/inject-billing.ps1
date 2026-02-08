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
    # LINE-BY-LINE to avoid memory issues
    $manifestLines = Get-Content -LiteralPath $manifestPath
    $manifest = $manifestLines -join "`r`n"

    $billingPermission = 'com.android.vending.BILLING'
    $adIdPermission = 'com.google.android.gms.permission.AD_ID'

    if ($manifest -notmatch [regex]::Escape($billingPermission)) {
      Write-Host 'Inyectando permiso BILLING...'
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
  $billingDep = "implementation 'com.android.billingclient:billing:7.1.1'"
  $billingDepKts = 'implementation("com.android.billingclient:billing:7.1.1")'

  # Determine which file to use
  $useKts = Test-Path -LiteralPath $gradleKtsPath
  $activeGradlePath = if ($useKts) { $gradleKtsPath } else { $gradlePath }
  $activeDep = if ($useKts) { $billingDepKts } else { $billingDep }
  $label = if ($useKts) { 'build.gradle.kts' } else { 'build.gradle' }

  if (Test-Path -LiteralPath $activeGradlePath) {
    Write-Host ('Leyendo ' + $label + '...')
    # LINE-BY-LINE to avoid memory issues
    $gradleLines = Get-Content -LiteralPath $activeGradlePath
    $gradle = $gradleLines -join "`r`n"

    if ($gradle -notmatch 'com\.android\.billingclient') {
      Write-Host ('Inyectando billing library en ' + $label + '...')
      if ($gradle -match 'dependencies\s*\{') {
        $gradle = $gradle -replace '(dependencies\s*\{)', ('$1' + "`r`n    " + $activeDep)
        Write-Host 'OK: Billing library inyectada.'
      } else {
        Write-Host ('WARN: No encontre bloque dependencies en ' + $label)
      }
    } else {
      Write-Host ('OK: Billing library ya existe en ' + $label)
    }

    [System.IO.File]::WriteAllText($activeGradlePath, $gradle, (New-Object System.Text.UTF8Encoding($false)))
  } else {
    throw ('No encontre ' + $label)
  }

  # ============================================
  # STEP 3: Verification (re-read line-by-line)
  # ============================================
  Write-Host ''
  Write-Host '=== VERIFICACION BILLING ==='
  
  $manifestCheck = (Get-Content -LiteralPath $manifestPath) -join "`r`n"
  if ($manifestCheck -match [regex]::Escape($billingPermission)) {
    Write-Host 'PASS: AndroidManifest.xml contiene permiso BILLING'
  } else {
    Write-Host 'FAIL: AndroidManifest.xml NO contiene permiso BILLING'
    exit 1
  }

  # Re-read the SAME file we just wrote to (not the other one)
  $gradleCheck = (Get-Content -LiteralPath $activeGradlePath) -join "`r`n"
  if ($gradleCheck -match 'com\.android\.billingclient') {
    Write-Host ('PASS: ' + $label + ' contiene billing library')
  } else {
    Write-Host ('FAIL: ' + $label + ' NO contiene billing library')
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
