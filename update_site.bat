@echo off
chcp 65001 > nul
echo ===================================================
echo   Обновление Estimate CAD на GitHub Pages...
echo ===================================================
echo.
cd /d "%~dp0"
call npm run deploy
echo.
echo ===================================================
echo   Готово! Сайт обновлен по ссылке:
echo   https://aridovmixail-bog.github.io/estimate-cad/
echo ===================================================
pause
