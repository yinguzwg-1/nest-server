#!/bin/bash

# NestJS 简化构建脚本 - 只构建nest-server

echo "🚀 开始构建NestJS服务..."

# 设置环境变量
export DOCKER_BUILDKIT=1
export DOCKER_CLIENT_TIMEOUT=600
export COMPOSE_HTTP_TIMEOUT=600

# 进入nest-server目录
cd nest-server

# 清理缓存
echo "🧹 清理构建缓存..."
docker builder prune -f

# 预拉取镜像
echo "📥 预拉取基础镜像..."
docker pull node:18 || {
    echo "⚠️ 使用国内镜像源..."
    docker pull registry.cn-hangzhou.aliyuncs.com/library/node:18
}

echo "📥 预拉取MySQL镜像..."
docker pull mysql:8.0

# 构建nest-server
echo "📦 构建NestJS镜像..."
if docker compose -f ../docker-compose.optimized.yml build nestjs-api --no-cache; then
    echo "✅ NestJS镜像构建成功！"
    
    # 启动服务
    echo "🚀 启动NestJS服务..."
    docker compose -f ../docker-compose.optimized.yml up -d
    
    echo "✅ 服务启动完成！"
    docker compose -f ../docker-compose.optimized.yml ps
    
    exit 0
else
    echo "❌ 构建失败，尝试直接构建..."
    
    # 备用方案
    if docker build -t nest_api .; then
        echo "✅ 直接构建成功！"
        exit 0
    else
        echo "💥 构建失败"
        exit 1
    fi
fi 