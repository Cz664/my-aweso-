@echo off
echo 开始部署国际期货直播间到Windows Server...

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js未安装，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm未安装，请先安装npm
    pause
    exit /b 1
)

REM 创建必要的目录
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

REM 安装后端依赖
echo 安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo 后端依赖安装失败
    pause
    exit /b 1
)

REM 返回根目录
cd ..

REM 安装前端依赖
echo 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo 前端依赖安装失败
    pause
    exit /b 1
)

REM 构建前端
echo 构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo 前端构建失败
    pause
    exit /b 1
)

REM 复制构建文件到后端public目录
echo 复制前端构建文件...
if exist "..\backend\public" rmdir /s /q "..\backend\public"
xcopy /e /i build "..\backend\public"

REM 返回根目录
cd ..

REM 创建环境变量文件
echo 创建环境变量文件...
(
echo NODE_ENV=production
echo PORT=3001
echo MONGODB_URI=mongodb://localhost:27017/futures-trading
echo JWT_SECRET=futures-trading-jwt-secret-key-2024
echo JWT_EXPIRES_IN=7d
echo CORS_ORIGIN=http://38.180.94.137:3001
echo UPLOAD_PATH=./uploads
echo MAX_FILE_SIZE=10485760
) > backend\.env

echo.
echo 部署完成！
echo.
echo 启动说明：
echo 1. 确保MongoDB在本地运行 (mongodb://localhost:27017)
echo 2. 进入backend目录: cd backend
echo 3. 启动服务器: npm start
echo 4. 访问地址: http://38.180.94.137:3001
echo.
echo 默认账号：
echo 管理员: admin@futures-trading.com / password
echo 主播: streamer1@futures-trading.com / password
echo.
pause
