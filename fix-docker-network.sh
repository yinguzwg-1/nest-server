#!/bin/bash

echo "🔧 修复 Docker 网络问题"
echo "======================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 当前 Docker 配置:"
if [ -f "/etc/docker/daemon.json" ]; then
    cat /etc/docker/daemon.json
else
    echo -e "${YELLOW}⚠️  Docker 配置文件不存在${NC}"
fi

echo ""
echo "🔄 更新 Docker 镜像源配置..."

# 创建新的 Docker 配置
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://registry.docker-cn.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false
}
EOF

echo -e "${GREEN}✅ Docker 配置已更新${NC}"

# 重启 Docker 服务
echo ""
echo "🔄 重启 Docker 服务..."
sudo systemctl daemon-reload
sudo systemctl restart docker

# 等待 Docker 启动
echo "⏳ 等待 Docker 服务启动..."
sleep 10

# 测试新的配置
echo ""
echo "🧪 测试新的配置..."

# 测试镜像源连接
echo "测试腾讯云镜像源:"
if curl -I --connect-timeout 10 https://mirror.ccs.tencentyun.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 腾讯云镜像源可访问${NC}"
else
    echo -e "${RED}❌ 腾讯云镜像源无法访问${NC}"
fi

echo "测试 Docker 中国镜像源:"
if curl -I --connect-timeout 10 https://registry.docker-cn.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker 中国镜像源可访问${NC}"
else
    echo -e "${RED}❌ Docker 中国镜像源无法访问${NC}"
fi

# 测试 Docker 镜像拉取
echo ""
echo "🐳 测试 Docker 镜像拉取..."

echo -n "拉取 nginx:alpine: "
if timeout 60 docker pull nginx:alpine > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
fi

echo -n "拉取 node:18: "
if timeout 60 docker pull node:18 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 成功${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
fi

# 如果还是失败，尝试配置代理
echo ""
echo "🌐 检查是否需要配置代理..."

# 检查是否有可用的代理
if [ -n "$HTTP_PROXY" ] || [ -n "$HTTPS_PROXY" ]; then
    echo -e "${GREEN}✅ 检测到代理设置${NC}"
    echo "HTTP_PROXY: $HTTP_PROXY"
    echo "HTTPS_PROXY: $HTTPS_PROXY"
else
    echo -e "${YELLOW}⚠️  未检测到代理设置${NC}"
    echo "如果需要配置代理，请设置以下环境变量："
    echo "export HTTP_PROXY=http://proxy.company.com:8080"
    echo "export HTTPS_PROXY=http://proxy.company.com:8080"
fi

# 提供手动配置选项
echo ""
echo "💡 如果自动配置失败，可以手动尝试以下方案："

echo ""
echo "方案 1: 使用阿里云镜像源"
echo "sudo tee /etc/docker/daemon.json << 'EOF'"
echo "{"
echo '  "registry-mirrors": ["https://docker.mirrors.aliyuncs.com"]'
echo "}"
echo "EOF"

echo ""
echo "方案 2: 使用腾讯云镜像源"
echo "sudo tee /etc/docker/daemon.json << 'EOF'"
echo "{"
echo '  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]'
echo "}"
echo "EOF"

echo ""
echo "方案 3: 配置网络代理"
echo "sudo mkdir -p /etc/systemd/system/docker.service.d"
echo "sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf << 'EOF'"
echo "[Service]"
echo 'Environment="HTTP_PROXY=http://proxy.company.com:8080"'
echo 'Environment="HTTPS_PROXY=http://proxy.company.com:8080"'
echo 'Environment="NO_PROXY=localhost,127.0.0.1"'
echo "EOF"

echo ""
echo "✅ 修复脚本执行完成！"
echo "如果问题仍然存在，请尝试手动配置方案。" 