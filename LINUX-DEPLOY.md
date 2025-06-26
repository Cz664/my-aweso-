# Linux服务器部署指南

## 🚀 快速部署（推荐）

### ⚠️ 重要提醒
**一键部署命令只能在Linux服务器上运行，不要在macOS上执行！**

### 一键部署命令
**请在Linux服务器上**运行以下命令即可完成部署：

```bash
curl -fsSL https://raw.githubusercontent.com/Cz664/my-aweso-/main/quick-deploy.sh | sudo bash
```

## 📋 详细部署方式

### 方式一：本地部署（在Linux服务器上操作）

1. **克隆项目**
   ```bash
   git clone https://github.com/Cz664/my-aweso-.git
   cd my-aweso-
   ```

2. **运行部署脚本**
   ```bash
   sudo ./deploy-linux.sh
   ```

### 方式二：远程部署（从macOS/Linux推送到服务器）

**适用于从macOS/本地Linux推送到远程Linux服务器**

1. **在本地运行远程部署脚本**
   ```bash
   ./remote-deploy-linux.sh
   ```

2. **按提示完成部署**

### 方式三：手动部署

1. **安装依赖**
   ```bash
   # CentOS/RHEL
   sudo yum update -y
   sudo yum install -y curl wget git unzip
   
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl wget git unzip
   ```

2. **安装Docker**
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **安装Docker Compose**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **部署应用**
   ```bash
   sudo mkdir -p /opt/futures-platform
   cd /opt/futures-platform
   
   # 上传项目文件或克隆
   git clone https://github.com/Cz664/my-aweso-.git .
   
   # 启动服务
   sudo docker-compose up --build -d
   ```

## 🔧 系统要求

### 硬件要求
- **CPU**: 2核以上
- **内存**: 4GB以上
- **存储**: 20GB以上可用空间
- **网络**: 稳定的互联网连接

### 支持的操作系统
- CentOS 7/8/9
- Ubuntu 18.04/20.04/22.04
- Debian 9/10/11
- Red Hat Enterprise Linux 7/8/9
- Amazon Linux 2

### 必需的软件
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git 2.0+

## 🌐 网络配置

### 防火墙端口
确保以下端口对外开放：

```bash
# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# Ubuntu/Debian (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw reload

# 或者使用iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

### SELinux配置（CentOS/RHEL）
如果启用了SELinux，可能需要配置：

```bash
# 临时禁用
sudo setenforce 0

# 永久禁用（重启后生效）
sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
```

## 📱 访问地址

部署成功后的访问地址：
- **前端页面**: http://服务器IP
- **API接口**: http://服务器IP:3001
- **管理后台**: http://服务器IP/admin

### 默认账号
- **管理员**: admin@futures-trading.com / password
- **主播**: streamer1@futures-trading.com / password

## 🛠️ 服务管理

### 使用管理脚本
```bash
cd /opt/futures-platform
./manage.sh
```

### 常用Docker命令
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f redis

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 启动服务
docker-compose up -d

# 重新构建
docker-compose up --build -d
```

### 系统服务管理
```bash
# 查看Docker状态
sudo systemctl status docker

# 重启Docker
sudo systemctl restart docker

# 查看系统资源
htop
df -h
free -h
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   sudo netstat -tuln | grep :80
   sudo ss -tuln | grep :80
   
   # 查看进程
   sudo lsof -i :80
   ```

2. **Docker服务未启动**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **权限问题**
   ```bash
   # 添加用户到docker组
   sudo usermod -aG docker $USER
   # 重新登录或
   newgrp docker
   ```

4. **内存不足**
   ```bash
   # 查看内存使用
   free -h
   
   # 清理Docker缓存
   docker system prune -f
   docker volume prune -f
   ```

5. **磁盘空间不足**
   ```bash
   # 查看磁盘使用
   df -h
   
   # 清理Docker
   docker system prune -a -f
   ```

### 日志查看
```bash
# 应用日志
docker-compose logs -f app

# 系统日志
sudo journalctl -u docker.service
sudo tail -f /var/log/messages

# Nginx日志
docker-compose exec nginx tail -f /var/log/nginx/access.log
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

## 🔒 安全配置

### 1. 修改默认密码
登录后立即修改：
- 应用管理员密码
- MongoDB密码
- JWT密钥

### 2. 配置SSL证书
```bash
# 将证书文件放到ssl目录
sudo mkdir -p /opt/futures-platform/ssl
sudo cp your-cert.pem /opt/futures-platform/ssl/
sudo cp your-key.pem /opt/futures-platform/ssl/

# 修改nginx配置
sudo nano /opt/futures-platform/nginx.conf
```

### 3. 定期备份
```bash
# 使用管理脚本备份
./manage.sh  # 选择备份选项

# 手动备份
backup_dir="/opt/futures-platform/backup/$(date +%Y%m%d_%H%M%S)"
sudo mkdir -p $backup_dir
sudo docker exec futures-trading-mongodb mongodump --out $backup_dir/mongodb
sudo cp -r /opt/futures-platform/uploads $backup_dir/
```

## 📈 性能优化

### 1. 系统优化
```bash
# 增加文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化内核参数
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. Docker优化
```bash
# 配置Docker日志轮转
sudo tee /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker
```

### 3. 监控设置
```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs  # Ubuntu/Debian
sudo yum install -y htop iotop  # CentOS/RHEL

# 设置定时清理
echo "0 2 * * * docker system prune -f" | sudo crontab -
```

## 🆙 更新部署

### 自动更新
```bash
cd /opt/futures-platform
git pull
./manage.sh  # 选择更新部署
```

### 手动更新
```bash
cd /opt/futures-platform
git pull
sudo docker-compose down
sudo docker-compose up --build -d
```

## ☎️ 技术支持

如遇问题，请检查：
1. 系统日志：`sudo journalctl -xe`
2. Docker日志：`docker-compose logs`
3. 应用日志：`docker-compose logs app`
4. 网络连接：`curl -I http://localhost:3001`

或创建GitHub Issue寻求帮助。
