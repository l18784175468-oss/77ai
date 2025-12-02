# Docker 部署指南

## 问题描述

在Linux系统上运行项目时遇到以下错误：
```
node: /lib64/libm.so.6: version `GLIBC_2.27' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.25' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.28' not found (required by node)
node: /lib64/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by node)
node: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.20' not found (required by node)
node: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.21' not found (required by node)
```

这是因为系统中的glibc库版本过低，无法支持较新版本的Node.js。

## 解决方案

### 方案1：使用Docker部署（推荐）

Docker可以解决系统兼容性问题，因为它包含了所有必要的依赖库。

#### 1. 安装Docker

```bash
# CentOS/RHEL
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. 构建Docker镜像

```bash
# 克隆项目
git clone https://github.com/l18784175468-oss/77ai.git
cd 77ai

# 构建Docker镜像
docker build -t 77ai-app .
```

#### 3. 运行Docker容器

```bash
# 创建环境变量文件
cp .env.example .env
# 编辑.env文件，添加您的API密钥

# 运行容器
docker run -d \
  --name 77ai-container \
  -p 3000:3000 \
  -p 5000:5000 \
  --env-file .env \
  77ai-app
```

#### 4. 访问应用

- 前端: http://localhost:3000
- 后端API: http://localhost:5000

### 方案2：使用Docker Compose（推荐用于生产环境）

```bash
# 使用docker-compose启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方案3：升级系统glibc库（不推荐）

⚠️ **警告：升级系统glibc库可能会导致系统不稳定，请谨慎操作！**

```bash
# 检查当前glibc版本
ldd --version

# 对于CentOS 7，可以尝试升级到CentOS 7.9或更高版本
sudo yum update -y

# 对于Ubuntu 16.04，建议升级到Ubuntu 18.04或更高版本
sudo do-release-upgrade
```

### 方案4：使用NodeSource的旧版本Node.js

如果必须直接在系统上运行，可以使用较旧版本的Node.js：

```bash
# 安装NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或者使用nvm安装Node.js 16
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16
```

然后修改package.json中的engines字段，限制Node.js版本：

```json
{
  "engines": {
    "node": ">=16.0.0 <17.0.0"
  }
}
```

## 生产环境部署建议

### 1. 使用Docker Swarm

```bash
# 初始化Swarm
docker swarm init

# 部署服务栈
docker stack deploy -c docker-compose.yml 77ai
```

### 2. 使用Kubernetes

```bash
# 应用Kubernetes配置
kubectl apply -f k8s/
```

### 3. 使用Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 环境变量配置

创建`.env`文件并配置以下变量：

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/77ai

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key

# AI服务API密钥
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
STABILITY_API_KEY=your-stability-api-key

# 应用配置
NODE_ENV=production
PORT=5000
CLIENT_PORT=3000
```

## 常见问题

### Q: Docker容器启动失败
A: 检查Docker日志：
```bash
docker logs 77ai-container
```

### Q: 端口冲突
A: 修改docker-compose.yml中的端口映射：
```yaml
ports:
  - "8080:3000"  # 将前端端口改为8080
  - "8081:5000"  # 将后端端口改为8081
```

### Q: 数据库连接失败
A: 确保MongoDB服务正在运行，或者使用MongoDB Docker容器：
```bash
docker run -d --name mongodb -p 27017:27017 mongo
```

## 总结

Docker部署是解决系统兼容性问题的最佳方案，它提供了：
- 一致的运行环境
- 简化的部署流程
- 更好的资源管理
- 易于扩展和维护

推荐在生产环境中使用Docker或Docker Compose进行部署。