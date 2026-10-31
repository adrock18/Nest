@echo off
title Nest Desktop Launcher
set PATH=C:\Users\neera\.cargo\bin;%PATH%
cd /d "%~dp0"

echo ========================================================
echo   Launching Nest - Personal Finance Desktop OS
echo ========================================================

:: Clean up any stale instances to release WebView2 locks
taskkill /f /im nest.exe >nul 2>&1

if "%1"=="--dev" goto dev_mode

if exist "src-tauri\target\release\nest.exe" (
    echo Starting Nest Desktop (Production Fast-Boot)...
    start "" "src-tauri\target\release\nest.exe"
    exit /b 0
)

:dev_mode
echo Starting Nest in Development Mode...
npm run tauri dev
pause

