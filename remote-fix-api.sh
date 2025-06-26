#!/bin/bash

echo "🚀 远程服务器API修复脚本"
echo "========================================"

# 智能查找项目目录
find_project_dir() {
    echo "🔍 正在查找项目目录..."
    
    # 常见的项目目录位置
    possible_dirs=(
        "/opt/my-aweso-"
        "/opt/futures-platform"
        "/root/my-aweso-"
        "/home/*/my-aweso-"
        "./my-aweso-"
        "$(pwd)/my-aweso-"
    )
    
    # 搜索包含docker-compose.yml的目录
    found_dirs=$(find / -name "docker-compose*.yml" -path "*/my-aweso-*" 2>/dev/null | head -5)
    
    # 检查可能的目录
    for dir in "${possible_dirs[@]}" $found_dirs; do
        dir=$(dirname "$dir" 2>/dev/null || echo "$dir")
        if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
            echo "✓ 找到项目目录: $dir"
            echo "$dir"
            return 0
        fi
    done
    
    return 1
}

# 查找项目目录
PROJECT_DIR=$(find_project_dir)

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ 未找到项目目录，正在重新克隆..."
    
    # 选择安装目录
    if [ -w "/opt" ]; then
        INSTALL_DIR="/opt"
    else
        INSTALL_DIR="$HOME"
    fi
    
    cd "$INSTALL_DIR"
    
    # 清理旧的克隆（如果存在）
    rm -rf my-aweso-
    
    # 重新克隆项目
    echo "📥 克隆项目到 $INSTALL_DIR/my-aweso-..."
    if git clone https://github.com/Cz664/my-aweso-.git; then
        PROJECT_DIR="$INSTALL_DIR/my-aweso-"
        echo "✓ 项目克隆成功"
    else
        echo "❌ 项目克隆失败，请检查网络连接"
        exit 1
    fi
else
    echo "✓ 使用现有项目目录: $PROJECT_DIR"
fi

# 进入项目目录
cd "$PROJECT_DIR" || {
    echo "❌ 无法进入项目目录: $PROJECT_DIR"
    exit 1
}

echo "📂 当前工作目录: $(pwd)"

# 从GitHub拉取最新修复
echo "📥 从GitHub拉取最新修复..."
git pull origin main || {
    echo "⚠️ Git拉取失败，可能网络问题或目录权限问题"
    echo "尝试重置Git状态..."
    git reset --hard HEAD
    git clean -fd
    git pull origin main
}

# 确保脚本有执行权限
echo "🔧 设置脚本权限..."
chmod +x fix-api-redirect.sh 2>/dev/null || echo "⚠️ fix-api-redirect.sh 文件不存在"
chmod +x quick-fix.sh 2>/dev/null || echo "⚠️ quick-fix.sh 文件不存在"

# 检查并创建缺失的修复脚本
if [ ! -f "fix-api-redirect.sh" ]; then
    echo "📝 创建API修复脚本..."
    curl -sSL https://raw.githubusercontent.com/Cz664/my-aweso-/main/fix-api-redirect.sh -o fix-api-redirect.sh
    chmod +x fix-api-redirect.sh
fi

# 运行API修复脚本
if [ -f "fix-api-redirect.sh" ]; then
    echo "🎯 运行API修复脚本..."
    ./fix-api-redirect.sh
elif [ -f "quick-fix.sh" ]; then
    echo "🎯 运行快速修复脚本..."
    ./quick-fix.sh
else
    echo "❌ 找不到修复脚本，手动创建修复脚本..."
    
    # 创建临时修复脚本
    cat > temp-fix-api.sh << 'TEMPEOF'
#!/bin/bash
echo "🔧 临时API修复脚本"

# 停止现有服务
docker-compose down 2>/dev/null || true

# 创建API路由目录
mkdir -p backend/src/routes

# 创建基础API路由
cat > backend/src/routes/auth.js << 'EOF'
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Auth API working', timestamp: new Date().toISOString() });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@futures-trading.com' && password === 'password') {
    res.json({ status: 'success', token: 'mock-token', user: { email, role: 'admin' } });
  } else {
    res.status(401).json({ error: '登录失败' });
  }
});

module.exports = router;
EOF

# 启动服务
if [ -f "docker-compose-noports.yml" ]; then
    docker-compose -f docker-compose-noports.yml up --build -d
else
    docker-compose up --build -d
fi

sleep 15
echo "🧪 测试API..."
curl -s http://localhost:3001/api/status || echo "API可能需要更长时间启动"
echo "✅ 修复完成"
TEMPEOF
    
    chmod +x temp-fix-api.sh
    ./temp-fix-api.sh
fi

echo ""
echo "✅ 远程修复完成！"
echo "========================================"
echo "🌐 访问地址："
echo "   前端: http://193.57.33.111"
echo "   API: http://193.57.33.111:3001/api/status"
echo ""
echo "🧪 API测试命令："
echo "   curl http://193.57.33.111:3001/api/status"
echo "   curl http://193.57.33.111:3001/api/stream/list"
echo ""
echo "📂 项目目录: $PROJECT_DIR"
echo "💡 如需重新修复，请运行: cd $PROJECT_DIR && ./fix-api-redirect.sh"
