#!/bin/bash

# NestJS Docker构建脚本 - 兼容Docker Compose v2

echo "🚀 开始构建NestJS Docker镜像..."

# 设置Docker构建参数
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 增加构建超时时间
export DOCKER_CLIENT_TIMEOUT=600
export COMPOSE_HTTP_TIMEOUT=600

# 清理旧的构建缓存
echo "🧹 清理旧的构建缓存..."
docker builder prune -f

# 预拉取基础镜像
echo "📥 预拉取基础镜像..."
docker pull node:18 || {
    echo "⚠️ 无法拉取官方镜像，尝试使用国内镜像源..."
    docker pull registry.cn-hangzhou.aliyuncs.com/library/node:18
}

# 预拉取MySQL镜像
echo "📥 预拉取MySQL镜像..."
docker pull mysql:8.0

# 检查构建上下文
echo "📁 检查构建上下文..."
if [ ! -f "./nest-server/Dockerfile" ]; then
    echo "❌ 找不到Dockerfile，请检查路径"
    exit 1
fi

# 构建镜像 - 使用docker compose v2语法
echo "📦 开始构建镜像..."
if docker compose -f docker-compose.optimized.yml build --no-cache --parallel; then
    echo "✅ 镜像构建成功！"
    
    # 显示镜像信息
    echo "📊 镜像信息："
    docker images | grep nest_api
    
    # 启动服务
    echo "🚀 启动服务..."
    docker compose -f docker-compose.optimized.yml up -d
    
    echo "✅ 服务启动完成！"
    echo "📊 服务状态："
    docker compose -f docker-compose.optimized.yml ps
    
    exit 0
else
    echo "❌ 构建失败，尝试使用备用方案..."
    
    # 备用方案：直接使用docker build
    cd nest-server
    if docker build -t nest_api .; then
        echo "✅ 备用构建方案成功！"
        exit 0
    else
        echo "💥 所有构建方案都失败了"
        exit 1
    fi
fi 