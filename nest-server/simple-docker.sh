#!/bin/bash

# 最简单的 Docker 部署脚本（类似 airbnb 服务）
echo "🚀 部署 NestJS 服务..."

# 1. 配置 Docker 镜像源（解决网络超时问题）
echo "📦 配置 Docker 镜像源..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF

# 重启 Docker 服务
sudo systemctl restart docker
sleep 3

# 2. 停止旧容器
echo "🧹 清理旧容器..."
docker stop nest_api 2>/dev/null || true
docker rm nest_api 2>/dev/null || true

# 3. 删除旧镜像
echo "🗑️ 清理旧镜像..."
docker rmi nestjs-api 2>/dev/null || true

# 4. 构建新镜像
echo "🏗️ 构建镜像..."
docker build -t nestjs-api .

# 5. 启动容器
echo "🚀 启动容器..."
docker run -d \
  --name nest_api \
  --restart unless-stopped \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e DB_HOST=localhost \
  -e DB_PORT=3306 \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=qq123456 \
  -e DB_DATABASE=nest_db \
  nestjs-api

# 6. 检查状态
echo "⏳ 等待服务启动..."
sleep 10

if docker ps | grep -q "nest_api"; then
    echo "✅ 部署成功！"
    echo "📊 容器状态："
    docker ps | grep nest_api
    echo "🌐 服务地址: http://$(curl -s ifconfig.me):3001"
    echo "📝 查看日志: docker logs -f nest_api"
else
    echo "❌ 部署失败"
    echo "📝 查看错误日志："
    docker logs nest_api
fi 