#!/bin/bash

# NestJS 服务部署脚本 - 解决网络问题
echo "🚀 开始部署 NestJS 服务..."

# 1. 检查 Docker Compose（改进检测方式）
echo "🔍 检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    # 尝试多种安装方式
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y docker-compose-plugin
    else
        # 手动下载安装
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装"
fi

# 2. 配置 Docker 镜像源（解决网络超时问题）
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

# 3. 检查 Docker 是否正常运行
echo "🔍 检查 Docker 状态..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 服务未正常运行"
    exit 1
fi
echo "✅ Docker 服务正常运行"

# 4. 清理旧的容器和镜像
echo "🧹 清理旧的容器和镜像..."
# 尝试使用 docker-compose 或 docker compose
if command -v docker-compose &> /dev/null; then
    docker-compose down --remove-orphans 2>/dev/null || true
else
    docker compose down --remove-orphans 2>/dev/null || true
fi
docker system prune -f

# 5. 构建和启动服务
echo "🏗️ 构建 NestJS 服务..."
# 使用 BuildKit 加速构建
export DOCKER_BUILDKIT=1

# 尝试使用 docker-compose 或 docker compose
if command -v docker-compose &> /dev/null; then
    docker-compose build --no-cache
    echo "🚀 启动服务..."
    docker-compose up -d
else
    docker compose build --no-cache
    echo "🚀 启动服务..."
    docker compose up -d
fi

# 6. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 7. 检查服务状态
echo "🔍 检查服务状态..."
if command -v docker-compose &> /dev/null; then
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
else
    if docker compose ps | grep -q "Up"; then
        echo "✅ 服务启动成功！"
        echo "📊 服务状态："
        docker compose ps
        
        echo "🌐 服务地址："
        echo "   - API 服务: http://$(curl -s ifconfig.me):3001"
        echo "   - 健康检查: http://$(curl -s ifconfig.me):3001/health"
        
        echo "📝 查看日志："
        echo "   docker compose logs -f nestjs-api"
    else
        echo "❌ 服务启动失败"
        echo "📝 查看错误日志："
        docker compose logs nestjs-api
        exit 1
    fi
fi

echo "🎉 部署完成！" 