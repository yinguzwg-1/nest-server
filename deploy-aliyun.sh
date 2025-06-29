#!/bin/bash

# 阿里云 NestJS 服务部署脚本
# 解决 Docker Hub 网络超时问题

set -e

echo "🚀 开始部署 NestJS 服务到阿里云..."

# 0. 检查并安装 Docker Compose
echo "🔍 检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    # 下载 Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装"
fi

# 1. 配置 Docker 镜像源（解决网络超时问题）
echo "📦 配置 Docker 镜像源..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://registry.docker-cn.com"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker 服务
echo "🔄 重启 Docker 服务..."
sudo systemctl daemon-reload
sudo systemctl restart docker

# 等待 Docker 服务完全启动
sleep 5

# 2. 检查 Docker 是否正常运行
echo "🔍 检查 Docker 状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 服务未正常运行"
    exit 1
fi
echo "✅ Docker 服务正常运行"

# 3. 清理旧的容器和镜像
echo "🧹 清理旧的容器和镜像..."
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f

# 4. 构建和启动服务
echo "🏗️ 构建 NestJS 服务..."
DOCKER_BUILDKIT=1 docker-compose build --no-cache nestjs-api

echo "🚀 启动服务..."
docker-compose up -d

# 5. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 6. 检查服务状态
echo "🔍 检查服务状态..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ 服务启动成功！"
    echo "📊 服务状态："
    docker-compose ps
    
    echo "🌐 服务地址："
    echo "   - API 服务: http://$(curl -s ifconfig.me):3001"
    echo "   - 健康检查: http://$(curl -s ifconfig.me):3001/health"
    
    echo "📝 查看日志："
    echo "   docker-compose logs -f nestjs-api"
else
    echo "❌ 服务启动失败"
    echo "📝 查看错误日志："
    docker-compose logs nestjs-api
    exit 1
fi

echo "🎉 部署完成！" 