#!/bin/bash

# 快速部署脚本 - 解决阿里云 Docker Hub 网络问题
echo "🚀 快速部署 NestJS 服务到阿里云..."

# 1. 配置 Docker 镜像源
echo "📦 配置 Docker 镜像源..."
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF

# 重启 Docker
sudo systemctl restart docker
sleep 3

# 2. 清理并重新构建
echo "🧹 清理旧容器..."
docker-compose down 2>/dev/null || true
docker system prune -f

# 3. 使用国内镜像源构建
echo "🏗️ 构建服务..."
DOCKER_BUILDKIT=1 docker-compose build --no-cache

# 4. 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 5. 检查状态
echo "⏳ 等待服务启动..."
sleep 10

if docker-compose ps | grep -q "Up"; then
    echo "✅ 部署成功！"
    echo "🌐 服务地址: http://$(curl -s ifconfig.me):3001"
else
    echo "❌ 部署失败，查看日志："
    docker-compose logs
fi 