# 构建前端
FROM node:16 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 构建后端
FROM node:16 AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# 最终镜像
FROM node:16-slim
WORKDIR /app

# 复制后端文件
COPY --from=backend-build /app/backend ./
# 复制前端构建文件到后端的public目录
COPY --from=frontend-build /app/frontend/build ./public

# 安装生产环境依赖
RUN npm install --production

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
