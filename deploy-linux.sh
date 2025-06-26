#!/bin/bash

# 国际期货直播间Linux部署脚本
set -e

echo "=========================================="
echo "   国际期货直播间Linux部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}错误: 此脚本需要root权限运行${NC}"
   echo -e "${YELLOW}请使用: sudo $0${NC}"
   exit 1
fi

# 更新系统包
echo -e "${GREEN}更新系统包...${NC}"
if command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum update -y
    yum install -y curl wget git unzip
elif command -v apt &> /dev/null; then
    # Ubuntu/Debian
    apt update
    apt upgrade -y
    apt install -y curl wget git unzip
else
    echo -e "${YELLOW}警告: 无法识别包管理器，请手动安装 curl wget git unzip${NC}"
fi

# 检查并安装Docker
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}安装Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✓ Docker安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker已安装${NC}"
fi

# 检查并安装Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}安装Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose安装完成${NC}"
else
    echo -e "${GREEN}✓ Docker Compose已安装${NC}"
fi

# 创建项目目录
PROJECT_DIR="/opt/futures-platform"
echo -e "${GREEN}创建项目目录: $PROJECT_DIR${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 创建必要的子目录
echo -e "${GREEN}创建必要的目录...${NC}"
mkdir -p uploads ssl logs backup
chmod 755 uploads logs backup

# 如果项目文件不存在，尝试从当前目录复制或下载
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}项目文件不存在，请确保已上传项目文件到此目录${NC}"
    echo -e "${BLUE}或者从GitHub克隆项目:${NC}"
    echo -e "${CYAN}git clone https://github.com/Cz664/my-aweso-.git .${NC}"
    read -p "是否现在克隆项目? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git clone https://github.com/Cz664/my-aweso-.git .
    else
        echo -e "${RED}请手动上传项目文件后重新运行此脚本${NC}"
        exit 1
    fi
fi

# 停止现有容器
echo -e "${YELLOW}停止现有容器...${NC}"
docker-compose down 2>/dev/null || echo -e "${YELLOW}没有运行中的容器${NC}"

# 清理旧镜像
echo -e "${YELLOW}清理Docker系统...${NC}"
docker system prune -f

# 配置防火墙
echo -e "${GREEN}配置防火墙...${NC}"
if command -v firewall-cmd &> /dev/null; then
    # CentOS/RHEL firewalld
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=3001/tcp
    firewall-cmd --reload
    echo -e "${GREEN}✓ Firewalld配置完成${NC}"
elif command -v ufw &> /dev/null; then
    # Ubuntu ufw
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3001/tcp
    echo -e "${GREEN}✓ UFW配置完成${NC}"
else
    echo -e "${YELLOW}警告: 请手动配置防火墙，开放端口 80, 443, 3001${NC}"
fi

# 构建并启动服务
echo -e "${GREEN}构建并启动服务...${NC}"
echo -e "${YELLOW}这可能需要几分钟时间，请耐心等待...${NC}"

docker-compose up --build -d

# 等待服务启动
echo -e "${GREEN}等待服务启动...${NC}"
sleep 30

# 检查服务状态
echo -e "${GREEN}检查服务状态...${NC}"
docker-compose ps

# 健康检查
echo ""
echo -e "${GREEN}执行健康检查...${NC}"

# 检查MongoDB
if docker exec futures-trading-mongodb mongo --eval "db.stats()" --quiet &>/dev/null; then
    echo -e "${GREEN}✓ MongoDB连接正常${NC}"
else
    echo -e "${YELLOW}! MongoDB可能未完全启动${NC}"
fi

# 检查Redis
if docker exec futures-trading-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis连接正常${NC}"
else
    echo -e "${YELLOW}! Redis可能未完全启动${NC}"
fi

# 检查端口
echo -e "${GREEN}检查端口状态...${NC}"
for port in 80 3001 27017 6379; do
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${GREEN}✓ 端口 $port 已监听${NC}"
    else
        echo -e "${YELLOW}! 端口 $port 未监听${NC}"
    fi
done

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')

# 部署完成信息
echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${GREEN}           部署完成！${NC}"
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
echo -e "${YELLOW}管理命令:${NC}"
echo -e "${BLUE}  查看状态: docker-compose ps${NC}"
echo -e "${BLUE}  查看日志: docker-compose logs -f app${NC}"
echo -e "${BLUE}  重启服务: docker-compose restart${NC}"
echo -e "${BLUE}  停止服务: docker-compose down${NC}"
echo ""
echo -e "${RED}⚠️  安全提醒: 请立即修改默认密码！${NC}"
echo ""

# 创建管理脚本
cat > manage.sh << 'EOF'
#!/bin/bash

# 期货直播间管理脚本
cd /opt/futures-platform

echo "==========================================="
echo "     期货直播间服务管理"
echo "==========================================="
echo "1. 查看服务状态"
echo "2. 查看应用日志"
echo "3. 查看所有日志"
echo "4. 重启服务"
echo "5. 停止服务"
echo "6. 启动服务"
echo "7. 更新部署"
echo "8. 备份数据"
echo "9. 退出"
echo ""

read -p "请选择操作 (1-9): " choice

case $choice in
    1)
        docker-compose ps
        ;;
    2)
        docker-compose logs -f app
        ;;
    3)
        docker-compose logs -f
        ;;
    4)
        docker-compose restart
        echo "服务已重启"
        ;;
    5)
        docker-compose down
        echo "服务已停止"
        ;;
    6)
        docker-compose up -d
        echo "服务已启动"
        ;;
    7)
        echo "拉取最新代码..."
        git pull
        echo "重新构建并启动..."
        docker-compose down
        docker-compose up --build -d
        echo "更新完成"
        ;;
    8)
        backup_dir="/opt/futures-platform/backup/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $backup_dir
        docker exec futures-trading-mongodb mongodump --out $backup_dir/mongodb
        cp -r uploads $backup_dir/
        echo "备份完成: $backup_dir"
        ;;
    9)
        exit 0
        ;;
    *)
        echo "无效选择"
        ;;
esac
EOF

chmod +x manage.sh
echo -e "${GREEN}已创建管理脚本: ./manage.sh${NC}"

echo ""
echo -e "${GREEN}部署完成！使用 ./manage.sh 进行服务管理${NC}"
