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

echo "启动服务..."
docker-compose -f docker-compose-noports.yml up --build -d

echo "等待服务启动..."
sleep 30

echo "检查服务状态..."
docker-compose -f docker-compose-noports.yml ps

echo "部署完成！"
echo "访问地址："
echo "  前端: http://193.57.33.111"
echo "  API: http://193.57.33.111:3001"
echo "  管理后台: http://193.57.33.111/admin"
