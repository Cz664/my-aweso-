@echo off
echo 启动国际期货直播间服务...

REM 检查MongoDB服务
echo 检查MongoDB服务状态...
net start MongoDB
if %errorlevel% neq 0 (
    echo MongoDB服务启动失败，请检查MongoDB是否正确安装
    pause
    exit /b 1
)

REM 启动Node.js应用
echo 启动应用服务器...
cd backend
npm start

REM 如果npm start失败
if %errorlevel% neq 0 (
    echo 应用启动失败，请检查错误信息
    pause
    exit /b 1
)

pause
