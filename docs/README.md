# AI Web Framework 开发指南

## 项目概述

AI Web Framework 是一个通用的AI应用开发框架，支持多种AI功能集成。本框架旨在为开发者提供一个简单、高效、可扩展的AI应用开发平台。

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios

### 后端
- **运行时**: Node.js
- **框架**: Express + TypeScript
- **认证**: JWT + bcryptjs
- **日志**: Winston
- **进程管理**: PM2

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx (可选)
- **数据库**: MongoDB (可选)
- **缓存**: Redis (可选)

## 项目结构

```
ai-web-framework/
├── client/                 # 前端Vue应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── views/         # 页面组件
│   │   ├── stores/        # Pinia状态管理
│   │   ├── services/      # API服务
│   │   ├── router/        # 路由配置
│   │   ├── App.vue        # 根组件
│   │   └── main.ts       # 入口文件
│   ├── public/            # 静态资源
│   ├── package.json       # 依赖配置
│   └── vite.config.ts     # Vite配置
├── server/                # 后端Node.js应用
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑服务
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由定义
│   │   ├── config/        # 配置文件
│   │   └── utils/         # 工具函数
│   ├── uploads/           # 文件上传目录
│   └── logs/             # 日志目录
│   └── package.json       # 依赖配置
├── scripts/               # 部署脚本
│   └── deploy.sh         # 部署脚本
├── docs/                  # 项目文档
├── .env.example           # 环境变量示例
├── docker-compose.yml     # Docker编排配置
└── Dockerfile            # Docker镜像构建
```

## 快速开始

### 环境要求

- Node.js 18+ 
- npm 8+
- Docker (可选，用于容器化部署)
- MongoDB (可选，用于数据持久化)
- Redis (可选，用于缓存和会话存储)

### 安装依赖

```bash
# 安装所有依赖
npm run install:all
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 前端: http://localhost:3000
# 后端: http://localhost:5000
```

### 生产部署

```bash
# 使用Docker Compose部署
chmod +x scripts/deploy.sh
./scripts/deploy.sh production

# 或手动部署
npm run build
npm start
```

## 功能特性

### 🤖 AI聊天
- 支持多种AI模型 (GPT-4, Claude 3, Gemini Pro等)
- 实时流式响应
- 聊天历史管理
- 消息搜索和过滤
- 多语言支持

### 🎨 图像生成
- 支持DALL-E 3, Stable Diffusion等模型
- 图像编辑和变体生成
- 批量生成功能
- 图像历史管理
- 高分辨率输出

### 💻 代码助手
- 代码分析和解释
- 代码优化建议
- 错误检测和修复
- 多语言代码生成
- 代码格式化

### 🔐 用户认证
- JWT令牌认证
- 密码加密存储
- 邮箱验证
- 忘记密码功能
- 双因素认证支持

### ⚙️ 系统设置
- 主题切换 (浅色/深色/自动)
- 多语言支持
- AI服务配置管理
- 个性化设置
- 数据导入/导出

## API文档

### 认证接口

#### 用户注册
```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "string",
  "email": "string", 
  "password": "string"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

#### 刷新令牌
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}
```

### 聊天接口

#### 发送消息
```http
POST /api/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "string",
  "model": "string",
  "chatId": "string",
  "userId": "string"
}
```

#### 获取聊天历史
```http
GET /api/chat/history?userId=<userId>
Authorization: Bearer <token>
```

### 图像生成接口

#### 生成图像
```http
POST /api/image/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "string",
  "negativePrompt": "string",
  "size": "string",
  "count": "number",
  "quality": "number",
  "model": "string",
  "userId": "string"
}
```

### 代码助手接口

#### 分析代码
```http
POST /api/code/analyze
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "string",
  "language": "string",
  "model": "string",
  "userId": "string"
}
```

## 开发指南

### 添加新的AI服务

1. 在 `server/src/services/aiService.ts` 中添加新的服务类
2. 实现必要的方法 (`sendMessage`, `generateImage` 等)
3. 在 `AIServiceFactory` 中注册新服务
4. 更新路由和中间件

### 扩展前端组件

1. 在 `client/src/components/` 中创建新组件
2. 遵循现有的命名和结构约定
3. 使用TypeScript定义Props和Emits
4. 添加适当的样式和响应式设计

### 数据库集成

当前使用内存存储，生产环境建议集成数据库：

1. MongoDB集成示例：
```javascript
// 在server/src/config/database.js中
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL)

// 创建模型
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
})
```

2. Redis集成示例：
```javascript
// 在server/src/config/redis.js中
const redis = require('redis')
const client = redis.createClient(process.env.REDIS_URL)

// 在认证中使用
client.set(`session:${userId}`, sessionData)
```

## 部署指南

### Docker部署

1. 构建镜像：
```bash
docker build -t ai-web-framework .
```

2. 使用Docker Compose：
```bash
docker-compose up -d
```

3. 环境变量配置：
```bash
# 复制环境配置
cp .env.example .env.production
# 编辑配置文件
vim .env.production
```

### 传统部署

1. 构建应用：
```bash
npm run build
```

2. 配置环境变量：
```bash
export NODE_ENV=production
export PORT=5000
```

3. 启动应用：
```bash
npm start
```

## 性能优化

### 前端优化
- 使用Vite的代码分割功能
- 图片懒加载和压缩
- 组件按需加载
- 使用CDN加速静态资源

### 后端优化
- 实现API缓存机制
- 使用连接池管理数据库连接
- 启用Gzip压缩
- 设置适当的CORS策略

## 安全最佳实践

### 认证安全
- 使用强密码策略
- 实现速率限制
- 定期更新依赖包
- 使用HTTPS传输敏感数据
- 实现CSRF保护

### 数据安全
- 输入验证和清理
- SQL注入防护
- XSS攻击防护
- 敏感数据加密存储

## 故障排除

### 常见问题

1. **端口冲突**
   - 检查端口是否被占用
   - 修改环境变量中的端口配置

2. **依赖安装失败**
   - 清除npm缓存：`npm cache clean --force`
   - 删除node_modules重新安装

3. **AI服务连接失败**
   - 检查API密钥配置
   - 验证网络连接
   - 查看服务提供商状态

4. **构建失败**
   - 检查TypeScript类型错误
   - 确保所有依赖正确安装
   - 查看构建日志

### 日志分析

```bash
# 查看应用日志
docker-compose logs -f api

# 查看错误日志
tail -f logs/error.log

# 查看访问日志
tail -f logs/access.log
```

## 贡献指南

### 开发流程

1. Fork项目到个人仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交代码：`git commit -m "Add new feature"`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

### 代码规范

- 遵循ESLint配置
- 编写单元测试
- 更新相关文档
- 保持代码简洁和可读性

### 提交规范

- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建工具或辅助工具的变动

## 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 联系方式

- 项目主页: [https://github.com/your-org/ai-web-framework](https://github.com/your-org/ai-web-framework)
- 问题反馈: [Issues](https://github.com/your-org/ai-web-framework/issues)
- 邮箱: support@ai-web-framework.com

---

*最后更新: 2024-01-01*