#!/bin/bash

# 端口冲突修复脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}=========================================${NC}"
echo -e "${YELLOW}   端口冲突诊断和修复脚本${NC}"
echo -e "${YELLOW}=========================================${NC}"
echo ""

# 检查需要的端口
PORTS=(80 443 3001 27017 6379)

echo -e "${GREEN}检查端口占用情况...${NC}"
for port in "${PORTS[@]}"; do
    echo -e "${BLUE}检查端口 $port:${NC}"
    
    # 检查端口是否被占用
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${RED}  ✗ 端口 $port 被占用${NC}"
        
        # 显示占用端口的进程
        echo -e "${YELLOW}  占用进程:${NC}"
        lsof -i :$port 2>/dev/null || ss -tuln | grep ":$port"
        
        # 如果是Docker容器占用，尝试停止
        if docker ps | grep -q ":$port->"; then
            echo -e "${YELLOW}  检测到Docker容器占用端口 $port${NC}"
            container_id=$(docker ps --format "table {{.ID}}\t{{.Ports}}" | grep ":$port->" | awk '{print $1}')
            if [ ! -z "$container_id" ]; then
                echo -e "${YELLOW}  停止容器 $container_id${NC}"
                docker stop $container_id || true
            fi
        fi
        
        # 特殊处理MongoDB端口
        if [ "$port" = "27017" ]; then
            echo -e "${YELLOW}  检查系统MongoDB服务...${NC}"
            if systemctl is-active --quiet mongod 2>/dev/null; then
                echo -e "${YELLOW}  停止系统MongoDB服务...${NC}"
                systemctl stop mongod
                systemctl disable mongod
            fi
            
            if systemctl is-active --quiet mongodb 2>/dev/null; then
                echo -e "${YELLOW}  停止系统MongoDB服务...${NC}"
                systemctl stop mongodb
                systemctl disable mongodb
            fi
            
            # 杀死所有MongoDB进程
            pkill -f mongod || true
        fi
        
        # 特殊处理Redis端口
        if [ "$port" = "6379" ]; then
            echo -e "${YELLOW}  检查系统Redis服务...${NC}"
            if systemctl is-active --quiet redis 2>/dev/null; then
                echo -e "${YELLOW}  停止系统Redis服务...${NC}"
                systemctl stop redis
                systemctl disable redis
            fi
            
            if systemctl is-active --quiet redis-server 2>/dev/null; then
                echo -e "${YELLOW}  停止系统Redis服务...${NC}"
                systemctl stop redis-server
                systemctl disable redis-server
            fi
            
            # 杀死所有Redis进程
            pkill -f redis-server || true
        fi
        
        # 特殊处理Nginx/Apache端口
        if [ "$port" = "80" ] || [ "$port" = "443" ]; then
            if systemctl is-active --quiet nginx 2>/dev/null; then
                echo -e "${YELLOW}  停止系统Nginx服务...${NC}"
                systemctl stop nginx
                systemctl disable nginx
            fi
            
            if systemctl is-active --quiet httpd 2>/dev/null; then
                echo -e "${YELLOW}  停止系统Apache服务...${NC}"
                systemctl stop httpd
                systemctl disable httpd
            fi
        fi
        
    else
        echo -e "${GREEN}  ✓ 端口 $port 可用${NC}"
    fi
    echo ""
done

echo -e "${GREEN}清理Docker资源...${NC}"
# 停止所有运行的容器
docker stop $(docker ps -q) 2>/dev/null || true

# 清理Docker系统
docker system prune -f

# 清理网络
docker network prune -f

# 清理卷
docker volume prune -f

echo ""
echo -e "${GREEN}重新检查端口状态...${NC}"
for port in "${PORTS[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${RED}端口 $port 仍被占用${NC}"
        lsof -i :$port 2>/dev/null || ss -tuln | grep ":$port"
    else
        echo -e "${GREEN}端口 $port 现在可用${NC}"
    fi
done

echo ""
echo -e "${GREEN}端口冲突修复完成！${NC}"
echo -e "${BLUE}现在可以重新运行部署脚本${NC}"
