# 国际期货直播间PowerShell部署脚本
param(
    [switch]$Force,
    [switch]$SkipChecks,
    [string]$ServerIP = "193.57.33.111"
)

# 设置错误处理
$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   国际期货直播间Windows部署脚本" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "错误: 需要管理员权限运行此脚本" -ForegroundColor Red
    Write-Host "请以管理员身份重新运行PowerShell" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

# 检查Docker Desktop
if (-not $SkipChecks) {
    Write-Host "检查Docker Desktop..." -ForegroundColor Green
    try {
        $dockerVersion = docker version --format "{{.Server.Version}}" 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker未运行"
        }
        Write-Host "✓ Docker Desktop已运行 (版本: $dockerVersion)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker Desktop未运行或未安装" -ForegroundColor Red
        Write-Host "请先安装并启动Docker Desktop for Windows" -ForegroundColor Yellow
        Write-Host "下载地址: https://www.docker.com/products/docker-desktop" -ForegroundColor Blue
        Read-Host "按任意键退出"
        exit 1
    }

    # 检查docker-compose
    Write-Host "检查Docker Compose..." -ForegroundColor Green
    try {
        $composeVersion = docker-compose version --short 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "docker-compose未找到"
        }
        Write-Host "✓ Docker Compose已安装 (版本: $composeVersion)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker Compose未找到" -ForegroundColor Red
        Write-Host "Docker Desktop应该包含docker-compose，请检查安装" -ForegroundColor Yellow
        Read-Host "按任意键退出"
        exit 1
    }
}

# 创建必要的目录
Write-Host "创建必要的目录..." -ForegroundColor Green
$directories = @("uploads", "ssl", "logs", "backup")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ 创建目录: $dir" -ForegroundColor Green
    } else {
        Write-Host "✓ 目录已存在: $dir" -ForegroundColor Green
    }
}

# 更新配置文件中的服务器IP
if ($ServerIP -ne "193.57.33.111") {
    Write-Host "更新服务器IP配置为: $ServerIP" -ForegroundColor Green
    
    # 更新docker-compose.yml中的CORS_ORIGIN
    $composeFile = "docker-compose.yml"
    if (Test-Path $composeFile) {
        $content = Get-Content $composeFile -Raw
        $content = $content -replace "CORS_ORIGIN: http://.*:3001", "CORS_ORIGIN: http://${ServerIP}:3001"
        Set-Content $composeFile $content
        Write-Host "✓ 已更新 $composeFile" -ForegroundColor Green
    }
}

# 停止现有容器
Write-Host "停止现有容器..." -ForegroundColor Yellow
try {
    docker-compose down 2>$null
    Write-Host "✓ 已停止现有容器" -ForegroundColor Green
} catch {
    Write-Host "! 没有运行中的容器" -ForegroundColor Yellow
}

# 清理旧镜像（可选）
if ($Force) {
    Write-Host "清理Docker系统..." -ForegroundColor Yellow
    docker system prune -f | Out-Null
    Write-Host "✓ 系统清理完成" -ForegroundColor Green
}

# 构建并启动服务
Write-Host "构建并启动服务..." -ForegroundColor Green
Write-Host "这可能需要几分钟时间，请耐心等待..." -ForegroundColor Yellow

try {
    # 使用--no-cache强制重新构建（如果指定了Force参数）
    if ($Force) {
        docker-compose up --build --no-cache -d
    } else {
        docker-compose up --build -d
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker构建失败"
    }
    Write-Host "✓ 服务构建完成" -ForegroundColor Green
} catch {
    Write-Host "✗ 服务启动失败" -ForegroundColor Red
    Write-Host "请检查Docker日志获取更多信息:" -ForegroundColor Yellow
    Write-Host "docker-compose logs" -ForegroundColor Blue
    Read-Host "按任意键退出"
    exit 1
}

# 等待服务启动
Write-Host "等待服务启动..." -ForegroundColor Yellow
$countdown = 30
for ($i = $countdown; $i -gt 0; $i--) {
    Write-Progress -Activity "等待服务启动" -Status "剩余时间: $i 秒" -PercentComplete (($countdown - $i) / $countdown * 100)
    Start-Sleep 1
}
Write-Progress -Activity "等待服务启动" -Completed

# 检查服务状态
Write-Host "检查服务状态..." -ForegroundColor Green
$services = docker-compose ps --format "table {{.Service}}\t{{.State}}\t{{.Ports}}"
Write-Host $services

# 健康检查
Write-Host ""
Write-Host "执行健康检查..." -ForegroundColor Green

# 检查MongoDB
try {
    $mongoStatus = docker exec futures-trading-mongodb mongo --eval "db.stats()" --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MongoDB连接正常" -ForegroundColor Green
    } else {
        Write-Host "! MongoDB可能未完全启动" -ForegroundColor Yellow
    }
} catch {
    Write-Host "! 无法检查MongoDB状态" -ForegroundColor Yellow
}

# 检查Redis
try {
    $redisStatus = docker exec futures-trading-redis redis-cli ping 2>$null
    if ($redisStatus -eq "PONG") {
        Write-Host "✓ Redis连接正常" -ForegroundColor Green
    } else {
        Write-Host "! Redis可能未完全启动" -ForegroundColor Yellow
    }
} catch {
    Write-Host "! 无法检查Redis状态" -ForegroundColor Yellow
}

# 检查应用端口
Write-Host "检查应用端口..." -ForegroundColor Green
$ports = @(80, 3001, 27017, 6379)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "✓ 端口 $port 可访问" -ForegroundColor Green
        } else {
            Write-Host "! 端口 $port 不可访问" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "! 无法检查端口 $port" -ForegroundColor Yellow
    }
}

# 部署完成信息
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "           部署完成！" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Yellow
Write-Host "  前端页面: http://$ServerIP" -ForegroundColor Blue
Write-Host "  API接口: http://$ServerIP:3001" -ForegroundColor Blue
Write-Host "  管理后台: http://$ServerIP/admin" -ForegroundColor Blue
Write-Host ""
Write-Host "容器管理命令:" -ForegroundColor Yellow
Write-Host "  查看状态: docker-compose ps" -ForegroundColor Blue
Write-Host "  查看日志: docker-compose logs -f app" -ForegroundColor Blue
Write-Host "  重启服务: docker-compose restart" -ForegroundColor Blue
Write-Host "  停止服务: docker-compose down" -ForegroundColor Blue
Write-Host ""

# 创建快捷方式脚本
$shortcutScript = @"
# 快捷管理脚本
Write-Host "期货直播间快捷管理" -ForegroundColor Cyan
Write-Host "1. 查看状态"
Write-Host "2. 查看日志"
Write-Host "3. 重启服务"
Write-Host "4. 停止服务"
Write-Host "5. 退出"

do {
    `$choice = Read-Host "请选择操作 (1-5)"
    switch (`$choice) {
        "1" { docker-compose ps }
        "2" { docker-compose logs -f app }
        "3" { docker-compose restart; Write-Host "服务已重启" -ForegroundColor Green }
        "4" { docker-compose down; Write-Host "服务已停止" -ForegroundColor Yellow }
        "5" { exit }
        default { Write-Host "无效选择，请重试" -ForegroundColor Red }
    }
} while (`$choice -ne "5")
"@

Set-Content "manage.ps1" $shortcutScript
Write-Host "已创建管理脚本: manage.ps1" -ForegroundColor Green
Write-Host "使用 .\manage.ps1 快速管理服务" -ForegroundColor Blue

Write-Host ""
Read-Host "按任意键退出"
