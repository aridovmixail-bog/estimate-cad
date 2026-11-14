$ErrorActionPreference = "SilentlyContinue"
$startupFolder = [Environment]::GetFolderPath("Startup")
if (-not $startupFolder) {
    $startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
}

$startupShortcutPath = Join-Path $startupFolder "EstimateCAD_Autostart.lnk"
if (Test-Path $startupShortcutPath) {
    Remove-Item $startupShortcutPath -Force
    Write-Host "[OK] Автозапуск успешно отключен (ярлык удален из Startup)." -ForegroundColor Green
} else {
    Write-Host "[INFO] Ярлык автозапуска не был найден в папке Startup." -ForegroundColor Yellow
}
