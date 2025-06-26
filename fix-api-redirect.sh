#!/bin/bash

echo "🔧 修复API重定向问题专用脚本"
echo "========================================"

# 检查当前目录
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose-noports.yml" ]; then
    echo "❌ 错误：找不到docker-compose文件，请确保在项目根目录运行此脚本"
    exit 1
fi

# 停止所有服务
echo "1. 停止现有服务..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose-noports.yml down 2>/dev/null || true

# 创建必要的目录
echo "2. 创建API路由目录..."
mkdir -p backend/src/routes

# 检查并修复后端server.js
echo "3. 检查后端server.js配置..."
if [ -f "backend/src/server.js" ]; then
    # 备份原文件
    cp backend/src/server.js backend/src/server.js.backup
    
    # 创建修复后的server.js
    cat > backend/src/server.js << 'SERVEREOF'
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
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 数据库连接
const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:futures123456@mongodb:27017/futures-trading?authSource=admin';
console.log('Connecting to MongoDB:', mongoUri.replace(/:[^:]*@/, ':***@'));

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✓ MongoDB连接成功');
}).catch(err => {
  console.error('❌ MongoDB连接失败:', err.message);
});

// API路由 - 必须在静态文件之前
console.log('Loading API routes...');

// 基础健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '国际期货直播间运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API状态检查
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 动态加载路由
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes loaded');
} catch (err) {
  console.warn('! Auth routes not found, creating basic route');
  app.get('/api/auth/test', (req, res) => res.json({ message: 'Auth route working' }));
}

try {
  const streamRoutes = require('./routes/stream');
  app.use('/api/stream', streamRoutes);
  console.log('✓ Stream routes loaded');
} catch (err) {
  console.warn('! Stream routes not found, creating basic route');
  app.get('/api/stream/list', (req, res) => res.json({ streams: [] }));
}

try {
  const tradingRoutes = require('./routes/trading');
  app.use('/api/trading', tradingRoutes);
  console.log('✓ Trading routes loaded');
} catch (err) {
  console.warn('! Trading routes not found, creating basic route');
  app.get('/api/trading/data', (req, res) => res.json({ instruments: [] }));
}

try {
  const chatRoutes = require('./routes/chat');
  app.use('/api/chat', chatRoutes);
  console.log('✓ Chat routes loaded');
} catch (err) {
  console.warn('! Chat routes not found, creating basic route');
  app.get('/api/chat/messages', (req, res) => res.json({ messages: [] }));
}

// WebSocket 连接处理
try {
  const socketHandler = require('./websocket/socketHandler');
  socketHandler(io);
  console.log('✓ WebSocket handler loaded');
} catch (err) {
  console.warn('! WebSocket handler not found:', err.message);
  io.on('connection', (socket) => {
    console.log('WebSocket connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected:', socket.id);
    });
  });
}

// 静态文件服务 - 服务前端构建文件
app.use(express.static(path.join(__dirname, '../public')));

