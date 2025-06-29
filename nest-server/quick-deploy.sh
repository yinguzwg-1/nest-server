#!/bin/bash

# 快速部署脚本
echo "🚀 快速部署 NestJS 服务..."

# 1. 配置 Docker 镜像源
echo "📦 配置 Docker 镜像源..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

sudo systemctl restart docker
sleep 3

# 2. 清理并重新构建
echo "🧹 清理旧容器..."
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>/dev/null || true
else
    docker compose down 2>/dev/null || true
fi
docker system prune -f

# 3. 构建和启动
echo "🏗️ 构建服务..."
export DOCKER_BUILDKIT=1

if command -v docker-compose &> /dev/null; then
    docker-compose build --no-cache
    docker-compose up -d
else
    docker compose build --no-cache
    docker compose up -d
fi

# 4. 检查状态
echo "⏳ 等待启动..."
sleep 10

if command -v docker-compose &> /dev/null; then
    if docker-compose ps | grep -q "Up"; then
        echo "✅ 部署成功！"
        echo "🌐 服务地址: http://$(curl -s ifconfig.me):3001"
    else
        echo "❌ 部署失败"
        docker-compose logs
    fi
else
    if docker compose ps | grep -q "Up"; then
        echo "✅ 部署成功！"
        echo "🌐 服务地址: http://$(curl -s ifconfig.me):3001"
    else
        echo "❌ 部署失败"
        docker compose logs
    fi
fi 