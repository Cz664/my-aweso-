#!/bin/bash

# 快速Linux部署脚本 - 直接从GitHub克隆并部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==========================================${NC}"
echo -e "${YELLOW}   期货直播间一键部署脚本${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# 检查root权限
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}错误: 需要root权限运行${NC}"
   echo -e "${YELLOW}请使用: sudo bash <(curl -fsSL https://raw.githubusercontent.com/Cz664/my-aweso-/main/quick-deploy.sh)${NC}"
   exit 1
fi

# 项目配置
REPO_URL="https://github.com/Cz664/my-aweso-.git"
PROJECT_DIR="/opt/futures-platform"
BRANCH="main"

echo -e "${GREEN}开始一键部署...${NC}"
echo -e "${BLUE}项目地址: $REPO_URL${NC}"
echo -e "${BLUE}安装目录: $PROJECT_DIR${NC}"
echo ""

# 更新系统
echo -e "${GREEN}更新系统包...${NC}"
if command -v yum &> /dev/null; then
    yum update -y && yum install -y curl wget git unzip
elif command -v apt &> /dev/null; then
    apt update && apt upgrade -y && apt install -y curl wget git unzip
fi

# 安装Docker
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}安装Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 安装Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}安装Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 克隆项目
echo -e "${GREEN}克隆项目...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}项目目录已存在，备份旧版本...${NC}"
    mv $PROJECT_DIR ${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)
fi

git clone $REPO_URL $PROJECT_DIR
cd $PROJECT_DIR

# 设置权限并运行部署
chmod +x deploy-linux.sh
echo -e "${GREEN}运行部署脚本...${NC}"
./deploy-linux.sh

echo ""
echo -e "${GREEN}一键部署完成！${NC}"
echo -e "${BLUE}使用 'cd $PROJECT_DIR && ./manage.sh' 管理服务${NC}"