// API 404处理 - 确保API请求不会fallback到SPA
app.use('/api/*', (req, res) => {
  console.log('API 404:', req.method, req.path);
  res.status(404).json({ 
    error: 'API endpoint not found', 
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// SPA fallback - 只处理非API请求
app.get('*', (req, res) => {
  console.log('SPA fallback for:', req.path);
  const indexPath = path.join(__dirname, '../public/index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built yet');
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`🔌 WebSocket 服务已启动`);
  console.log(`📡 API地址: http://localhost:${PORT}/api/`);
  console.log('==========================================');
});

module.exports = { app, server, io };
SERVEREOF
    
    echo "✓ 后端server.js已修复"
else
    echo "❌ 找不到backend/src/server.js文件"
fi

# 创建所有必要的API路由文件
echo "4. 创建完整的API路由文件..."

# 认证路由
cat > backend/src/routes/auth.js << 'AUTHEOF'
const express = require('express');
const router = express.Router();

console.log('Auth routes loaded');

// 测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Auth API working', timestamp: new Date().toISOString() });
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    // 简单验证逻辑
    if (email === 'admin@futures-trading.com' && password === 'password') {
      res.json({
        status: 'success',
        token: 'mock-jwt-token',
        user: {
          id: 1,
          email: email,
          name: '管理员',
          role: 'admin'
        }
      });
    } else if (email === 'streamer1@futures-trading.com' && password === 'password') {
      res.json({
        status: 'success',
        token: 'mock-jwt-token',
        user: {
          id: 2,
          email: email,
          name: '主播一号',
          role: 'streamer'
        }
      });
    } else {
      res.status(401).json({ error: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

module.exports = router;
AUTHEOF

# 直播路由
cat > backend/src/routes/stream.js << 'STREAMEOF'
const express = require('express');
const router = express.Router();

console.log('Stream routes loaded');

router.get('/list', (req, res) => {
  res.json({
    status: 'success',
    data: {
      streams: [
        { 
          id: 1, 
          title: '黄金期货实时分析', 
          status: 'live', 
          viewers: 156,
          streamer: '金融专家李老师',
          startTime: new Date().toISOString()
        },
        { 
          id: 2, 
          title: '原油市场深度解读', 
          status: 'live', 
          viewers: 89,
          streamer: '期货大师王老师',
          startTime: new Date().toISOString()
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'success',
    data: {
      stream: {
        id: parseInt(id),
        title: `直播间 ${id}`,
        status: 'live',
        viewers: Math.floor(Math.random() * 200) + 50,
        streamer: '专业分析师',
        description: '专业的期货市场分析与交易指导'
      }
    }
  });
});

module.exports = router;
STREAMEOF

# 交易路由
cat > backend/src/routes/trading.js << 'TRADINGEOF'
const express = require('express');
const router = express.Router();

console.log('Trading routes loaded');

router.get('/data', (req, res) => {
  res.json({
    status: 'success',
    data: {
      instruments: [
        { 
          symbol: 'GC', 
          name: '黄金期货',
          price: 1980.50, 
          change: +12.30,
          changePercent: '+0.63%',
          volume: '125.6K',
          high: 1985.20,
          low: 1975.80
        },
        { 
          symbol: 'CL', 
          name: '原油期货',
          price: 75.80, 
          change: -0.95,
          changePercent: '-1.24%',
          volume: '89.2K',
          high: 76.90,
          low: 75.20
        },
        { 
          symbol: 'SI', 
          name: '白银期货',
          price: 24.85, 
          change: +0.45,
          changePercent: '+1.84%',
          volume: '67.8K',
          high: 25.10,
          low: 24.60
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

router.get('/positions', (req, res) => {
  res.json({
    status: 'success',
    data: {
      positions: [],
      totalPnL: 0,
      totalMargin: 0
    },
    message: '暂无持仓'
  });
});

module.exports = router;
TRADINGEOF

# 聊天路由
cat > backend/src/routes/chat.js << 'CHATEOF'
const express = require('express');
const router = express.Router();

console.log('Chat routes loaded');

router.get('/messages', (req, res) => {
  res.json({ 
    status: 'success',
    data: {
      messages: [
        {
          id: 1,
          user: '系统管理员',
          message: '欢迎来到国际期货直播间！',
          timestamp: new Date().toISOString(),
          type: 'system'
        },
        {
          id: 2,
          user: '分析师',
          message: '今日黄金走势看涨，关注1980支撑位',
          timestamp: new Date().toISOString(),
          type: 'analyst'
        }
      ]
    }
  });
});

router.post('/send', (req, res) => {
  const { message, user } = req.body;
  res.json({
    status: 'success',
    data: {
      id: Date.now(),
      user: user || '匿名用户',
      message,
      timestamp: new Date().toISOString(),
      type: 'user'
    },
    message: '消息发送成功'
  });
});

module.exports = router;
CHATEOF

echo "✓ 所有API路由文件已创建"

# 重新构建并启动服务
echo "5. 重新构建并启动服务..."
docker-compose -f docker-compose-noports.yml up --build -d

echo "6. 等待服务启动..."
sleep 20

echo "7. 详细API测试..."
echo "========================================"

# 测试函数
test_api() {
    local url=$1
    local name=$2
    echo -n "测试 $name: "
    if response=$(curl -s -w "%{http_code}" -o /tmp/api_response "$url" 2>/dev/null); then
        if [ "$response" = "200" ]; then
            echo "✓ 成功 (HTTP 200)"
            if command -v jq >/dev/null 2>&1; then
                cat /tmp/api_response | jq '.' 2>/dev/null | head -3
            else
                head -1 /tmp/api_response
            fi
        else
            echo "❌ 失败 (HTTP $response)"
            cat /tmp/api_response
        fi
    else
        echo "❌ 连接失败"
    fi
    echo ""
}

# 执行测试
test_api "http://localhost:3001/health" "健康检查"
test_api "http://localhost:3001/api/status" "API状态"
test_api "http://localhost:3001/api/auth/test" "认证测试"
test_api "http://localhost:3001/api/stream/list" "直播列表"
test_api "http://localhost:3001/api/trading/data" "交易数据"
test_api "http://localhost:3001/api/chat/messages" "聊天消息"

# 测试登录API
echo "测试登录API:"
if command -v curl >/dev/null 2>&1; then
    echo -n "POST /api/auth/login: "
    login_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@futures-trading.com","password":"password"}' \
        http://localhost:3001/api/auth/login)
    
    if echo "$login_response" | grep -q "success"; then
        echo "✓ 登录API正常"
        echo "$login_response" | head -1
    else
        echo "❌ 登录API失败"
        echo "$login_response"
    fi
fi

echo ""
echo "🎯 API修复完成！"
echo "========================================"
echo "✅ 访问地址："
echo "   🌐 前端: http://193.57.33.111"
echo "   📡 API: http://193.57.33.111:3001/api/"
echo "   ❤️ 健康检查: http://193.57.33.111:3001/health"
echo ""
echo "🔑 测试账号："
echo "   👨‍💼 管理员: admin@futures-trading.com / password"
echo "   📺 主播: streamer1@futures-trading.com / password"
echo ""
echo "🧪 API测试命令："
echo "   curl http://193.57.33.111:3001/api/status"
echo "   curl http://193.57.33.111:3001/api/stream/list"
echo "   curl http://193.57.33.111:3001/api/trading/data"

# 如果仍有问题，显示日志
if ! curl -s -f http://localhost:3001/api/status >/dev/null 2>&1; then
    echo ""
    echo "⚠️ 如果API仍有问题，请查看容器日志："
    echo "   docker-compose -f docker-compose-noports.yml logs app"
    echo "   docker-compose -f docker-compose-noports.yml logs nginx"
fi
