#!/bin/bash

# NestJS 构建脚本 - 不包含MySQL，只构建NestJS服务

echo "🚀 开始构建NestJS服务（不包含MySQL）..."

# 设置环境变量
export DOCKER_BUILDKIT=1
export DOCKER_CLIENT_TIMEOUT=600
export COMPOSE_HTTP_TIMEOUT=600

# 进入nest-server目录
cd nest-server

# 清理缓存
echo "🧹 清理构建缓存..."
docker builder prune -f

# 预拉取Node.js镜像
echo "📥 预拉取Node.js镜像..."
docker pull node:18 || {
    echo "⚠️ 使用国内镜像源..."
    docker pull registry.cn-hangzhou.aliyuncs.com/library/node:18
}

# 停止现有容器
echo "🛑 停止现有容器..."
docker compose -f ../docker-compose.nomysql.yml down

# 构建NestJS镜像
echo "📦 构建NestJS镜像..."
if docker compose -f ../docker-compose.nomysql.yml build nestjs-api --no-cache; then
    echo "✅ NestJS镜像构建成功！"
    
    # 启动服务
    echo "🚀 启动NestJS服务..."
    docker compose -f ../docker-compose.nomysql.yml up -d
    
    echo "✅ 服务启动完成！"
    echo "📊 服务状态："
    docker compose -f ../docker-compose.nomysql.yml ps
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 10
    
    # 检查服务状态
    echo "📋 检查服务状态..."
    if docker compose -f ../docker-compose.nomysql.yml ps | grep -q "Up"; then
        echo "✅ 服务运行正常！"
        echo "🌐 访问地址: http://localhost:3001"
        echo "🔍 健康检查: http://localhost:3001/health"
    else
        echo "⚠️ 服务可能未正常启动，查看日志："
        docker compose -f ../docker-compose.nomysql.yml logs nestjs-api
    fi
    
    exit 0
else
    echo "❌ 构建失败，尝试直接构建..."
    
    # 备用方案
    if docker build -t nest_api .; then
        echo "✅ 直接构建成功！"
        echo "🚀 手动启动容器："
        echo "docker run -d --name nest_api -p 3001:3001 -e DB_HOST=localhost nest_api"
        exit 0
    else
        echo "💥 构建失败"
        exit 1
    fi
fi 