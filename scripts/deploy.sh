#!/bin/bash

# AI Web Framework 部署脚本
# 使用方法: ./scripts/deploy.sh [环境] [选项]
# 环境: dev, staging, production
# 选项: --build-only, --deploy-only, --with-db, --with-redis

set -e

# 默认配置
ENVIRONMENT="production"
BUILD_ONLY=false
DEPLOY_ONLY=false
WITH_DB=false
WITH_REDIS=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    dev|staging|production)
      ENVIRONMENT="$1"
      shift
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --deploy-only)
      DEPLOY_ONLY=true
      shift
      ;;
    --with-db)
      WITH_DB=true
      shift
      ;;
    --with-redis)
      WITH_REDIS=true
      shift
      ;;
    *)
      echo "未知参数: $1"
      exit 1
      ;;
  esac
done

echo "🚀 开始部署 AI Web Framework..."
echo "环境: $ENVIRONMENT"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker未安装${NC}"
    echo "请先安装Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose未安装${NC}"
    echo "请先安装Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# 创建必要的目录
echo -e "${YELLOW}创建必要的目录...${NC}"
mkdir -p logs
mkdir -p uploads
mkdir -p nginx/ssl

# 复制环境配置
if [ "$ENVIRONMENT" = "production" ]; then
    cp .env.production .env
elif [ "$ENVIRONMENT" = "staging" ]; then
    cp .env.staging .env
else
    cp .env.development .env
fi

# 构建阶段
if [ "$BUILD_ONLY" = false ]; then
    echo -e "${YELLOW}构建应用...${NC}"
    
    # 构建前端
    echo -e "${GREEN}构建前端...${NC}"
    cd client
    npm run build
    
    # 构建后端
    echo -e "${GREEN}构建后端...${NC}"
    cd ../server
    npm run build
    
    cd ..
fi

# 数据库初始化
if [ "$WITH_DB" = true ]; then
    echo -e "${YELLOW}初始化数据库...${NC}"
    
    # 启动数据库服务
    docker-compose up -d mongodb
    
    # 等待数据库启动
    echo "等待数据库启动..."
    sleep 10
    
    # 创建数据库和用户（如果需要）
    docker-compose exec mongodb mongosh --eval "
        use ai_web_framework;
        db.createUser({
            user: 'admin',
            pwd: 'password',
            roles: ['readWrite', 'dbAdmin']
        });
    " || true
    
    echo -e "${GREEN}数据库初始化完成${NC}"
fi

# Redis初始化
if [ "$WITH_REDIS" = true ]; then
    echo -e "${YELLOW}初始化Redis...${NC}"
    docker-compose up -d redis
    echo -e "${GREEN}Redis初始化完成${NC}"
fi

# 部署阶段
if [ "$DEPLOY_ONLY" = false ]; then
    echo -e "${YELLOW}部署应用...${NC}"
    
    # 停止现有服务
    echo "停止现有服务..."
    docker-compose down
    
    # 构建并启动新服务
    echo "启动新服务..."
    
    if [ "$WITH_DB" = true ] && [ "$WITH_REDIS" = true ]; then
        docker-compose up -d --build mongodb redis api web
    elif [ "$WITH_DB" = true ]; then
        docker-compose up -d --build mongodb api web
    elif [ "$WITH_REDIS" = true ]; then
        docker-compose up -d --build redis api web
    else
        docker-compose up -d --build api web
    fi
    
    # 等待服务启动
    echo "等待服务启动..."
    sleep 15
    
    # 健康检查
    echo "执行健康检查..."
    
    API_HEALTH=$(curl -s http://localhost:5000/health || echo "failed")
    WEB_HEALTH=$(curl -s http://localhost:3000 || echo "failed")
    
    if [[ "$API_HEALTH" == *"ok"* ]]; then
        echo -e "${GREEN}✓ API服务健康${NC}"
    else
        echo -e "${RED}✗ API服务不健康${NC}"
    fi
    
    if [[ "$WEB_HEALTH" == *"AI Web Framework"* ]]; then
        echo -e "${GREEN}✓ Web服务健康${NC}"
    else
        echo -e "${RED}✗ Web服务不健康${NC}"
    fi
fi

# 显示服务状态
echo -e "${YELLOW}服务状态:${NC}"
docker-compose ps

# 显示访问信息
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}API服务: http://localhost:5000${NC}"
echo -e "${GREEN}Web应用: http://localhost:3000${NC}"

if [ "$WITH_DB" = true ]; then
    echo -e "${GREEN}数据库: mongodb://localhost:27017${NC}"
fi

if [ "$WITH_REDIS" = true ]; then
    echo -e "${GREEN}Redis: redis://localhost:6379${NC}"
fi

echo -e "${YELLOW}查看日志: docker-compose logs -f [service-name]${NC}"
echo -e "${YELLOW}停止服务: docker-compose down${NC}"

# 显示有用的命令
echo -e "${YELLOW}有用命令:${NC}"
echo "查看API日志: docker-compose logs -f api"
echo "查看Web日志: docker-compose logs -f web"
echo "查看数据库日志: docker-compose logs -f mongodb"
echo "重启API服务: docker-compose restart api"
echo "重启Web服务: docker-compose restart web"

echo -e "${GREEN}部署脚本执行完成！${NC}"