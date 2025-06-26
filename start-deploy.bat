@echo off
title 国际期货直播间 - Windows部署
color 0A

echo.
echo ==========================================
echo    国际期货直播间Windows部署向导
echo ==========================================
echo.

echo 请选择部署方式:
echo.
echo 1. 使用批处理脚本部署 (简单快速)
echo 2. 使用PowerShell脚本部署 (功能完整)
echo 3. 查看部署说明
echo 4. 退出
echo.

set /p choice="请输入选择 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 开始批处理部署...
    call deploy-windows.bat
) else if "%choice%"=="2" (
    echo.
    echo 开始PowerShell部署...
    powershell -ExecutionPolicy Bypass -File deploy-windows.ps1
) else if "%choice%"=="3" (
    echo.
    echo 正在打开部署说明...
    start notepad WINDOWS-DEPLOY.md
) else if "%choice%"=="4" (
    exit
) else (
    echo.
    echo 无效选择，请重试
    pause
    goto start
)

echo.
pause
