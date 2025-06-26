# Windows服务器部署指南

## 前置要求

### 1. 安装Docker Desktop for Windows
- 下载地址：https://www.docker.com/products/docker-desktop
- 系统要求：Windows 10/11 Pro或Enterprise版本
- 启用WSL2（推荐）或Hyper-V

### 2. 安装Git for Windows（可选）
- 下载地址：https://git-scm.com/download/win
- 提供Git Bash环境，支持Linux命令

### 3. 安装OpenSSH客户端（远程部署需要）
- Windows 10/11：设置 > 应用 > 可选功能 > 添加功能 > OpenSSH客户端

## 部署方式

### 方式一：本地部署（在Windows服务器上直接操作）

1. **克隆项目**
   ```cmd
   git clone https://github.com/Cz664/my-aweso-.git
   cd my-aweso-
   ```

2. **运行部署脚本**
   ```cmd
   deploy-windows.bat
   ```

3. **访问应用**
   - 前端：http://localhost:3000
   - 后端API：http://localhost:3001
   - 管理后台：http://localhost:3000/admin

### 方式二：远程部署（从本地推送到Windows服务器）

1. **在本地运行远程部署脚本**
   ```cmd
   remote-deploy-windows.bat
   ```

2. **按提示完成上传和部署**

## 服务器配置

### 端口配置
- 80: Nginx HTTP
- 443: Nginx HTTPS（需要SSL证书）
- 3001: Node.js应用
- 27017: MongoDB
- 6379: Redis

### 防火墙设置
确保以下端口对外开放：
- 80 (HTTP)
- 443 (HTTPS)
- 3001 (应用端口)

### SSL证书配置（可选）
1. 将SSL证书文件放在 `ssl/` 目录下
2. 修改 `nginx.conf` 配置文件
3. 重启Nginx容器

## 常见问题

### 1. Docker Desktop未启动
错误：`docker: command not found`
解决：启动Docker Desktop应用程序

### 2. 端口被占用
错误：`port already in use`
解决：
```cmd
# 查看端口占用
netstat -ano | findstr :3001
# 结束占用进程
taskkill /PID <进程ID> /F
```

### 3. 权限问题
错误：`access denied`
解决：以管理员身份运行命令提示符

### 4. 容器启动失败
查看日志：
```cmd
docker-compose logs app
docker-compose logs mongodb
docker-compose logs redis
```

## 维护命令

### 查看服务状态
```cmd
docker-compose ps
```

### 查看日志
```cmd
docker-compose logs -f app
```

### 重启服务
```cmd
docker-compose restart
```

### 停止服务
```cmd
docker-compose down
```

### 更新部署
```cmd
git pull
docker-compose down
docker-compose up --build -d
```

### 备份数据
```cmd
# 备份MongoDB
docker exec futures-trading-mongodb mongodump --out /backup

# 备份上传文件
xcopy uploads backup\uploads /E /I
```

## 性能优化

### 1. 系统资源
- 推荐内存：4GB以上
- 推荐CPU：2核以上
- 推荐存储：50GB以上

### 2. Docker配置
在Docker Desktop中调整资源分配：
- Memory: 2GB以上
- Swap: 1GB以上
- Disk: 根据需要调整

### 3. 数据库优化
- 定期清理日志文件
- 监控数据库性能
- 配置适当的索引

## 安全建议

1. **修改默认密码**
   - MongoDB管理员密码
   - JWT密钥
   - 应用管理员密码

2. **使用HTTPS**
   - 配置SSL证书
   - 强制HTTPS访问

3. **防火墙配置**
   - 只开放必要端口
   - 配置IP白名单

4. **定期更新**
   - 更新Docker镜像
   - 更新应用代码
   - 更新系统补丁
