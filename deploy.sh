#!/bin/bash

# 国际期货直播间部署脚本
echo "开始部署国际期货直播间..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "Docker未安装，正在安装..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose未安装，正在安装..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建必要的目录
mkdir -p uploads
mkdir -p ssl
mkdir -p logs

# 设置权限
chmod 755 uploads
chmod 755 logs

# 停止现有容器
echo "停止现有容器..."
docker-compose down

# 清理旧镜像
echo "清理旧镜像..."
docker system prune -f

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

# 显示日志
echo "显示应用日志..."
docker-compose logs app

echo "部署完成！"
echo "访问地址: http://38.180.94.137"
echo "管理员账号: admin@futures-trading.com"
echo "密码: password"
echo ""
echo "主播账号: streamer1@futures-trading.com"
echo "密码: password"
