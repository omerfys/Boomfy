@echo off
cd /d "%~dp0"
title Boomfy Local Server
echo ========================================================
echo               BOOMFY LOCAL GAME SERVER
echo ========================================================
echo.
echo Starting Boomfy on http://localhost:3001 ...
echo (Your browser will open automatically once ready)
echo.
python server.py
if errorlevel 1 (
    echo.
    echo Python failed to start. Trying python3 / py launcher...
    py server.py
)
pause
