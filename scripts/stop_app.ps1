$ErrorActionPreference = "SilentlyContinue"
$projectDir = "M:\BOG_AMA\projects\estimate-cad-app"
$logFile = "$projectDir\scripts\autostart.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        if ($p -gt 0) {
            & taskkill /F /T /PID $p 2>$null
            Add-Content -Path $logFile -Value "[$timestamp] Сервер остановлен (PID: $p)." -Encoding UTF8
        }
    }
    Write-Host "Сервер сметы (порт 3000) успешно остановлен." -ForegroundColor Green
} else {
    Add-Content -Path $logFile -Value "[$timestamp] Запрос остановки: порт 3000 свободен." -Encoding UTF8
    Write-Host "Сервер на порту 3000 не запущен." -ForegroundColor Yellow
}
