#!/bin/bash

echo "🌐 网络诊断脚本"
echo "================"

# 检查网络连接
echo "🔍 检查网络连接..."
echo "DNS 解析测试:"
nslookup docker.io || echo "❌ 无法解析 docker.io"
nslookup registry.npmjs.org || echo "❌ 无法解析 registry.npmjs.org"

echo ""
echo "🌍 测试镜像源连接:"
echo "测试 Docker Hub:"
curl -I https://docker.io 2>/dev/null | head -1 || echo "❌ Docker Hub 连接失败"

echo "测试 USTC 镜像源:"
curl -I https://docker.mirrors.ustc.edu.cn 2>/dev/null | head -1 || echo "❌ USTC 镜像源连接失败"

echo "测试 163 镜像源:"
curl -I https://hub-mirror.c.163.com 2>/dev/null | head -1 || echo "❌ 163 镜像源连接失败"

# 检查 Docker 配置
echo ""
echo "🐳 检查 Docker 配置..."
if [ -f "/etc/docker/daemon.json" ]; then
    echo "✅ Docker 配置文件存在:"
    cat /etc/docker/daemon.json
else
    echo "❌ Docker 配置文件不存在"
fi

# 检查 Docker 服务状态
echo ""
echo "🔧 Docker 服务状态:"
systemctl status docker --no-pager || echo "❌ Docker 服务未运行"

# 测试 Docker 拉取
echo ""
echo "📥 测试 Docker 镜像拉取..."
echo "尝试拉取 node:18 镜像:"
timeout 60 docker pull node:18 || echo "❌ 拉取 node:18 失败"

echo "尝试拉取 node:18-alpine 镜像:"
timeout 60 docker pull node:18-alpine || echo "❌ 拉取 node:18-alpine 失败"

# 检查可用镜像
echo ""
echo "📦 本地可用镜像:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10

# 建议
echo ""
echo "💡 建议:"
echo "1. 如果网络连接失败，检查防火墙设置"
echo "2. 如果 DNS 解析失败，配置 DNS 服务器"
echo "3. 如果镜像拉取失败，使用国内镜像源"
echo "4. 运行: sudo systemctl restart docker"

echo ""
echo "✅ 诊断完成！" 