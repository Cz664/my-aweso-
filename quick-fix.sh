#!/bin/bash

# 在线修复部署脚本
echo "正在从GitHub获取最新的修复文件..."

# 临时创建 docker-compose-noports.yml
cat > docker-compose-noports.yml << 'EOF'
version: '3.8'

services:
  # MongoDB数据库 - 使用内部端口，不对外暴露
  mongodb:
    image: mongo:5.0
    container_name: futures-trading-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: futures123456
      MONGO_INITDB_DATABASE: futures-trading
    # 只在容器内部使用27017端口，不映射到主机
    expose:
      - "27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - futures-network

  # Redis缓存 - 使用内部端口，不对外暴露  
  redis:
    image: redis:7-alpine
    container_name: futures-trading-redis
    restart: unless-stopped
    # 只在容器内部使用6379端口，不映射到主机
    expose:
      - "6379"
    volumes:
      - redis_data:/data
    networks:
      - futures-network

  # 主应用
  app:
    build: .
    container_name: futures-trading-app
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGODB_URI: mongodb://admin:futures123456@mongodb:27017/futures-trading?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: futures-trading-jwt-secret-key-2024
      JWT_EXPIRES_IN: 7d
      CORS_ORIGIN: http://193.57.33.111:3001
    depends_on:
      - mongodb
      - redis
    networks:
      - futures-network
    volumes:
      - ./uploads:/app/uploads

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: futures-trading-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - futures-network

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local

networks:
  futures-network:
    driver: bridge
EOF

echo "已创建 docker-compose-noports.yml 文件"

# 停止系统服务
echo "停止可能冲突的系统服务..."
systemctl stop mongod 2>/dev/null || true
systemctl disable mongod 2>/dev/null || true
systemctl stop mongodb 2>/dev/null || true
systemctl disable mongodb 2>/dev/null || true
systemctl stop redis 2>/dev/null || true
systemctl disable redis 2>/dev/null || true
systemctl stop redis-server 2>/dev/null || true
systemctl disable redis-server 2>/dev/null || true
pkill -f mongod || true
pkill -f redis-server || true

# 创建API路由文件修复脚本
echo "创建API路由修复文件..."
mkdir -p backend/src/routes

# 创建认证路由
cat > backend/src/routes/auth.js << 'AUTHEOF'
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 模拟用户数据
const users = [
  {
    id: 1,
    email: 'admin@futures-trading.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    name: '管理员'
  },
  {
    id: 2,
    email: 'streamer1@futures-trading.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'streamer',
    name: '主播一号'
  }
];

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'futures-trading-jwt-secret-key-2024',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 用户信息
router.get('/me', (req, res) => {
  res.json({ 
    message: '需要认证',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
AUTHEOF

# 创建直播流路由
cat > backend/src/routes/stream.js << 'STREAMEOF'
const express = require('express');
const router = express.Router();

router.get('/list', (req, res) => {
  res.json({
    status: 'success',
    streams: [
      { 
        id: 1, 
        name: '黄金期货分析', 
        status: 'live', 
        viewers: 156,
        streamer: '金融专家李老师'
      },
      { 
        id: 2, 
        name: '原油市场解读', 
        status: 'live', 
        viewers: 89,
        streamer: '期货大师王老师'
      }
    ]
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'success',
    stream: {
      id: parseInt(id),
      name: `直播间 ${id}`,
      status: 'live',
      viewers: Math.floor(Math.random() * 200) + 50
    }
  });
});

module.exports = router;
STREAMEOF

# 创建交易数据路由
cat > backend/src/routes/trading.js << 'TRADINGEOF'
const express = require('express');
const router = express.Router();

router.get('/data', (req, res) => {
  res.json({
    status: 'success',
    instruments: [
      { 
        symbol: 'GC', 
        name: '黄金',
        price: 1980.50, 
        change: +12.30,
        changePercent: '+0.63%'
      },
      { 
        symbol: 'CL', 
        name: '原油',
        price: 75.80, 
        change: -0.95,
        changePercent: '-1.24%'
      },
      { 
        symbol: 'SI', 
        name: '白银',
        price: 24.85, 
        change: +0.45,
        changePercent: '+1.84%'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

router.get('/positions', (req, res) => {
  res.json({
    status: 'success',
    positions: [],
    message: '暂无持仓'
  });
});

module.exports = router;
TRADINGEOF

# 创建聊天路由
cat > backend/src/routes/chat.js << 'CHATEOF'
const express = require('express');
const router = express.Router();

router.get('/messages', (req, res) => {
  res.json({ 
    status: 'success',
    messages: [
      {
        id: 1,
        user: '系统',
        message: '欢迎来到国际期货直播间！',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

router.post('/send', (req, res) => {
  const { message } = req.body;
  res.json({
    status: 'success',
    message: '消息发送成功',
    data: {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
CHATEOF

echo "✓ API路由文件已创建"

echo "启动服务..."
docker-compose -f docker-compose-noports.yml up --build -d

echo "等待服务启动..."
sleep 30

echo "检查服务状态..."
docker-compose -f docker-compose-noports.yml ps

echo "部署完成！"

# 等待应用完全启动
echo "等待应用完全启动..."
sleep 15

# 详细的API测试
echo "🧪 详细API测试..."
echo "----------------------------------------"

# 测试基础健康检查
echo "1. 测试健康检查 (GET /health):"
if curl -s -f http://localhost:3001/health > /dev/null; then
    echo "✓ 健康检查正常"
    curl -s http://localhost:3001/health | head -1
else
    echo "❌ 健康检查失败"
fi

# 测试API状态
echo "2. 测试API状态 (GET /api/status):"
if curl -s -f http://localhost:3001/api/status > /dev/null; then
    echo "✓ API状态正常"
    curl -s http://localhost:3001/api/status | head -1
else
    echo "❌ API状态检查失败"
fi

# 测试具体API路由
echo "3. 测试直播列表 (GET /api/stream/list):"
if curl -s -f http://localhost:3001/api/stream/list > /dev/null; then
    echo "✓ 直播列表API正常"
else
    echo "❌ 直播列表API失败"
fi

echo "4. 测试交易数据 (GET /api/trading/data):"
if curl -s -f http://localhost:3001/api/trading/data > /dev/null; then
    echo "✓ 交易数据API正常"
else
    echo "❌ 交易数据API失败"
fi

echo "5. 测试聊天消息 (GET /api/chat/messages):"
if curl -s -f http://localhost:3001/api/chat/messages > /dev/null; then
    echo "✓ 聊天消息API正常"
else
    echo "❌ 聊天消息API失败"
fi

# 如果API仍有问题，显示容器日志
echo "6. 检查容器日志..."
if ! curl -s -f http://localhost:3001/api/status > /dev/null; then
    echo "! API服务有问题，查看详细日志..."
    echo "========== 应用日志 =========="
    docker-compose -f docker-compose-noports.yml logs app | tail -20
    echo "========== Nginx日志 =========="
    docker-compose -f docker-compose-noports.yml logs nginx | tail -10
fi

echo "访问地址："
echo "  前端: http://193.57.33.111"
echo "  API: http://193.57.33.111:3001"
echo "  API状态: http://193.57.33.111:3001/api/status"
echo "  健康检查: http://193.57.33.111:3001/health"
echo "  管理后台: http://193.57.33.111/admin"
echo ""
echo "默认登录账号："
echo "  管理员: admin@futures-trading.com / password"
echo "  主播: streamer1@futures-trading.com / password"
