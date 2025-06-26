# Windows Server 部署说明

## 准备工作

1. 安装必要的软件：
   - Node.js 16+ (https://nodejs.org/)
   - MongoDB 6.0+ (https://www.mongodb.com/try/download/community)
   - Git (可选，用于版本控制)

2. 解压部署包：
   - 右键 `futures-trading-platform-windows.tar.gz`
   - 选择"解压到当前文件夹"
   - 进入解压后的目录

## 部署步骤

1. 启动 MongoDB：
   - 打开命令提示符（以管理员身份运行）
   - 运行：`net start MongoDB`
   - 确认 MongoDB 运行在默认端口 27017

2. 运行部署脚本：
   - 双击 `windows-deploy.bat`
   - 等待安装完成
   - 如果出现错误，请查看错误信息并解决

3. 启动应用：
   - 进入 backend 目录
   - 运行：`npm start`
   - 应用将在 http://38.180.94.137:3001 上运行

## 默认账号

管理员账号：
- 邮箱：admin@futures-trading.com
- 密码：password

主播账号：
- 邮箱：streamer1@futures-trading.com
- 密码：password

## 目录结构

```
futures-trading-platform/
├── backend/           # 后端服务
├── frontend/          # 前端代码
├── uploads/           # 上传文件目录
├── logs/             # 日志目录
└── windows-deploy.bat # Windows部署脚本
```

## 常见问题

1. 如果端口 3001 被占用：
   - 打开 backend/.env 文件
   - 修改 PORT=3001 为其他可用端口
   - 重新启动应用

2. 如果 MongoDB 连接失败：
   - 确认 MongoDB 服务是否正在运行
   - 检查 backend/.env 中的 MONGODB_URI 配置
   - 确保防火墙允许 MongoDB 端口

3. 如果前端无法访问：
   - 检查 backend/.env 中的 CORS_ORIGIN 配置
   - 确保 IP 地址和端口配置正确
   - 检查 Windows 防火墙设置

## 维护命令

```batch
REM 启动应用
cd backend
npm start

REM 停止应用
Ctrl + C

REM 查看日志
cd logs
type application.log

REM 重启 MongoDB
net stop MongoDB
net start MongoDB
```

## 安全建议

1. 修改默认密码：
   - 登录管理员账号
   - 进入个人设置
   - 修改密码

2. 配置防火墙：
   - 只开放必要端口（3001, 27017）
   - 限制访问IP

3. 定期备份：
   - 备份 MongoDB 数据
   - 备份上传的文件

## 技术支持

如遇到问题，请查看：
1. 应用日志（logs/application.log）
2. MongoDB日志
3. Windows事件查看器

需要帮助请联系管理员。
