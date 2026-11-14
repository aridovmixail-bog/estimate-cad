@echo off
chcp 65001 >nul
title Estimate CAD Dev Server
cd /d "M:\BOG_AMA\projects\estimate-cad-app"

echo ===================================================
echo   Запуск веб-приложения Estimate CAD (порт 3000)
echo ===================================================

powershell.exe -ExecutionPolicy Bypass -File "M:\BOG_AMA\projects\estimate-cad-app\scripts\start_app.ps1"

echo.
echo [OK] Приложение готово и открыто в браузере: http://localhost:3000/
echo Нажмите любую клавишу для закрытия этого окна...
pause >nul
