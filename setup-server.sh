#!/bin/bash

echo "🚀 服务器设置脚本"
echo "=================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 1. 检查当前用户
print_status $BLUE "1. 检查当前用户..."
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"

# 2. 创建项目目录
print_status $BLUE "2. 创建项目目录..."
PROJECT_DIR="$HOME/nest-server"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 3. 克隆项目（如果不存在）
if [ ! -d ".git" ]; then
    print_status $YELLOW "克隆项目..."
    git clone https://github.com/yinguzwg-1/demo.git .
else
    print_status $GREEN "✅ 项目已存在，拉取最新代码..."
    git pull origin main
fi

# 4. 检查目录结构
print_status $BLUE "3. 检查目录结构..."
echo "📁 项目根目录: $(pwd)"
echo "📁 目录内容:"
ls -la

if [ -d "nest-server" ]; then
    echo "📁 nest-server 目录内容:"
    ls -la nest-server/
    
    if [ -f "nest-server/package.json" ]; then
        print_status $GREEN "✅ package.json 存在"
    else
        print_status $RED "❌ package.json 不存在"
    fi
else
    print_status $RED "❌ nest-server 目录不存在"
fi

# 5. 安装 Node.js（如果需要）
print_status $BLUE "4. 检查 Node.js..."
if ! command -v node &> /dev/null; then
    print_status $YELLOW "安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status $GREEN "✅ Node.js 已安装: $(node --version)"
fi

# 6. 安装 PM2（如果需要）
print_status $BLUE "5. 检查 PM2..."
if ! command -v pm2 &> /dev/null; then
    print_status $YELLOW "安装 PM2..."
    sudo npm install -g pm2
else
    print_status $GREEN "✅ PM2 已安装: $(pm2 --version)"
fi

# 7. 显示最终信息
print_status $GREEN "🎉 服务器设置完成！"
echo ""
print_status $BLUE "📋 重要信息："
echo "项目目录: $PROJECT_DIR"
echo "Nest.js 目录: $PROJECT_DIR/nest-server"
echo ""
print_status $YELLOW "📋 下一步："
echo "1. 进入 Nest.js 目录: cd $PROJECT_DIR/nest-server"
echo "2. 安装依赖: npm install --legacy-peer-deps"
echo "3. 构建项目: npm run build"
echo "4. 启动服务: pm2 start ecosystem.config.js"
echo ""
print_status $BLUE "📋 常用命令："
echo "查看服务状态: pm2 status"
echo "查看日志: pm2 logs nestjs-api"
echo "重启服务: pm2 restart nestjs-api" 