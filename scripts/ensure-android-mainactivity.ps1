param(
  [Parameter(Mandatory = $true)] [string] $AppId
)

$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

try {
  $androidRoot = Join-Path -Path (Get-Location) -ChildPath 'android'
  $manifestPath = Join-Path -Path $androidRoot -ChildPath 'app\src\main\AndroidManifest.xml'
  $javaRoot = Join-Path -Path $androidRoot -ChildPath 'app\src\main\java'

  # Build path for the target package
  $pkgPath = ($AppId -split '\.') -join '\'
  $targetDir = Join-Path -Path $javaRoot -ChildPath $pkgPath
  Ensure-Dir $targetDir

  $mainActivityJava = Join-Path -Path $targetDir -ChildPath 'MainActivity.java'
  $mainActivityKt = Join-Path -Path $targetDir -ChildPath 'MainActivity.kt'

  $javaContent = @"
package $AppId;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
"@

  $kotlinContent = @"
package $AppId

import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity()
"@

  # --- STEP 1: Delete ALL existing MainActivity files from any package ---
  Write-Host 'Buscando y eliminando MainActivity existentes...'
  $existingMainActivities = Get-ChildItem -Path $javaRoot -Recurse -Include 'MainActivity.java','MainActivity.kt' -ErrorAction SilentlyContinue
  foreach ($f in $existingMainActivities) {
    Write-Host ('  Eliminando: ' + $f.FullName)
    Remove-Item -LiteralPath $f.FullName -Force
  }

  # --- STEP 2: Create MainActivity in correct package ---
  Write-Host ('Creando MainActivity en: ' + $targetDir)
  [System.IO.File]::WriteAllText($mainActivityJava, $javaContent)
  Write-Host ('OK: MainActivity.java creado en ' + $mainActivityJava)

  # --- STEP 3: Update AndroidManifest.xml ---
  if (Test-Path -LiteralPath $manifestPath) {
    $m = Get-Content -LiteralPath $manifestPath -Raw

    # Replace package attribute in manifest tag
    $m = [regex]::Replace($m, 'package="[^"]+"', ('package="' + $AppId + '"'))

    # Normalize launcher activity name to use FQCN (fully qualified class name)
    $fqcn = $AppId + '.MainActivity'
    $m = [regex]::Replace($m, 'android:name="[^"]*MainActivity"', ('android:name="' + $fqcn + '"'))

    # Ensure android:exported="true" (Android 12+) and launchMode="singleTask" (deep links) on MainActivity
    $pattern = '(<activity\b(?:(?!>).)*android:name="[^"]*MainActivity"(?:(?!>).)*)>'
    $re = New-Object System.Text.RegularExpressions.Regex($pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $evaluator = [System.Text.RegularExpressions.MatchEvaluator]{
      param($match)
      $tag = $match.Value

      if ($tag -notmatch 'android:exported\s*=') {
        $tag = ($tag -replace '>$', ' android:exported="true">')
      }

      if ($tag -notmatch 'android:launchMode\s*=') {
        $tag = ($tag -replace '>$', ' android:launchMode="singleTask">')
      }

      return $tag
    }
    $m = $re.Replace($m, $evaluator, 1)

    # Ensure deep link intent-filter for OAuth callback (so the browser returns to the app)
    $scheme = $AppId
    $schemePattern = 'android:scheme\s*=\s*"' + [regex]::Escape($scheme) + '"'
    if ($m -notmatch $schemePattern) {
      $intent = @"
        <intent-filter>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="$scheme" android:host="callback" />
        </intent-filter>
"@

      $actPattern = '(<activity\b(?:(?!</activity>).)*android:name="[^"]*MainActivity"(?:(?!</activity>).)*?)(</activity>)'
      $actRe = New-Object System.Text.RegularExpressions.Regex($actPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
      $actEval = [System.Text.RegularExpressions.MatchEvaluator]{
        param($match)
        $before = $match.Groups[1].Value
        $after = $match.Groups[2].Value
        if ($before -match $schemePattern) { return $match.Value }
        return ($before + "`r`n" + $intent + "`r`n" + $after)
      }
      $m = $actRe.Replace($m, $actEval, 1)
      Write-Host ('OK: Intent-filter deep link agregado para ' + $scheme + '://callback')
    } else {
      Write-Host 'OK: Intent-filter deep link ya existia.'
    }

    [System.IO.File]::WriteAllText($manifestPath, $m, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ('OK: AndroidManifest.xml actualizado con package=' + $AppId)
  } else {
    Write-Host ('WARN: No existe AndroidManifest.xml aun en: ' + $manifestPath)
  }

  # --- STEP 4: Verify the file exists ---
  if (Test-Path -LiteralPath $mainActivityJava) {
    Write-Host 'VERIFICACION: MainActivity.java existe correctamente.'
    Get-Content -LiteralPath $mainActivityJava | Write-Host
  } else {
    throw 'ERROR: MainActivity.java no se creo correctamente!'
  }

  exit 0
}
catch {
  Write-Host ('ERROR: ensure-android-mainactivity.ps1 fallo: ' + $_.Exception.Message)
  exit 1
}
