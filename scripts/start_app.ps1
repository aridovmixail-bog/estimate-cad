$ErrorActionPreference = "SilentlyContinue"
$projectDir = "M:\BOG_AMA\projects\estimate-cad-app"
$logFile = "$projectDir\scripts\autostart.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Проверяем, слушается ли уже порт 3000
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if (-not $conn) {
    Add-Content -Path $logFile -Value "[$timestamp] Запуск dev-сервера Estimate CAD..." -Encoding UTF8
    
    # Запуск npm run dev в полностью скрытом окне
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $projectDir -WindowStyle Hidden
    
    # Ожидаем поднятия порта 3000 (до 15 секунд)
    $attempts = 0
    while ($attempts -lt 15) {
        Start-Sleep -Seconds 1
        $conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            break
        }
        $attempts++
    }
    Add-Content -Path $logFile -Value "[$timestamp] Сервер успешно запущен (готов за $attempts сек)." -Encoding UTF8
} else {
    Add-Content -Path $logFile -Value "[$timestamp] Сервер уже активен на порту 3000 (PID: $($conn.OwningProcess)). Повторный запуск не требуется." -Encoding UTF8
}

# Открываем сайт в браузере
Start-Sleep -Milliseconds 500
Start-Process "http://localhost:3000/"
