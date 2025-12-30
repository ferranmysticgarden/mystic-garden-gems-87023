param(
    [string]$SourceIcon = "public\app-icon-512.png"
)

$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# Verificar que el icono fuente existe
if (-not (Test-Path -LiteralPath $SourceIcon)) {
    Write-Host "ERROR: No se encuentra el icono fuente: $SourceIcon" -ForegroundColor Red
    exit 1
}

$androidResRoot = "android\app\src\main\res"
Ensure-Dir $androidResRoot

Write-Host "Generando iconos Android desde: $SourceIcon" -ForegroundColor Cyan

# Tamaños para cada densidad (launcher)
$sizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

# Cargar ensamblados de .NET para manipulación de imágenes
Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $SourceIcon))

try {
    foreach ($folder in $sizes.Keys) {
        $size = $sizes[$folder]
        $targetDir = Join-Path $androidResRoot $folder
        Ensure-Dir $targetDir

        # Crear imagen redimensionada
        $newImage = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($newImage)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        $graphics.DrawImage($sourceImage, 0, 0, $size, $size)

        # Legacy launcher icons
        $targetPath = Join-Path $targetDir "ic_launcher.png"
        $newImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

        $targetPathRound = Join-Path $targetDir "ic_launcher_round.png"
        $newImage.Save($targetPathRound, [System.Drawing.Imaging.ImageFormat]::Png)

        # Adaptive icon foreground
        $targetPathForeground = Join-Path $targetDir "ic_launcher_foreground.png"
        $newImage.Save($targetPathForeground, [System.Drawing.Imaging.ImageFormat]::Png)

        Write-Host "  OK: $folder ($size x $size)" -ForegroundColor Green

        $graphics.Dispose()
        $newImage.Dispose()
    }

    # Adaptive icon XML (Android 8+)
    $anydpiDir = Join-Path $androidResRoot "mipmap-anydpi-v26"
    Ensure-Dir $anydpiDir

    $adaptiveXml = @"
<?xml version=""1.0"" encoding=""utf-8""?>
<adaptive-icon xmlns:android=""http://schemas.android.com/apk/res/android"">
  <background android:drawable=""@color/ic_launcher_background""/>
  <foreground android:drawable=""@mipmap/ic_launcher_foreground""/>
</adaptive-icon>
"@

    [System.IO.File]::WriteAllText((Join-Path $anydpiDir "ic_launcher.xml"), $adaptiveXml)
    [System.IO.File]::WriteAllText((Join-Path $anydpiDir "ic_launcher_round.xml"), $adaptiveXml)
    Write-Host "  OK: mipmap-anydpi-v26 adaptive icons" -ForegroundColor Green

    # Asegurar color de fondo
    $valuesDir = Join-Path $androidResRoot "values"
    Ensure-Dir $valuesDir
    $bgColorFile = Join-Path $valuesDir "ic_launcher_background.xml"

    if (-not (Test-Path -LiteralPath $bgColorFile)) {
        $bgXml = @"
<?xml version=""1.0"" encoding=""utf-8""?>
<resources>
  <color name=""ic_launcher_background"">#1a0a2e</color>
</resources>
"@
        [System.IO.File]::WriteAllText($bgColorFile, $bgXml)
        Write-Host "  OK: values/ic_launcher_background.xml creado" -ForegroundColor Green
    } else {
        Write-Host "  OK: values/ic_launcher_background.xml ya existia" -ForegroundColor DarkGray
    }

    Write-Host "" 
    Write-Host "Iconos Android generados correctamente!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    if ($sourceImage -ne $null) {
        $sourceImage.Dispose()
    }
}
