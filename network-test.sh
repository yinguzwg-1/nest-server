#!/bin/bash

echo "🌐 服务器网络问题诊断"
echo "======================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_connection() {
    local url=$1
    local description=$2
    echo -n "测试 $description: "
    
    if curl -I --connect-timeout 10 --max-time 30 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 成功${NC}"
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

test_dns() {
    local domain=$1
    local description=$2
    echo -n "DNS 解析 $description: "
    
    if nslookup "$domain" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 成功${NC}"
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

test_docker_pull() {
    local image=$1
    local description=$2
    echo -n "Docker 拉取 $description: "
    
    if timeout 60 docker pull "$image" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 成功${NC}"
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

# 1. 基本网络连接测试
echo "🔍 1. 基本网络连接测试"
echo "------------------------"
test_connection "https://www.baidu.com" "百度"
test_connection "https://www.google.com" "Google"
test_connection "https://github.com" "GitHub"
test_connection "https://docker.io" "Docker Hub"

# 2. DNS 解析测试
echo ""
echo "📡 2. DNS 解析测试"
echo "------------------"
test_dns "docker.io" "Docker Hub"
test_dns "registry.npmjs.org" "npm 仓库"
test_dns "ghcr.io" "GitHub Container Registry"
test_dns "hub-mirror.c.163.com" "163 镜像源"

# 3. Docker 相关网络测试
echo ""
echo "🐳 3. Docker 相关网络测试"
echo "-------------------------"
test_connection "https://registry-1.docker.io" "Docker Registry"
test_connection "https://docker.mirrors.ustc.edu.cn" "USTC 镜像源"
test_connection "https://hub-mirror.c.163.com" "163 镜像源"
test_connection "https://mirror.baidubce.com" "百度云镜像源"

# 4. GitHub 相关测试
echo ""
echo "📦 4. GitHub 相关测试"
echo "---------------------"
test_connection "https://api.github.com" "GitHub API"
test_connection "https://ghcr.io" "GitHub Container Registry"
test_connection "https://raw.githubusercontent.com" "GitHub Raw"

# 5. npm 相关测试
echo ""
echo "📦 5. npm 相关测试"
echo "------------------"
test_connection "https://registry.npmjs.org" "npm 官方仓库"
test_connection "https://registry.npmmirror.com" "npm 淘宝镜像"

# 6. Docker 拉取测试
echo ""
echo "📥 6. Docker 镜像拉取测试"
echo "-------------------------"
test_docker_pull "nginx:alpine" "nginx:alpine"
test_docker_pull "node:18" "node:18"
test_docker_pull "mysql:8.0" "mysql:8.0"

# 7. 检查 Docker 配置
echo ""
echo "🔧 7. Docker 配置检查"
echo "---------------------"
echo "Docker 版本: $(docker --version)"
echo "Docker Compose 版本: $(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null)"

if [ -f "/etc/docker/daemon.json" ]; then
    echo -e "${GREEN}✅ Docker 配置文件存在:${NC}"
    cat /etc/docker/daemon.json
else
    echo -e "${YELLOW}⚠️  Docker 配置文件不存在${NC}"
fi

# 8. 检查网络代理设置
echo ""
echo "🌐 8. 网络代理检查"
echo "------------------"
echo "HTTP_PROXY: ${HTTP_PROXY:-未设置}"
echo "HTTPS_PROXY: ${HTTPS_PROXY:-未设置}"
echo "NO_PROXY: ${NO_PROXY:-未设置}"

# 9. 检查防火墙状态
echo ""
echo "🔥 9. 防火墙检查"
echo "----------------"
if command -v ufw &> /dev/null; then
    echo "UFW 状态:"
    sudo ufw status
else
    echo "UFW 未安装"
fi

if command -v iptables &> /dev/null; then
    echo "iptables 规则数量: $(sudo iptables -L | wc -l)"
else
    echo "iptables 未安装"
fi

# 10. 网络接口信息
echo ""
echo "🔌 10. 网络接口信息"
echo "-------------------"
echo "网络接口:"
ip addr show | grep -E "inet.*scope global" | head -5

echo ""
echo "路由表:"
ip route | head -5

# 11. 提供修复建议
echo ""
echo "💡 修复建议"
echo "==========="

echo ""
echo "如果网络连接失败:"
echo "1. 检查服务器网络配置"
echo "2. 联系网络管理员或云服务商"
echo "3. 配置网络代理"

echo ""
echo "如果 DNS 解析失败:"
echo "1. 修改 /etc/resolv.conf"
echo "2. 添加备用 DNS: 8.8.8.8, 114.114.114.114"

echo ""
echo "如果 Docker 拉取失败:"
echo "1. 配置 Docker 镜像源"
echo "2. 设置 Docker 代理"
echo "3. 使用离线部署方案"

echo ""
echo "✅ 网络诊断完成！" 