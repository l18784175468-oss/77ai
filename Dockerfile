# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 构建后端
WORKDIR /app/server
RUN npm run build

# 构建前端
WORKDIR /app/client
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装PM2用于进程管理
RUN npm install -g pm2

# 创建应用目录
WORKDIR /app

# 复制构建产物
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/package.json

# 创建非root用户
RUN addgroup -g 1001 -G nodejs
RUN adduser -u 1001 -G nodejs -s /bin/sh
USER nodejs

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node server/dist/index.js || exit 1

# 启动应用
CMD ["pm2-runtime", "start", "server/ecosystem.config.js"]