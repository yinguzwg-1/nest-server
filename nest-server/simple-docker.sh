#!/bin/bash

# 最简单的 Docker 部署脚本（类似 airbnb 服务）
echo "🚀 部署 NestJS 服务..."

# 停止旧容器
docker stop nest_api 2>/dev/null || true
docker rm nest_api 2>/dev/null || true

# 构建新镜像
echo "🏗️ 构建镜像..."
docker build -t nestjs-api .

# 启动容器
echo "🚀 启动容器..."
docker run -d \
  --name nest_api \
  --restart unless-stopped \
  -p 3001:3001 \
  -e NODE_ENV=production \
  nestjs-api

# 检查状态
sleep 5
if docker ps | grep -q "nest_api"; then
    echo "✅ 部署成功！"
    docker ps | grep nest_api
else
    echo "❌ 部署失败"
    docker logs nest_api
fi 