param(
    [string]$SourceIcon = "public\app-icon-512.png"
)

# Verificar que el icono fuente existe
if (-not (Test-Path $SourceIcon)) {
    Write-Host "ERROR: No se encuentra el icono fuente: $SourceIcon" -ForegroundColor Red
    exit 1
}

Write-Host "Generando iconos Android desde: $SourceIcon" -ForegroundColor Cyan

# Definir tamaños para cada densidad
$sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Cargar ensamblados de .NET para manipulación de imágenes
Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $SourceIcon))

foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $targetDir = "android\app\src\main\res\$folder"
    
    # Crear carpeta si no existe
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    # Crear imagen redimensionada
    $newImage = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($newImage)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
    
    # Guardar ic_launcher.png
    $targetPath = Join-Path $targetDir "ic_launcher.png"
    $newImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  Creado: $targetPath ($size x $size)" -ForegroundColor Green
    
    # Guardar ic_launcher_round.png (mismo archivo)
    $targetPathRound = Join-Path $targetDir "ic_launcher_round.png"
    $newImage.Save($targetPathRound, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  Creado: $targetPathRound ($size x $size)" -ForegroundColor Green
    
    # Guardar ic_launcher_foreground.png (mismo archivo)
    $targetPathForeground = Join-Path $targetDir "ic_launcher_foreground.png"
    $newImage.Save($targetPathForeground, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  Creado: $targetPathForeground ($size x $size)" -ForegroundColor Green
    
    $graphics.Dispose()
    $newImage.Dispose()
}

$sourceImage.Dispose()

Write-Host ""
Write-Host "Iconos Android generados correctamente!" -ForegroundColor Green
