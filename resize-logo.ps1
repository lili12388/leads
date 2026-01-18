Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\laith\OneDrive\Desktop\ggl maps extractor\landing-page-website\public\logo (3).png"
$destFolder = "c:\Users\laith\OneDrive\Desktop\ggl maps extractor\extension-proxy-test\icons"

$src = [System.Drawing.Image]::FromFile($srcPath)

$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $dest = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()
    
    $destPath = Join-Path $destFolder "icon$size.png"
    $dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
    
    Write-Host "Created icon$size.png"
}

$src.Dispose()
Write-Host "Done! Extension icons created."
