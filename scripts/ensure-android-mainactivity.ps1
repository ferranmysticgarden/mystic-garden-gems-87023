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

    # Ensure android:exported="true" on MainActivity (required on Android 12+)
    $pattern = '(<activity\b(?:(?!>).)*android:name="[^"]*MainActivity"(?:(?!>).)*)>'
    $re = New-Object System.Text.RegularExpressions.Regex($pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $evaluator = [System.Text.RegularExpressions.MatchEvaluator]{
      param($match)
      $tag = $match.Value
      if ($tag -match 'android:exported\s*=') { return $tag }
      return ($tag -replace '>$', ' android:exported="true">')
    }
    $m = $re.Replace($m, $evaluator, 1)

    [System.IO.File]::WriteAllText($manifestPath, $m)
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
