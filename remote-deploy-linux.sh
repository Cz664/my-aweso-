#!/bin/bash

# 国际期货直播间远程Linux部署脚本
set -e

# 服务器配置
SERVER_IP="193.57.33.111"
SERVER_USER="root"
PROJECT_NAME="futures-trading-platform"
REMOTE_DIR="/opt/futures-platform"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==========================================${NC}"
echo -e "${YELLOW}   国际期货直播间远程Linux部署脚本${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""
echo -e "${BLUE}目标服务器: $SERVER_IP${NC}"
echo -e "${BLUE}用户: $SERVER_USER${NC}"
echo -e "${BLUE}远程目录: $REMOTE_DIR${NC}"
echo ""

# 检查必要工具
for cmd in scp ssh tar; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}错误: 未找到 $cmd 命令${NC}"
        echo -e "${YELLOW}macOS用户请安装: brew install openssh${NC}"
        exit 1
    fi
done

# 检查SSH连接
echo -e "${GREEN}测试SSH连接...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP 'echo "SSH连接成功"' 2>/dev/null; then
    echo -e "${RED}错误: 无法连接到服务器 $SERVER_IP${NC}"
    echo -e "${YELLOW}请检查:${NC}"
    echo -e "${BLUE}1. 服务器IP地址是否正确${NC}"
    echo -e "${BLUE}2. SSH服务是否运行${NC}"
    echo -e "${BLUE}3. 网络连接是否正常${NC}"
    echo -e "${BLUE}4. SSH密钥是否配置正确${NC}"
    exit 1
fi

echo -e "${GREEN}✓ SSH连接正常${NC}"

# 创建部署包
echo -e "${GREEN}创建部署包...${NC}"
tar -czf ${PROJECT_NAME}.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=uploads \
    --exclude=*.tar.gz \
    --exclude=.DS_Store \
    backend/ \
    frontend/ \
    docker-compose.yml \
    Dockerfile \
    nginx.conf \
    mongo-init.js \
    deploy-linux.sh \
    *.md 2>/dev/null || true

if [ ! -f "${PROJECT_NAME}.tar.gz" ]; then
    echo -e "${RED}错误: 创建部署包失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 部署包创建完成: ${PROJECT_NAME}.tar.gz${NC}"

# 上传部署包
echo -e "${GREEN}上传部署包到服务器...${NC}"
if scp ${PROJECT_NAME}.tar.gz $SERVER_USER@$SERVER_IP:/tmp/; then
    echo -e "${GREEN}✓ 部署包上传成功${NC}"
else
    echo -e "${RED}错误: 部署包上传失败${NC}"
    exit 1
fi

# 清理本地部署包
rm -f ${PROJECT_NAME}.tar.gz

# 远程部署
echo -e "${GREEN}在服务器上执行部署...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
set -e

echo "=========================================="
echo "开始远程部署..."
echo "=========================================="

# 创建项目目录
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR

# 备份现有部署
if [ -d "backup" ]; then
    backup_name="backup_\$(date +%Y%m%d_%H%M%S)"
    echo "备份现有部署为: \$backup_name"
    cp -r . ../\$backup_name 2>/dev/null || true
fi

# 解压新版本
echo "解压部署包..."
tar -xzf /tmp/${PROJECT_NAME}.tar.gz -C . --strip-components=0

# 设置执行权限
chmod +x deploy-linux.sh

# 运行部署脚本
echo "运行部署脚本..."
./deploy-linux.sh

# 清理临时文件
rm -f /tmp/${PROJECT_NAME}.tar.gz

echo "=========================================="
echo "远程部署完成！"
echo "=========================================="
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${CYAN}==========================================${NC}"
    echo -e "${GREEN}           部署成功！${NC}"
    echo -e "${CYAN}==========================================${NC}"
    echo ""
    echo -e "${YELLOW}访问地址:${NC}"
    echo -e "${BLUE}  前端页面: http://$SERVER_IP${NC}"
    echo -e "${BLUE}  API接口: http://$SERVER_IP:3001${NC}"
    echo -e "${BLUE}  管理后台: http://$SERVER_IP/admin${NC}"
    echo ""
    echo -e "${YELLOW}默认账号:${NC}"
    echo -e "${BLUE}  管理员: admin@futures-trading.com / password${NC}"
    echo -e "${BLUE}  主播: streamer1@futures-trading.com / password${NC}"
    echo ""
    echo -e "${YELLOW}远程管理:${NC}"
    echo -e "${BLUE}  连接服务器: ssh $SERVER_USER@$SERVER_IP${NC}"
    echo -e "${BLUE}  管理服务: cd $REMOTE_DIR && ./manage.sh${NC}"
    echo ""
    echo -e "${RED}⚠️  安全提醒: 请立即修改默认密码！${NC}"
    
    # 询问是否连接到服务器
    echo ""
    read -p "是否现在连接到服务器进行管理? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && ./manage.sh"
    fi
else
    echo -e "${RED}部署失败，请检查服务器日志${NC}"
    exit 1
fi
