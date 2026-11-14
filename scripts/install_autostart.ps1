$ErrorActionPreference = "Stop"
$projectDir = "M:\BOG_AMA\projects\estimate-cad-app"
$scriptsDir = "$projectDir\scripts"
$silentVbs = "$scriptsDir\start_silent.vbs"
$stopBat = "$scriptsDir\stop_server.bat"

# 1. Папка Автозагрузки Windows (Startup)
$startupFolder = [Environment]::GetFolderPath("Startup")
if (-not $startupFolder) {
    $startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
}

# 2. Папка Рабочего стола (Desktop)
$desktopFolder = [Environment]::GetFolderPath("Desktop")
if (-not $desktopFolder -or -not (Test-Path $desktopFolder)) {
    $desktopFolder = "$env:USERPROFILE\Desktop"
}

$wshShell = New-Object -ComObject WScript.Shell

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Установка автозапуска и ярлыков Estimate CAD в Windows   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Ярлык в Автозагрузку (тихий старт через wscript)
$startupShortcutPath = Join-Path $startupFolder "EstimateCAD_Autostart.lnk"
$startupShortcut = $wshShell.CreateShortcut($startupShortcutPath)
$startupShortcut.TargetPath = "wscript.exe"
$startupShortcut.Arguments = "`"$silentVbs`""
$startupShortcut.WorkingDirectory = $projectDir
$startupShortcut.Description = "Автозапуск веб-приложения Estimate CAD при старте Windows"
$startupShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,13"
$startupShortcut.Save()
Write-Host "[+] Ярлык автозапуска создан в: $startupShortcutPath" -ForegroundColor Green

# 2. Ярлык на Рабочем столе: Запустить Смету CAD
$startDesktopPath = Join-Path $desktopFolder "Запустить Смету CAD.lnk"
$startShortcut = $wshShell.CreateShortcut($startDesktopPath)
$startShortcut.TargetPath = "wscript.exe"
$startShortcut.Arguments = "`"$silentVbs`""
$startShortcut.WorkingDirectory = $projectDir
$startShortcut.Description = "Запуск сервера Estimate CAD в фоне и открытие в браузере"
$startShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,13"
$startShortcut.Save()
Write-Host "[+] Ярлык запуска на Рабочем столе: $startDesktopPath" -ForegroundColor Green

# 3. Ярлык на Рабочем столе: Остановить Смету CAD
$stopDesktopPath = Join-Path $desktopFolder "Остановить Смету CAD.lnk"
$stopShortcut = $wshShell.CreateShortcut($stopDesktopPath)
$stopShortcut.TargetPath = "cmd.exe"
$stopShortcut.Arguments = "/c `"$stopBat`""
$stopShortcut.WorkingDirectory = $projectDir
$stopShortcut.Description = "Остановка сервера Estimate CAD"
$stopShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,131"
$stopShortcut.Save()
Write-Host "[+] Ярлык остановки на Рабочем столе: $stopDesktopPath" -ForegroundColor Green

# 4. Ярлык на Рабочем столе: Открыть Смету в браузере (URL)
$urlDesktopPath = Join-Path $desktopFolder "Открыть Смету CAD в браузере.url"
$urlContent = @"
[InternetShortcut]
URL=http://localhost:3000/
IconIndex=13
IconFile=$env:SystemRoot\System32\shell32.dll
"@
[System.IO.File]::WriteAllText($urlDesktopPath, $urlContent, [System.Text.Encoding]::UTF8)
Write-Host "[+] Ярлык браузера на Рабочем столе: $urlDesktopPath" -ForegroundColor Green

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Готово! Автозапуск настроен, приложение стартует с ПК.   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
