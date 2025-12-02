# 快速修复指南

## 问题：找不到 deploy-simple.sh 文件

### 解决方案

#### 方案1：重新拉取最新代码（推荐）
```bash
# 1. 进入项目目录
cd 77ai

# 2. 拉取最新代码
git pull origin main

# 3. 检查文件是否存在
ls -la deploy-simple.sh

# 4. 如果文件存在，设置执行权限
chmod +x deploy-simple.sh

# 5. 运行部署脚本
./deploy-simple.sh
```

#### 方案2：手动创建部署脚本
如果重新拉取代码后仍然找不到文件，可以手动创建：

```bash
# 1. 创建部署脚本文件
cat > deploy-simple.sh << 'EOF'
#!/bin/bash

# 77ai项目简化部署脚本
# 解决Docker构建问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# 清理旧容器和镜像
cleanup_old() {
    log_info "清理旧的Docker容器和镜像..."
    
    # 停止并删除容器
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 删除旧镜像
    docker rmi 77ai-backend 2>/dev/null || true
    docker rmi 77ai-frontend 2>/dev/null || true
    
    log_success "清理完成"
}

# 创建环境变量文件
create_env_file() {
    if [ ! -f .env ]; then
        log_info "创建环境变量文件..."
        cp .env.example .env
        log_warning "请编辑 .env 文件，配置您的API密钥"
        log_info "编辑命令：nano .env"
    else
        log_info "环境变量文件已存在"
    fi
}

# 构建和启动服务
deploy_services() {
    log_info "构建Docker镜像（使用备用配置）..."
    
    # 使用备用配置（更稳定）
    docker-compose -f docker-compose.backup.yml build --no-cache
    
    log_info "启动服务..."
    docker-compose -f docker-compose.backup.yml up -d
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    # 等待MongoDB
    log_info "等待MongoDB启动..."
    sleep 15
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost:5000/api/health &> /dev/null; then
            break
        fi
        sleep 5
        echo "等待后端服务启动... ($i/30)"
    done
    
    # 等待前端服务
    log_info "等待前端服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost:3000 &> /dev/null; then
            break
        fi
        sleep 5
        echo "等待前端服务启动... ($i/30)"
    done
    
    log_success "所有服务已就绪"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "=========================================="
    echo "🎉 77ai项目部署完成！"
    echo "=========================================="
    echo ""
    echo "📱 访问地址："
    echo "  前端应用: http://localhost:3000"
    echo "  后端API:  http://localhost:5000"
    echo ""
    echo "🔧 管理命令："
    echo "  查看日志: docker-compose -f docker-compose.backup.yml logs -f"
    echo "  停止服务: docker-compose -f docker-compose.backup.yml down"
    echo "  重启服务: docker-compose -f docker-compose.backup.yml restart"
    echo "  查看状态: docker-compose -f docker-compose.backup.yml ps"
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "🚀 77ai项目快速部署脚本"
    echo "=========================================="
    echo ""
    
    check_requirements
    cleanup_old
    create_env_file
    deploy_services
    wait_for_services
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
EOF

# 2. 设置执行权限
chmod +x deploy-simple.sh

# 3. 运行脚本
./deploy-simple.sh
```

#### 方案3：直接使用Docker命令
```bash
# 1. 创建环境变量文件
cp .env.example .env

# 2. 启动MongoDB和Redis
docker run -d --name 77ai-mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:6.0
docker run -d --name 77ai-redis -p 6379:6379 redis:7-alpine redis-server --requirepass redis123

# 3. 等待数据库启动
sleep 10

# 4. 构建并启动应用
docker-compose -f docker-compose.backup.yml up -d

# 5. 查看状态
docker-compose -f docker-compose.backup.yml ps
```

## 验证部署

部署完成后，访问以下地址验证：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000

## 故障排除

如果仍然遇到问题：

1. **检查Docker状态**:
   ```bash
   docker --version
   docker-compose --version
   docker info
   ```

2. **查看详细错误**:
   ```bash
   docker-compose -f docker-compose.backup.yml logs
   ```

3. **完全重置**:
   ```bash
   docker-compose -f docker-compose.backup.yml down -v
   docker system prune -a
   docker-compose -f docker-compose.backup.yml up -d
   ```

## 联系支持

如果问题仍未解决，请：
1. 查看完整日志
2. 检查系统资源
3. 提交Issue到GitHub仓库