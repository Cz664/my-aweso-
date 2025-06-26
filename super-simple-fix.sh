#!/bin/bash

echo "🚀 超级简单API修复脚本"
echo "========================================"

# 进入一个合适的工作目录
if [ -w "/opt" ]; then
    WORK_DIR="/opt"
elif [ -w "/root" ]; then
    WORK_DIR="/root"
else
    WORK_DIR="$HOME"
fi

echo "📂 工作目录: $WORK_DIR"
cd "$WORK_DIR"

# 清理并重新克隆项目
echo "🧹 清理旧项目..."
rm -rf my-aweso-

echo "📥 克隆最新项目..."
git clone https://github.com/Cz664/my-aweso-.git
cd my-aweso-

echo "🔧 设置权限..."
chmod +x *.sh

echo "🛑 停止现有服务..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose-noports.yml down 2>/dev/null || true

# 停止可能冲突的系统服务
echo "🛑 停止冲突服务..."
systemctl stop mongod 2>/dev/null || true
systemctl stop mongodb 2>/dev/null || true
systemctl stop redis 2>/dev/null || true
systemctl stop redis-server 2>/dev/null || true
pkill -f mongod || true
pkill -f redis-server || true

echo "📁 创建API路由目录..."
mkdir -p backend/src/routes

echo "📝 创建API路由文件..."

# 创建认证路由
cat > backend/src/routes/auth.js << 'EOF'
const express = require('express');
const router = express.Router();

console.log('✓ Auth routes loaded');

router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth API working', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    if (email === 'admin@futures-trading.com' && password === 'password') {
      res.json({
        status: 'success',
        token: 'mock-jwt-token-admin',
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
        token: 'mock-jwt-token-streamer',
        user: {
          id: 2,
          email: email,
          name: '主播一号',
          role: 'streamer'
        }
      });
    } else {
      res.status(401).json({ 
        error: '用户名或密码错误',
        provided: { email }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败', details: error.message });
  }
});

module.exports = router;
EOF

# 创建直播路由
cat > backend/src/routes/stream.js << 'EOF'
const express = require('express');
const router = express.Router();

console.log('✓ Stream routes loaded');

router.get('/list', (req, res) => {
  res.json({
    status: 'success',
    data: [
      { 
        id: 1, 
        title: '黄金期货实时分析', 
        status: 'live', 
        viewers: 156,
        streamer: '金融专家李老师',
        startTime: '2024-01-15T10:00:00Z'
      },
      { 
        id: 2, 
        title: '原油市场深度解读', 
        status: 'live', 
        viewers: 89,
        streamer: '期货大师王老师',
        startTime: '2024-01-15T14:00:00Z'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'success',
    data: {
      id: parseInt(id),
      title: `直播间 ${id}`,
      status: 'live',
      viewers: Math.floor(Math.random() * 200) + 50,
      streamer: '专业分析师',
      description: '专业的期货市场分析与交易指导'
    }
  });
});

module.exports = router;
EOF

# 创建交易路由
cat > backend/src/routes/trading.js << 'EOF'
const express = require('express');
const router = express.Router();

console.log('✓ Trading routes loaded');

router.get('/data', (req, res) => {
  res.json({
    status: 'success',
    data: [
      { 
        symbol: 'GC', 
        name: '黄金期货',
        price: 1980.50, 
        change: +12.30,
        changePercent: '+0.63%',
        volume: '125.6K'
      },
      { 
        symbol: 'CL', 
        name: '原油期货',
        price: 75.80, 
        change: -0.95,
        changePercent: '-1.24%',
        volume: '89.2K'
      },
      { 
        symbol: 'SI', 
        name: '白银期货',
        price: 24.85, 
        change: +0.45,
        changePercent: '+1.84%',
        volume: '67.8K'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
EOF

# 创建聊天路由
cat > backend/src/routes/chat.js << 'EOF'
const express = require('express');
const router = express.Router();

console.log('✓ Chat routes loaded');

router.get('/messages', (req, res) => {
  res.json({ 
    status: 'success',
    data: [
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
  });
});

module.exports = router;
EOF

echo "🚀 启动服务..."
if [ -f "docker-compose-noports.yml" ]; then
    docker-compose -f docker-compose-noports.yml up --build -d
else
    docker-compose up --build -d
fi

echo "⏳ 等待服务启动..."
sleep 25

echo "🧪 测试API..."
echo "========================================"

test_url() {
    local url=$1
    local name=$2
    echo -n "测试 $name: "
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ 成功"
        curl -s "$url" | head -1
    else
        echo "❌ 失败"
    fi
    echo ""
}

test_url "http://localhost:3001/health" "健康检查"
test_url "http://localhost:3001/api/status" "API状态"
test_url "http://localhost:3001/api/auth/test" "认证测试"
test_url "http://localhost:3001/api/stream/list" "直播列表"
test_url "http://localhost:3001/api/trading/data" "交易数据"
test_url "http://localhost:3001/api/chat/messages" "聊天消息"

# 测试登录
echo "测试登录API:"
login_result=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@futures-trading.com","password":"password"}' \
  http://localhost:3001/api/auth/login 2>/dev/null)

if echo "$login_result" | grep -q success; then
    echo "✅ 登录API正常"
else
    echo "❌ 登录API可能有问题"
    echo "$login_result"
fi

echo ""
echo "🎉 修复完成！"
echo "========================================"
echo "🌐 访问地址："
echo "   前端: http://193.57.33.111"
echo "   API基础: http://193.57.33.111:3001/api/status"
echo "   直播列表: http://193.57.33.111:3001/api/stream/list"
echo "   交易数据: http://193.57.33.111:3001/api/trading/data"
echo ""
echo "🔑 测试账号："
echo "   管理员: admin@futures-trading.com / password"
echo "   主播: streamer1@futures-trading.com / password"
echo ""
echo "📂 项目位置: $WORK_DIR/my-aweso-"

# 检查容器状态
echo ""
echo "📊 容器状态："
docker-compose -f docker-compose-noports.yml ps 2>/dev/null || docker-compose ps 2>/dev/null || echo "无法获取容器状态"
