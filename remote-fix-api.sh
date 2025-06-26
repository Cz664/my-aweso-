#!/bin/bash

echo "🚀 远程服务器API修复脚本"
echo "========================================"

# 检查是否在项目目录
if [ ! -f "package.json" ] && [ ! -f "docker-compose.yml" ]; then
    echo "⚠️  当前不在项目目录，尝试进入项目目录..."
    if [ -d "my-aweso-" ]; then
        cd my-aweso-
        echo "✓ 已进入项目目录"
    else
        echo "❌ 找不到项目目录，请手动进入项目根目录后运行此脚本"
        exit 1
    fi
fi

# 从GitHub拉取最新修复
echo "📥 从GitHub拉取最新修复..."
git pull origin main

# 确保脚本有执行权限
echo "🔧 设置脚本权限..."
chmod +x fix-api-redirect.sh quick-fix.sh

# 运行API修复脚本
echo "🎯 运行API修复脚本..."
./fix-api-redirect.sh

echo "✅ 远程修复完成！"
echo "🌐 请访问 http://193.57.33.111 测试服务"
