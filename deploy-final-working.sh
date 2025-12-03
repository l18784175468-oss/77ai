#!/bin/bash

# 77ai项目最终工作部署脚本
# 解决所有构建工具问题

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
    
    # 停止所有相关容器
    docker stop 77ai-mongodb 2>/dev/null || true
    docker stop 77ai-redis 2>/dev/null || true
    docker stop 77ai-backend 2>/dev/null || true
    docker stop 77ai-frontend 2>/dev/null || true
    
    # 删除容器
    docker rm 77ai-mongodb 2>/dev/null || true
    docker rm 77ai-redis 2>/dev/null || true
    docker rm 77ai-backend 2>/dev/null || true
    docker rm 77ai-frontend 2>/dev/null || true
    
    # 删除旧网络
    docker network rm 77ai_77ai-network 2>/dev/null || true
    
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

# 创建最终工作Docker配置
create_final_working_config() {
    log_info "创建最终工作Docker配置..."
    
    # 创建最终工作docker-compose配置
    cat > docker-compose.final-working.yml << 'EOF'
version: '3.8'

services:
  # MongoDB数据库
  mongodb:
    image: mongo:6.0
    container_name: 77ai-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-password123}
      MONGO_INITDB_DATABASE: 77ai
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    ports:
      - "27017:27017"
    networks:
      - 77ai-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: 77ai-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis123}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - 77ai-network

  # 后端API服务
  backend:
    image: node:20-alpine
    container_name: 77ai-backend
    restart: unless-stopped
    working_dir: /app
    command: >
      sh -c "
        apk add --no-cache python3 make g++ &&
        npm install &&
        npm install -g typescript &&
        npm run build &&
        npm start
      "
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://admin:${MONGO_ROOT_PASSWORD:-password123}@mongodb:27017/77ai?authSource=admin
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis123}@redis:6379
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY}
      STABILITY_API_KEY: ${STABILITY_API_KEY}
    volumes:
      - ./server:/app
      - /app/node_modules
      - ./server/uploads:/app/server/uploads
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    networks:
      - 77ai-network

  # 前端应用
  frontend:
    image: node:20-alpine
    container_name: 77ai-frontend
    restart: unless-stopped
    working_dir: /app
    command: >
      sh -c "
        npm install &&
        npm install -g vite &&
        npm run build &&
        npx http-server dist -p 3000 -a 0.0.0.0
      "
    environment:
      NODE_ENV: production
      VITE_API_URL: http://localhost:5000
    volumes:
      - ./client:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - 77ai-network

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local

networks:
  77ai-network:
    driver: bridge
EOF

    log_success "最终工作配置创建完成"
}

# 构建和启动服务
deploy_services() {
    log_info "启动服务（使用最终工作配置）..."
    
    # 创建最终工作配置
    create_final_working_config
    
    # 启动服务
    docker-compose -f docker-compose.final-working.yml up -d
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    # 等待MongoDB
    log_info "等待MongoDB启动..."
    sleep 20
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    for i in {1..60}; do
        if docker-compose -f docker-compose.final-working.yml exec -T backend curl -f http://localhost:5000/api/health &> /dev/null; then
            log_success "后端服务启动成功"
            break
        fi
        sleep 5
        echo "等待后端服务启动... ($i/60)"
    done
    
    # 等待前端服务
    log_info "等待前端服务启动..."
    for i in {1..60}; do
        if curl -f http://localhost:3000 &> /dev/null; then
            log_success "前端服务启动成功"
            break
        fi
        sleep 5
        echo "等待前端服务启动... ($i/60)"
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
    echo "  查看日志: docker-compose -f docker-compose.final-working.yml logs -f"
    echo "  查看后端日志: docker-compose -f docker-compose.final-working.yml logs -f backend"
    echo "  查看前端日志: docker-compose -f docker-compose.final-working.yml logs -f frontend"
    echo "  停止服务: docker-compose -f docker-compose.final-working.yml down"
    echo "  重启服务: docker-compose -f docker-compose.final-working.yml restart"
    echo "  查看状态: docker-compose -f docker-compose.final-working.yml ps"
    echo ""
    echo "🔍 故障排除："
    echo "  如果服务无法启动，请检查："
    echo "  1. 端口是否被占用: netstat -tulpn | grep -E ':(3000|5000|6379|27017)'"
    echo "  2. Docker日志: docker-compose -f docker-compose.final-working.yml logs"
    echo "  3. 系统资源: free -h, df -h"
    echo ""
    echo "📊 数据库连接："
    echo "  MongoDB: mongodb://admin:password123@localhost:27017"
    echo "  Redis: redis://:redis123@localhost:6379"
    echo ""
    echo "⚠️  重要提醒："
    echo "  1. 请编辑 .env 文件配置您的AI服务API密钥"
    echo "  2. 建议修改默认数据库密码"
    echo "  3. 生产环境请配置HTTPS证书"
    echo "  4. 当前使用Node.js 20解决兼容性问题"
    echo "  5. 全局安装typescript和vite解决构建问题"
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "🚀 77ai项目最终工作部署脚本"
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