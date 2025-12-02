# AI Web Framework

通用AI应用开发框架，支持多种AI功能集成

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **AI集成**: 支持OpenAI、Claude、本地模型等多种AI服务
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **构建工具**: Vite (前端), tsc (后端)

## 项目结构

```
ai-web-framework/
├── client/                 # 前端Vue应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── views/         # 页面组件
│   │   ├── stores/        # Pinia状态管理
│   │   ├── services/      # API服务
│   │   ├── types/         # TypeScript类型定义
│   │   └── utils/         # 工具函数
│   ├── public/
│   └── package.json
├── server/                # 后端Node.js应用
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑服务
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由定义
│   │   ├── config/        # 配置文件
│   │   └── utils/         # 工具函数
│   └── package.json
├── docs/                  # 项目文档
└── package.json          # 根目录配置
```

## 快速开始

### ⚠️ 系统兼容性提醒

在Linux系统上部署时，可能会遇到Node.js版本兼容性问题（glibc版本过低）。**推荐使用Docker部署**，可完全解决兼容性问题。

详细兼容性信息请参考：[系统兼容性指南](./SYSTEM_COMPATIBILITY.md)

### 方案1：Docker部署（推荐所有系统）

#### 选项1A：简化部署脚本（推荐）
```bash
# 1. 克隆项目
git clone https://github.com/l18784175468-oss/77ai.git
cd 77ai

# 2. 使用简化部署脚本（解决构建问题）
chmod +x deploy-simple.sh
./deploy-simple.sh

# 3. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:5000
# Nginx代理: http://localhost
```

#### 选项1B：原始部署脚本
```bash
# 1. 克隆项目
git clone https://github.com/l18784175468-oss/77ai.git
cd 77ai

# 2. 使用原始部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 方案2：手动Docker部署

```bash
# 1. 克隆项目
git clone https://github.com/l18784175468-oss/77ai.git
cd 77ai

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加您的API密钥

# 3. 启动服务（使用多阶段构建）
docker-compose up -d

# 4. 如果构建失败，使用备用配置
docker-compose -f docker-compose.backup.yml up -d

# 5. 查看状态
docker-compose ps
```

### 方案3：原生部署（仅限高版本系统）

**系统要求**：glibc版本 >= 2.25（Ubuntu 18.04+, CentOS 8+, Debian 10+）

```bash
# 1. 检查系统兼容性
ldd --version

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量
cp .env.example .env

# 4. 开发模式
npm run dev

# 5. 生产模式
npm run build
npm start
```

### 环境变量配置

创建 `.env` 文件并配置以下变量：

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
NODE_ENV=development
PORT=5000
CLIENT_PORT=3000
```

## 功能特性

- 🤖 多AI服务集成支持
- 🎛️ 自定义AI服务配置和管理
-  现代化UI界面
- 🔧 完整的TypeScript支持
- 📱 响应式设计
- 🔐 用户认证系统
- 🚀 高性能架构
- 📊 实时数据流处理
- 🔌 插件化架构

## 使用指南

### AI聊天
1. 选择AI模型（GPT-4、Claude-3、Gemini Pro等）
2. 输入消息开始对话
3. 支持多轮对话和上下文理解
4. 可以导出聊天记录

### 自定义AI服务
1. 进入"自定义AI"页面
2. 点击"添加自定义AI服务"
3. 填写服务配置：
   - 服务名称
   - API端点
   - API密钥
   - 模型名称
   - 请求格式（OpenAI/Claude/Google/自定义）
   - 最大令牌数、温度等参数
4. 测试连接确保配置正确
5. 在聊天页面选择自定义模型进行对话

### 支持的自定义AI格式

#### OpenAI格式
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Hello"}],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

#### Claude格式
```json
{
  "model": "claude-3",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 4096,
  "temperature": 0.7
}
```

#### Google格式
```json
{
  "contents": [{
    "parts": [{"text": "Hello"}]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 2048
  }
}
```

## 功能特性

### 🤖 AI服务集成
- **多AI提供商**: OpenAI、Claude、Google Gemini、Stability AI
- **自定义AI服务**: 支持任意兼容OpenAI/Claude/Google格式的AI服务
- **智能对话**: 多轮对话、上下文管理、历史记录
- **图像生成**: AI驱动的图像创建和编辑
- **代码助手**: 智能代码生成、解释和优化

### 🎛️ 自定义AI管理
- 可视化配置界面
- 支持多种请求格式（OpenAI/Claude/Google/自定义）
- 连接测试功能
- 使用量统计

### 👥 用户系统
- **安全认证**: JWT令牌认证、两步验证(2FA)
- **订阅管理**: 多层级订阅计划（免费版、基础版、专业版、企业版）
- **使用量控制**: 消息、图像、令牌数限制
- **个人资料**: 用户信息、安全设置、偏好配置

### 🎨 用户界面
- 现代化UI设计（Element Plus组件库）
- 响应式布局（适配桌面和移动设备）
- 主题切换支持（明暗主题）
- 直观的操作体验

