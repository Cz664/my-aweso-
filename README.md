# 国际期货直播间

实时期货交易信号分享平台，支持直播、实时喊单和互动聊天功能。

## 项目概述

这是一个完整的期货直播间平台，包含以下功能：
- 🎥 实时期货行情直播
- 📈 期货交易信号发布（喊单）
- 💬 实时互动聊天
- 👥 用户管理系统
- 🎛️ 主播管理后台
- ⚡ WebSocket实时通信
- 📱 移动端适配

## 技术栈

### 前端
- React 18
- Material-UI 5
- Socket.IO Client
- React Router
- Axios
- Moment.js

### 后端
- Node.js
- Express.js
- Socket.IO
- MongoDB
- JWT认证
- Mongoose

### 部署
- Docker
- Nginx
- MongoDB

## 快速开始

### 本地开发

1. 克隆项目：
```bash
git clone https://github.com/your-username/futures-trading-platform.git
cd futures-trading-platform
```

2. 安装后端依赖：
```bash
cd backend
npm install
```

3. 安装前端依赖：
```bash
cd ../frontend
npm install
```

4. 启动MongoDB（确保MongoDB在本地运行）

5. 启动后端服务：
```bash
cd backend
npm run dev
```

6. 启动前端服务：
```bash
cd frontend
npm start
```

### Windows Server 部署

1. 下载并解压项目文件
2. 双击运行 `windows-deploy.bat`
3. 运行 `start.bat` 启动服务
4. 访问 http://your-server-ip:3001

详细部署说明请查看 [WINDOWS_DEPLOYMENT.md](WINDOWS_DEPLOYMENT.md)

### Docker 部署

```bash
docker-compose up -d
```

## 默认账号

**管理员账号：**
- 邮箱：admin@futures-trading.com
- 密码：password

**主播账号：**
- 邮箱：streamer1@futures-trading.com
- 密码：password

## 功能特性

### 🎥 直播功能
- 支持OBS推流
- 实时观看人数统计
- 直播间状态管理

### 📈 交易喊单
- 实时发布交易信号
- 支持买入/卖出建议
- 目标价和止损价设置
- 盈亏统计和进度显示

### 💬 实时聊天
- WebSocket实时通信
- 消息回复功能
- 用户角色标识
- 聊天记录保存

### 👥 用户管理
- 用户注册和登录
- 角色权限管理
- 个人资料设置

### 🎛️ 管理后台
- 直播间管理
- 用户管理
- 交易信号管理
- 数据统计

## API 文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息

### 直播接口
- `GET /api/stream/rooms` - 获取直播间列表
- `POST /api/stream/create` - 创建直播间
- `PUT /api/stream/:id` - 更新直播间信息

### 交易接口
- `GET /api/trading/calls` - 获取交易信号
- `POST /api/trading/calls` - 发布交易信号
- `PUT /api/trading/calls/:id` - 更新交易信号

### 聊天接口
- `GET /api/chat/messages` - 获取聊天记录
- `POST /api/chat/messages` - 发送消息

## WebSocket 事件

### 客户端发送
- `authenticate` - 用户认证
- `joinRoom` - 加入直播间
- `leaveRoom` - 离开直播间
- `chatMessage` - 发送聊天消息
- `tradingCall` - 发布交易信号

### 服务端推送
- `authenticated` - 认证结果
- `newMessage` - 新聊天消息
- `newTradingCall` - 新交易信号
- `userJoined` - 用户加入
- `userLeft` - 用户离开
- `onlineUsers` - 在线用户数

## 目录结构

```
futures-trading-platform/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # API路由
│   │   ├── websocket/         # WebSocket处理
│   │   ├── utils/             # 工具函数
│   │   └── server.js          # 服务器入口
│   └── package.json
├── frontend/                   # 前端应用
│   ├── public/
│   ├── src/
│   │   ├── components/        # React组件
│   │   ├── contexts/          # 上下文
│   │   ├── pages/            # 页面组件
│   │   └── App.js
│   └── package.json
├── docker-compose.yml         # Docker编排
├── Dockerfile                 # Docker构建
├── nginx.conf                # Nginx配置
├── mongo-init.js             # MongoDB初始化
├── windows-deploy.bat        # Windows部署脚本
├── start.bat                 # Windows启动脚本
└── README.md
```

## 环境变量

创建 `backend/.env` 文件：

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/futures-trading
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://your-domain.com
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 支持

如有问题或建议，请：
1. 查看 [Issues](https://github.com/your-username/futures-trading-platform/issues)
2. 创建新的 Issue
3. 联系项目维护者

## 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 基础直播功能
- 交易信号系统
- 实时聊天功能
- 用户管理系统

---

**注意：** 请在生产环境中修改默认密码和JWT密钥！
