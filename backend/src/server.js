const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/live-trading', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 路由
const authRoutes = require('./routes/auth');
const streamRoutes = require('./routes/stream');
const tradingRoutes = require('./routes/trading');
const chatRoutes = require('./routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/chat', chatRoutes);

// WebSocket 连接处理
const socketHandler = require('./websocket/socketHandler');
socketHandler(io);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '国际期货直播间运行正常' });
});

// 所有其他路由返回React应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`WebSocket 服务已启动`);
});
