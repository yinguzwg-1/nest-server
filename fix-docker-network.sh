#!/bin/bash

echo "🔧 修复 Docker 网络问题..."

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 创建 Docker 配置目录
mkdir -p /etc/docker

# 配置 Docker 镜像源
echo "📝 配置 Docker 镜像源..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
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
systemctl daemon-reload
systemctl restart docker

# 等待 Docker 启动
echo "⏳ 等待 Docker 启动..."
sleep 10

# 测试 Docker 是否正常工作
if docker info > /dev/null 2>&1; then
    echo "✅ Docker 配置成功"
else
    echo "❌ Docker 配置失败"
    exit 1
fi

# 预拉取常用镜像
echo "📥 预拉取常用镜像..."
docker pull mysql:8.0 || echo "MySQL 镜像拉取失败"
docker pull nginx:alpine || echo "Nginx 镜像拉取失败"

echo "🎉 Docker 网络修复完成！"
echo "💡 提示：如果仍有网络问题，请检查服务器网络连接" 