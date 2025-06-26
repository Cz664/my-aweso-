@echo off
setlocal enabledelayedexpansion

:: 国际期货直播间Windows远程部署脚本
set SERVER_IP=193.57.33.111
set SERVER_USER=root
set PROJECT_NAME=futures-trading-platform

echo 国际期货直播间Windows远程部署脚本
echo 目标服务器: %SERVER_IP%
echo.

:: 检查是否安装了必要工具
where scp >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到scp命令
    echo 请安装OpenSSH客户端或使用Git Bash
    echo Windows 10/11可以通过"设置 > 应用 > 可选功能"安装OpenSSH客户端
    pause
    exit /b 1
)

:: 创建部署包
echo 创建部署包...
powershell -Command "Compress-Archive -Path backend,frontend,docker-compose.yml,Dockerfile,nginx.conf,mongo-init.js,deploy-windows.bat -DestinationPath %PROJECT_NAME%.zip -Force"

if %errorlevel% neq 0 (
    echo 错误: 创建部署包失败
    pause
    exit /b 1
)

echo 部署包创建完成: %PROJECT_NAME%.zip

echo.
echo ========== 部署步骤 ==========
echo.
echo 1. 上传部署包到服务器:
echo    scp %PROJECT_NAME%.zip %SERVER_USER%@%SERVER_IP%:/tmp/
echo.
echo 2. 连接到服务器:
echo    ssh %SERVER_USER%@%SERVER_IP%
echo.
echo 3. 在服务器上执行:
echo    cd /tmp
echo    unzip %PROJECT_NAME%.zip -d /opt/futures-platform/
echo    cd /opt/futures-platform
echo    chmod +x deploy-windows.bat
echo    ./deploy-windows.bat
echo.
echo ========== 自动执行上传 ==========
echo.

set /p choice="是否自动上传到服务器? (y/n): "
if /i "%choice%"=="y" (
    echo 正在上传...
    scp %PROJECT_NAME%.zip %SERVER_USER%@%SERVER_IP%:/tmp/
    if %errorlevel% equ 0 (
        echo 上传成功！
        echo.
        echo 现在连接到服务器完成部署:
        echo ssh %SERVER_USER%@%SERVER_IP%
        echo.
        set /p connect="是否立即连接到服务器? (y/n): "
        if /i "!connect!"=="y" (
            ssh %SERVER_USER%@%SERVER_IP%
        )
    ) else (
        echo 上传失败，请检查网络连接和服务器信息
    )
) else (
    echo 请手动执行上述命令完成部署
)

echo.
pause
