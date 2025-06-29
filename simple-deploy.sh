#!/bin/bash

# 简单部署脚本 - 解决目录结构和 Docker Compose 问题
echo "🚀 简单部署 NestJS 服务..."

# 1. 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

# 2. 配置 Docker 镜像源
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

# 3. 清理旧容器
echo "🧹 清理旧容器..."
docker-compose down 2>/dev/null || true
docker system prune -f

# 4. 构建和启动
echo "🏗️ 构建服务..."
docker-compose build --no-cache

echo "🚀 启动服务..."
docker-compose up -d

# 5. 检查状态
echo "⏳ 等待启动..."
sleep 10

if docker-compose ps | grep -q "Up"; then
    echo "✅ 部署成功！"
    echo "🌐 服务地址: http://$(curl -s ifconfig.me):3001"
else
    echo "❌ 部署失败"
    docker-compose logs
fi 