# 使用官方Node.js 18 LTS版本作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# 复制package.json文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装根目录依赖
RUN npm install --omit=dev

# 安装客户端依赖
WORKDIR /app/client
RUN npm install --omit=dev

# 安装服务端依赖
WORKDIR /app/server
RUN npm install --omit=dev

# 复制项目文件
WORKDIR /app
COPY . .

# 构建前端应用
WORKDIR /app/client
RUN npm run build

# 构建后端应用
WORKDIR /app/server
RUN npm run build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000 5000

# 启动应用
CMD ["npm", "start"]