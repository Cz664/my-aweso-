@echo off
echo 国际期货直播间Windows部署脚本
echo 开始部署...

:: 检查Docker Desktop是否运行
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker Desktop未运行或未安装
    echo 请先安装并启动Docker Desktop for Windows
    echo 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 检查docker-compose是否可用
docker-compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: docker-compose未找到
    echo Docker Desktop应该包含docker-compose，请检查安装
    pause
    exit /b 1
)

:: 创建必要的目录
echo 创建必要的目录...
if not exist "uploads" mkdir uploads
if not exist "ssl" mkdir ssl
if not exist "logs" mkdir logs

:: 停止现有容器
echo 停止现有容器...
docker-compose down

:: 清理旧镜像
echo 清理旧镜像...
docker system prune -f

:: 构建并启动服务
echo 构建并启动服务...
docker-compose up --build -d

:: 等待服务启动
echo 等待服务启动...
timeout /t 30 /nobreak >nul

:: 检查服务状态
echo 检查服务状态...
docker-compose ps

echo.
echo 部署完成！
echo 访问地址: http://localhost:3000
echo 管理后台: http://localhost:3000/admin
echo.
pause
