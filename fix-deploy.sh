#!/bin/bash

# 修复端口冲突的部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==========================================${NC}"
echo -e "${YELLOW}   端口冲突修复部署脚本${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}错误: 此脚本需要root权限运行${NC}"
   echo -e "${YELLOW}请使用: sudo $0${NC}"
   exit 1
fi

PROJECT_DIR="/opt/futures-platform"
cd $PROJECT_DIR

echo -e "${GREEN}步骤1: 停止所有相关服务...${NC}"

# 停止Docker容器
echo -e "${BLUE}停止Docker容器...${NC}"
docker-compose down 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true

# 停止系统服务
echo -e "${BLUE}停止系统MongoDB服务...${NC}"
systemctl stop mongod 2>/dev/null || true
systemctl disable mongod 2>/dev/null || true
systemctl stop mongodb 2>/dev/null || true
systemctl disable mongodb 2>/dev/null || true
pkill -f mongod || true

echo -e "${BLUE}停止系统Redis服务...${NC}"
systemctl stop redis 2>/dev/null || true
systemctl disable redis 2>/dev/null || true
systemctl stop redis-server 2>/dev/null || true
systemctl disable redis-server 2>/dev/null || true
pkill -f redis-server || true

echo -e "${BLUE}停止系统Nginx/Apache服务...${NC}"
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true
systemctl stop httpd 2>/dev/null || true
systemctl disable httpd 2>/dev/null || true

echo -e "${GREEN}步骤2: 清理Docker资源...${NC}"
docker system prune -f
docker network prune -f
docker volume prune -f

echo -e "${GREEN}步骤3: 检查端口状态...${NC}"
PORTS=(80 443 3001 27017 6379)
PORTS_OK=true

for port in "${PORTS[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${RED}端口 $port 仍被占用:${NC}"
        lsof -i :$port 2>/dev/null || ss -tuln | grep ":$port"
        
        # 强制杀死占用进程
        pids=$(lsof -ti :$port 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            echo -e "${YELLOW}强制结束占用端口 $port 的进程: $pids${NC}"
            kill -9 $pids 2>/dev/null || true
        fi
        
        # 如果27017或6379端口仍被占用，使用内部端口配置
        if [ "$port" = "27017" ] || [ "$port" = "6379" ]; then
            echo -e "${YELLOW}将使用Docker内部网络，不映射端口 $port 到主机${NC}"
        else
            PORTS_OK=false
        fi
    else
        echo -e "${GREEN}端口 $port 可用${NC}"
    fi
done

echo -e "${GREEN}步骤4: 选择部署配置...${NC}"

# 检查是否需要使用内部端口配置
if [ -f "docker-compose-noports.yml" ] && (netstat -tuln | grep -q ":27017 " || netstat -tuln | grep -q ":6379 "); then
    echo -e "${YELLOW}检测到端口冲突，使用内部端口配置...${NC}"
    COMPOSE_FILE="docker-compose-noports.yml"
else
    echo -e "${GREEN}使用标准端口配置...${NC}"
    COMPOSE_FILE="docker-compose.yml"
fi

echo -e "${GREEN}步骤5: 启动服务...${NC}"
echo -e "${BLUE}使用配置文件: $COMPOSE_FILE${NC}"

# 启动服务
docker-compose -f $COMPOSE_FILE up --build -d

echo -e "${GREEN}步骤6: 等待服务启动...${NC}"
sleep 30

echo -e "${GREEN}步骤7: 检查服务状态...${NC}"
docker-compose -f $COMPOSE_FILE ps

echo -e "${GREEN}步骤8: 健康检查...${NC}"

# 检查MongoDB
if docker exec futures-trading-mongodb mongo --eval "db.stats()" --quiet &>/dev/null; then
    echo -e "${GREEN}✓ MongoDB连接正常${NC}"
else
    echo -e "${YELLOW}! MongoDB可能未完全启动，检查日志...${NC}"
    docker-compose -f $COMPOSE_FILE logs mongodb | tail -10
fi

# 检查Redis
if docker exec futures-trading-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis连接正常${NC}"
else
    echo -e "${YELLOW}! Redis可能未完全启动，检查日志...${NC}"
    docker-compose -f $COMPOSE_FILE logs redis | tail -10
fi

# 检查应用
if curl -s http://localhost:3001/api/health &>/dev/null; then
    echo -e "${GREEN}✓ 应用服务正常${NC}"
else
    echo -e "${YELLOW}! 应用可能未完全启动，检查日志...${NC}"
    docker-compose -f $COMPOSE_FILE logs app | tail -10
fi

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${GREEN}           部署修复完成！${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo -e "${BLUE}  前端页面: http://$SERVER_IP${NC}"
echo -e "${BLUE}  API接口: http://$SERVER_IP:3001${NC}"
echo -e "${BLUE}  管理后台: http://$SERVER_IP/admin${NC}"
echo ""
echo -e "${YELLOW}使用的配置文件: $COMPOSE_FILE${NC}"
echo -e "${YELLOW}管理命令:${NC}"
echo -e "${BLUE}  查看状态: docker-compose -f $COMPOSE_FILE ps${NC}"
echo -e "${BLUE}  查看日志: docker-compose -f $COMPOSE_FILE logs -f app${NC}"
echo -e "${BLUE}  重启服务: docker-compose -f $COMPOSE_FILE restart${NC}"
echo ""
