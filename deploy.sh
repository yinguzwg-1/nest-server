#!/bin/bash

# Nest.js PM2 部署脚本
# 使用方法: ./deploy.sh [production|staging]

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

# 检查参数
ENVIRONMENT=${1:-production}
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    log_error "环境参数必须是 'production' 或 'staging'"
    exit 1
fi

log_info "开始部署 Nest.js 应用到 $ENVIRONMENT 环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安装"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    log_error "npm 未安装"
    exit 1
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 检查 MySQL
if ! command -v mysql &> /dev/null; then
    log_warning "MySQL 未安装，请先安装 MySQL"
    exit 1
fi

# 安装依赖
log_info "安装项目依赖..."
npm install --legacy-peer-deps

# 构建项目
log_info "构建项目..."
npm run build

# 检查构建结果
if [ ! -f "dist/src/main.js" ]; then
    log_error "构建失败，dist/src/main.js 文件不存在"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 停止现有进程
log_info "停止现有 PM2 进程..."
pm2 stop nest-server || true
pm2 delete nest-server || true

# 启动应用
log_info "启动 Nest.js 应用..."
if [ "$ENVIRONMENT" = "production" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env staging
fi

# 保存 PM2 配置
log_info "保存 PM2 配置..."
pm2 save

# 设置开机自启
log_info "设置 PM2 开机自启..."
pm2 startup

# 等待服务启动
log_info "等待服务启动..."
sleep 20

# 检查服务状态
log_info "检查服务状态..."
pm2 status

# 健康检查
log_info "执行健康检查..."
for i in {1..30}; do
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        log_success "部署成功！"
        log_info "API 地址: http://localhost:3001"
        log_info "PM2 状态:"
        pm2 show nest-server
        break
    else
        log_info "等待应用启动... ($i/30)"
        sleep 2
    fi
done

if [ $i -eq 30 ]; then
    log_error "健康检查失败，应用启动超时"
    log_info "查看 PM2 日志:"
    pm2 logs nest-server --lines 20
    log_info "查看应用日志:"
    tail -n 20 logs/combined.log || echo "日志文件不存在"
    exit 1
fi

log_success "Nest.js PM2 部署完成！" 