### 🚀 技术特性
- 完整的TypeScript支持
- 高性能RESTful API架构
- 实时通信（Socket.IO）
- 中间件模式（认证、限流、错误处理）
- 数据验证和清理
- 容器化部署（Docker）

## 部署指南

### 🐳 Docker部署详解

#### 服务架构
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Nginx     │  │   前端应用   │  │   后端API   │
│  (反向代理)  │  │   (Vue3)    │  │ (Node.js)   │
│   :80/443   │  │   :3000     │  │   :5000     │
└─────────────┘  └─────────────┘  └─────────────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
        ┌─────────────┐ ┌─────────────┐
        │   MongoDB   │ │    Redis    │
        │   :27017    │ │   :6379     │
        └─────────────┘ └─────────────┘
```

#### 管理命令
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新服务
git pull
docker-compose build --no-cache
docker-compose up -d
```

### 🔧 故障排除

#### 常见问题

**1. Docker构建失败 - package-lock.json缺失**
```bash
# 错误信息
npm error The `npm ci` command can only install with an existing package-lock.json

# 解决方案1：使用简化部署脚本
./deploy-simple.sh

# 解决方案2：使用备用配置
docker-compose -f docker-compose.backup.yml up -d

# 解决方案3：手动构建
docker-compose build --no-cache --progress=plain
```

**2. Node.js版本兼容性问题**
```bash
# 错误信息
node: /lib64/libm.so.6: version `GLIBC_2.27' not found

# 解决方案：使用Docker部署（已解决）
./deploy-simple.sh
```

**3. 端口冲突**
```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 修改端口映射
# 编辑 docker-compose.yml
ports:
  - "8080:3000"  # 修改前端端口
  - "8081:5000"  # 修改后端端口
```

**4. 内存不足**
```bash
# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 临时清理内存
echo 3 > /proc/sys/vm/drop_caches
```

**5. 磁盘空间不足**
```bash
# 清理Docker资源
docker system prune -a
docker volume prune

# 清理日志
sudo journalctl --vacuum-time=7d

# 清理包缓存
npm cache clean --force
```

**6. 服务启动失败**
```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend

# 完全重建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**7. 数据库连接问题**
```bash
# 检查MongoDB状态
docker-compose exec mongodb mongosh --eval "db.adminCommand('ismaster')"

# 检查Redis状态
docker-compose exec redis redis-cli ping

# 重置数据库
docker-compose down -v
docker-compose up -d
```

#### 性能监控

```bash
# 系统资源监控
htop
iostat -x 1
free -h

# Docker资源监控
docker stats

# 应用日志监控
tail -f server/logs/app.log
```

### 🔒 安全配置

#### 生产环境安全建议

1. **修改默认密码**
```bash
# 编辑环境变量
MONGO_ROOT_PASSWORD=your-strong-password
REDIS_PASSWORD=your-strong-password
JWT_SECRET=your-super-secret-jwt-key
```

2. **配置HTTPS**
```bash
# 编辑 nginx/nginx.conf
# 添加SSL证书配置
listen 443 ssl;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

3. **防火墙配置**
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 开发指南

### 本地开发环境

```bash
# 1. 克隆项目
git clone https://github.com/l18784175468-oss/77ai.git
cd 77ai

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 启动开发服务器
npm run dev
```

### 项目结构详解

```
77ai/
├── client/                 # 前端Vue应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── views/         # 页面组件
│   │   ├── stores/        # Pinia状态管理
│   │   ├── services/      # API服务
│   │   ├── types/         # TypeScript类型定义
│   │   └── utils/         # 工具函数
│   └── package.json
├── server/                # 后端Node.js应用
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑服务
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由定义
│   │   ├── config/        # 配置文件
│   │   └── utils/         # 工具函数
│   └── package.json
├── nginx/                 # Nginx配置
├── scripts/               # 部署脚本
├── docs/                  # 项目文档
├── docker-compose.yml     # Docker编排配置
├── Dockerfile            # Docker镜像构建
└── deploy.sh             # 一键部署脚本
```

### 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## API文档

### 自定义AI接口
- `GET /api/custom-ai/services` - 获取自定义AI服务列表
- `POST /api/custom-ai/services` - 添加/更新自定义AI服务
- `DELETE /api/custom-ai/services/:id` - 删除自定义AI服务
- `POST /api/custom-ai/test` - 测试自定义AI服务连接
- `GET /api/custom-ai/models` - 获取自定义AI模型列表
- `POST /api/custom-ai/chat` - 使用自定义AI进行聊天

### 用户认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/profile` - 获取用户信息
- `PUT /api/auth/profile` - 更新用户信息

### 订阅管理接口
- `GET /api/subscription/plans` - 获取订阅计划
- `POST /api/subscription/subscribe` - 订阅计划
- `GET /api/subscription/current` - 获取当前订阅
- `GET /api/subscription/usage` - 获取使用量统计

## 许可证

MIT License

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看 [系统兼容性指南](./SYSTEM_COMPATIBILITY.md)
2. 查看 [Docker部署指南](./DOCKER_DEPLOYMENT.md)
3. 提交 Issue 到 [GitHub仓库](https://github.com/l18784175468-oss/77ai/issues)

---

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**