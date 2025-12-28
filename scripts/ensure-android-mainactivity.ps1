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

  if (Test-Path -LiteralPath $mainActivityKt) {
    # Overwrite to guarantee a valid entrypoint (not only package)
    [System.IO.File]::WriteAllText($mainActivityKt, $kotlinContent)
    Write-Host ('OK: MainActivity.kt asegurado en ' + $mainActivityKt)
  } else {
    # Create/overwrite Java MainActivity to guarantee the expected entrypoint exists
    [System.IO.File]::WriteAllText($mainActivityJava, $javaContent)
    Write-Host ('OK: MainActivity.java asegurado en ' + $mainActivityJava)
  }

  if (Test-Path -LiteralPath $manifestPath) {
    $m = Get-Content -LiteralPath $manifestPath -Raw

    # Normalize launcher activity name to relative .MainActivity so it resolves via namespace/applicationId
    $m2 = [regex]::Replace($m, 'android:name="[^"]*MainActivity"', 'android:name=".MainActivity"')

    # Ensure android:exported="true" on MainActivity (required on Android 12+ when intent-filters exist)
    $pattern = '(<activity\b(?:(?!>).)*android:name="\\.MainActivity"(?:(?!>).)*)>'
    $re = New-Object System.Text.RegularExpressions.Regex($pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $evaluator = [System.Text.RegularExpressions.MatchEvaluator]{
      param($match)
      $tag = $match.Value
      if ($tag -match 'android:exported\s*=') { return $tag }
      return ($tag -replace '>$', ' android:exported="true">')
    }

    $m3 = $re.Replace($m2, $evaluator, 1)

    if ($m3 -ne $m) {
      [System.IO.File]::WriteAllText($manifestPath, $m3)
      Write-Host ('OK: AndroidManifest.xml actualizado (' + $manifestPath + ')')
    } else {
      Write-Host ('OK: AndroidManifest.xml sin cambios (' + $manifestPath + ')')
    }
  } else {
    Write-Host ('WARN: No existe AndroidManifest.xml aun en: ' + $manifestPath)
  }

  exit 0
}
catch {
  Write-Host ('ERROR: ensure-android-mainactivity.ps1 fallo: ' + $_.Exception.Message)
  exit 1
}
