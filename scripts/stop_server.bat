@echo off
chcp 65001 >nul
title Остановка Estimate CAD
cd /d "M:\BOG_AMA\projects\estimate-cad-app"

echo ===================================================
echo   Остановка веб-сервера Estimate CAD (порт 3000)
echo ===================================================

powershell.exe -ExecutionPolicy Bypass -File "M:\BOG_AMA\projects\estimate-cad-app\scripts\stop_app.ps1"

echo.
echo Нажмите любую клавишу для выхода...
timeout /t 2 >nul
