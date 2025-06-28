#!/bin/bash

echo "🚀 快速网络问题诊断"
echo "===================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 测试部署相关的网络连接..."

# 1. 测试 GitHub Container Registry
echo -n "测试 GitHub Container Registry (ghcr.io): "
if curl -I --connect-timeout 10 https://ghcr.io > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 可访问${NC}"
else
    echo -e "${RED}❌ 无法访问${NC}"
fi

# 2. 测试 Docker Hub
echo -n "测试 Docker Hub (docker.io): "
if curl -I --connect-timeout 10 https://docker.io > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 可访问${NC}"
else
    echo -e "${RED}❌ 无法访问${NC}"
fi

# 3. 测试 USTC 镜像源
echo -n "测试 USTC 镜像源: "
if curl -I --connect-timeout 10 https://docker.mirrors.ustc.edu.cn > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 可访问${NC}"
else
    echo -e "${RED}❌ 无法访问${NC}"
fi

# 4. 测试 npm 仓库
echo -n "测试 npm 官方仓库: "
if curl -I --connect-timeout 10 https://registry.npmjs.org > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 可访问${NC}"
else
    echo -e "${RED}❌ 无法访问${NC}"
fi

# 5. 测试 npm 淘宝镜像
echo -n "测试 npm 淘宝镜像: "
if curl -I --connect-timeout 10 https://registry.npmmirror.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 可访问${NC}"
else
    echo -e "${RED}❌ 无法访问${NC}"
fi

# 6. 测试具体的 Docker 镜像拉取
echo ""
echo "🐳 测试 Docker 镜像拉取..."

echo -n "拉取 nginx:alpine: "
if timeout 30 docker pull nginx:alpine > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
fi

echo -n "拉取 node:18: "
if timeout 30 docker pull node:18 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
fi

# 7. 测试 GitHub Container Registry 登录
echo ""
echo "🔐 测试 GitHub Container Registry 登录..."
echo "注意：这需要 GITHUB_TOKEN 环境变量"

if [ -n "$GITHUB_TOKEN" ]; then
    echo -n "使用 GITHUB_TOKEN 登录: "
    if echo "$GITHUB_TOKEN" | docker login ghcr.io -u $USER --password-stdin > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 登录成功${NC}"
    else
        echo -e "${RED}❌ 登录失败${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN 未设置${NC}"
fi

# 8. 检查 Docker 配置
echo ""
echo "🔧 Docker 配置检查:"

if [ -f "/etc/docker/daemon.json" ]; then
    echo -e "${GREEN}✅ Docker 配置文件存在${NC}"
    echo "配置内容:"
    cat /etc/docker/daemon.json
else
    echo -e "${YELLOW}⚠️  Docker 配置文件不存在${NC}"
fi

# 9. 检查网络代理
echo ""
echo "🌐 网络代理检查:"
echo "HTTP_PROXY: ${HTTP_PROXY:-未设置}"
echo "HTTPS_PROXY: ${HTTPS_PROXY:-未设置}"

# 10. 提供解决方案
echo ""
echo "💡 基于测试结果的解决方案:"
echo "============================"

echo ""
echo "如果 GitHub Container Registry 无法访问:"
echo "1. 检查防火墙是否阻止了 ghcr.io"
echo "2. 配置网络代理"
echo "3. 使用本地构建方案"

echo ""
echo "如果 Docker Hub 无法访问:"
echo "1. 配置国内镜像源"
echo "2. 使用离线镜像"
echo "3. 配置 Docker 代理"

echo ""
echo "如果 npm 仓库无法访问:"
echo "1. 配置 npm 淘宝镜像源"
echo "2. 使用离线包"
echo "3. 配置网络代理"

echo ""
echo "✅ 快速诊断完成！" 