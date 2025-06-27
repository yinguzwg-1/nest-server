#!/bin/bash

echo "🚀 Nest.js 服务器初始化脚本"
echo "================================"

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

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    print_status $RED "❌ 请不要以root用户运行此脚本"
    exit 1
fi

# 1. 更新系统
print_status $BLUE "1. 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 2. 安装必要的软件
print_status $BLUE "2. 安装必要的软件..."
sudo apt install -y curl wget git unzip

# 3. 安装 Node.js
print_status $BLUE "3. 安装 Node.js..."
if ! command -v node &> /dev/null; then
    print_status $YELLOW "安装 Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status $GREEN "✅ Node.js 已安装: $(node --version)"
fi

# 4. 安装 PM2
print_status $BLUE "4. 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    print_status $YELLOW "安装 PM2..."
    sudo npm install -g pm2
else
    print_status $GREEN "✅ PM2 已安装: $(pm2 --version)"
fi

# 5. 创建项目目录
print_status $BLUE "5. 创建项目目录..."
PROJECT_DIR="$HOME/demo"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 6. 克隆项目（如果不存在）
if [ ! -d "nest-server" ]; then
    print_status $YELLOW "克隆项目..."
    git clone https://github.com/yinguzwg-1/demo.git .
else
    print_status $GREEN "✅ 项目目录已存在"
    cd nest-server
    git pull origin main
fi

# 7. 检查目录结构
print_status $BLUE "6. 检查目录结构..."
cd "$PROJECT_DIR/nest-server/nest-server"

if [ ! -f "package.json" ]; then
    print_status $RED "❌ package.json 不存在"
    echo "当前目录: $(pwd)"
    echo "目录内容:"
    ls -la
    exit 1
else
    print_status $GREEN "✅ package.json 存在"
fi

# 8. 安装依赖
print_status $BLUE "7. 安装项目依赖..."
npm install --legacy-peer-deps

# 9. 构建项目
print_status $BLUE "8. 构建项目..."
npm run build

if [ ! -d "dist" ]; then
    print_status $RED "❌ 构建失败，dist 目录不存在"
    exit 1
else
    print_status $GREEN "✅ 构建成功"
fi

# 10. 创建 PM2 配置文件
print_status $BLUE "9. 创建 PM2 配置..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nestjs-api',
    script: 'npm',
    args: 'start:prod',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_USERNAME: 'root',
      DB_PASSWORD: 'qq123456',
      DB_DATABASE: 'nest_db'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# 11. 创建日志目录
mkdir -p logs

# 12. 启动服务
print_status $BLUE "10. 启动 PM2 服务..."
pm2 start ecosystem.config.js
pm2 save

# 13. 设置 PM2 开机自启
print_status $BLUE "11. 设置 PM2 开机自启..."
pm2 startup
print_status $YELLOW "请运行上面输出的命令来设置开机自启"

# 14. 检查服务状态
print_status $BLUE "12. 检查服务状态..."
sleep 5
pm2 status

# 15. 健康检查
print_status $BLUE "13. 健康检查..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status $GREEN "✅ 服务运行正常"
else
    print_status $YELLOW "⚠️  服务可能仍在启动中，请稍后检查"
fi

# 16. 显示信息
print_status $GREEN "🎉 服务器初始化完成！"
echo ""
print_status $BLUE "📋 重要信息："
echo "项目目录: $PROJECT_DIR/nest-server/nest-server"
echo "PM2 服务名: nestjs-api"
echo "API 端口: 3000"
echo ""
print_status $YELLOW "📋 常用命令："
echo "查看服务状态: pm2 status"
echo "查看日志: pm2 logs nestjs-api"
echo "重启服务: pm2 restart nestjs-api"
echo "停止服务: pm2 stop nestjs-api"
echo "删除服务: pm2 delete nestjs-api"
echo ""
print_status $BLUE "🔧 下一步："
echo "1. 确保防火墙允许 3000 端口"
echo "2. 配置域名和 SSL（如需要）"
echo "3. 设置数据库连接"
echo "4. 配置环境变量" 