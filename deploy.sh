#!/bin/bash

# 77ai项目快速部署脚本
# 适用于Linux系统，解决Node.js兼容性问题

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
        echo "安装命令："
        echo "  CentOS/RHEL: sudo yum install -y docker"
        echo "  Ubuntu/Debian: sudo apt-get install -y docker.io"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        echo "安装命令："
        echo "  sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "  sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        echo "启动命令："
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        exit 1
    fi
    
    log_success "系统要求检查通过"
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
    log_info "构建Docker镜像..."
    docker-compose build --no-cache
    
    log_info "启动服务..."
    docker-compose up -d
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务就绪..."
    
    # 等待MongoDB
    log_info "等待MongoDB启动..."
    while ! docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ismaster')" &> /dev/null; do
        sleep 2
    done
    
    # 等待后端服务
    log_info "等待后端服务启动..."
    while ! curl -f http://localhost:5000/api/health &> /dev/null; do
        sleep 5
    done
    
    # 等待前端服务
    log_info "等待前端服务启动..."
    while ! curl -f http://localhost:3000 &> /dev/null; do
        sleep 5
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
    echo "  Nginx代理: http://localhost"
    echo ""
    echo "🔧 管理命令："
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  查看状态: docker-compose ps"
    echo ""
    echo "📊 数据库连接："
    echo "  MongoDB: mongodb://admin:password123@localhost:27017"
    echo "  Redis: redis://:redis123@localhost:6379"
    echo ""
    echo "⚠️  重要提醒："
    echo "  1. 请编辑 .env 文件配置您的AI服务API密钥"
    echo "  2. 建议修改默认数据库密码"
    echo "  3. 生产环境请配置HTTPS证书"
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "🚀 77ai项目自动部署脚本"
    echo "=========================================="
    echo ""
    
    check_requirements
    create_env_file
    deploy_services
    wait_for_services
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"