# 国际期货直播间 - 部署信息

## GitHub 仓库地址
```
https://github.com/futures-trading/futures-trading-platform.git
```

## 克隆仓库
```bash
git clone https://github.com/futures-trading/futures-trading-platform.git
cd futures-trading-platform
```

## 快速部署（Windows Server 2012 R2）

### 方法一：从GitHub克隆
1. 在服务器上安装Git
2. 克隆仓库：
   ```cmd
   git clone https://github.com/futures-trading/futures-trading-platform.git
   cd futures-trading-platform
   ```
3. 运行部署脚本：
   ```cmd
   windows-deploy.bat
   ```
4. 启动服务：
   ```cmd
   start.bat
   ```

### 方法二：使用压缩包
1. 下载 `futures-trading-platform-final.tar.gz`
2. 解压到服务器目录
3. 运行 `windows-deploy.bat`
4. 启动 `start.bat`

## 访问信息
- **服务器地址：** http://38.180.94.137:3001
- **管理员账号：** admin@futures-trading.com
- **管理员密码：** password
- **主播账号：** streamer1@futures-trading.com
- **主播密码：** password

## 技术支持
- 项目文档：[README.md](README.md)
- Windows部署：[WINDOWS_DEPLOYMENT.md](WINDOWS_DEPLOYMENT.md)
- 问题反馈：GitHub Issues

## 注意事项
⚠️ **安全提醒：**
1. 首次登录后请立即修改默认密码
2. 确保服务器防火墙配置正确
3. 定期备份数据库和上传文件
4. 生产环境请使用HTTPS

## 更新代码
```bash
git pull origin main
windows-deploy.bat
start.bat
