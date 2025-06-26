#!/bin/bash

# 国际期货直播间远程部署脚本
SERVER_IP="38.180.94.137"
SERVER_USER="administrator"
SERVER_PASS="6tF87fqvsc"
PROJECT_NAME="futures-trading-platform"

echo "开始远程部署国际期货直播间到服务器 $SERVER_IP..."

# 创建部署包
echo "创建部署包..."
tar -czf ${PROJECT_NAME}.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=uploads \
    backend/ frontend/ docker-compose.yml Dockerfile nginx.conf mongo-init.js deploy.sh

echo "部署包创建完成: ${PROJECT_NAME}.tar.gz"

# 上传到服务器的命令
echo ""
echo "请手动执行以下步骤完成部署："
echo ""
echo "1. 上传部署包到服务器："
echo "   scp ${PROJECT_NAME}.tar.gz administrator@${SERVER_IP}:/home/administrator/"
echo ""
echo "2. 连接到服务器："
echo "   ssh administrator@${SERVER_IP}"
echo ""
echo "3. 在服务器上执行："
echo "   cd /home/administrator"
echo "   tar -xzf ${PROJECT_NAME}.tar.gz"
echo "   cd ${PROJECT_NAME}"
echo "   chmod +x deploy.sh"
echo "   sudo ./deploy.sh"
echo ""
echo "4. 访问应用："
echo "   http://${SERVER_IP}"
echo ""
echo "默认账号："
echo "管理员: admin@futures-trading.com / password"
echo "主播: streamer1@futures-trading.com / password"
