#!/bin/bash

echo "🔧 修复 Nest.js 部署路径问题"
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

# 1. 检查当前目录
print_status $BLUE "1. 检查当前目录..."
echo "当前目录: $(pwd)"
echo "目录内容:"
ls -la

# 2. 查找 package.json
print_status $BLUE "2. 查找 package.json..."
if [ -f "package.json" ]; then
    print_status $GREEN "✅ 当前目录包含 package.json"
elif [ -f "nest-server/package.json" ]; then
    print_status $YELLOW "📁 找到 package.json 在 nest-server/ 目录"
    cd nest-server
elif [ -f "nest-server/nest-server/package.json" ]; then
    print_status $YELLOW "📁 找到 package.json 在 nest-server/nest-server/ 目录"
    cd nest-server/nest-server
else
    print_status $RED "❌ 找不到 package.json"
    echo "请确保在正确的项目目录中运行此脚本"
    exit 1
fi

# 3. 确认当前目录
print_status $BLUE "3. 确认当前目录..."
echo "当前目录: $(pwd)"
echo "package.json 内容预览:"
head -5 package.json

# 4. 检查 Node.js 和 npm
print_status $BLUE "4. 检查 Node.js 环境..."
if command -v node &> /dev/null; then
    print_status $GREEN "✅ Node.js: $(node --version)"
else
    print_status $RED "❌ Node.js 未安装"
    exit 1
fi

if command -v npm &> /dev/null; then
    print_status $GREEN "✅ npm: $(npm --version)"
else
    print_status $RED "❌ npm 未安装"
    exit 1
fi

# 5. 清理并重新安装
print_status $BLUE "5. 清理并重新安装依赖..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# 6. 构建项目
print_status $BLUE "6. 构建项目..."
npm run build

if [ ! -d "dist" ]; then
    print_status $RED "❌ 构建失败，dist 目录不存在"
    exit 1
else
    print_status $GREEN "✅ 构建成功"
    echo "dist 目录内容:"
    ls -la dist/
fi

# 7. 检查 PM2
print_status $BLUE "7. 检查 PM2..."
if command -v pm2 &> /dev/null; then
    print_status $GREEN "✅ PM2 已安装"
else
    print_status $YELLOW "安装 PM2..."
    sudo npm install -g pm2
fi

# 8. 停止现有服务
print_status $BLUE "8. 停止现有服务..."
pm2 stop nestjs-api 2>/dev/null || true
pm2 delete nestjs-api 2>/dev/null || true

# 9. 创建 PM2 配置
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

# 10. 创建日志目录
mkdir -p logs

# 11. 启动服务
print_status $BLUE "10. 启动 PM2 服务..."
pm2 start ecosystem.config.js
pm2 save

# 12. 检查服务状态
print_status $BLUE "11. 检查服务状态..."
sleep 5
pm2 status

# 13. 健康检查
print_status $BLUE "12. 健康检查..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status $GREEN "✅ 服务运行正常"
    echo "🌐 API 地址: http://localhost:3000"
else
    print_status $YELLOW "⚠️  服务可能仍在启动中"
    echo "📋 查看日志: pm2 logs nestjs-api"
fi

print_status $GREEN "🎉 部署修复完成！"
echo ""
print_status $BLUE "📋 重要信息："
echo "项目目录: $(pwd)"
echo "PM2 服务名: nestjs-api"
echo "API 端口: 3000"
echo ""
print_status $YELLOW "📋 常用命令："
echo "查看服务状态: pm2 status"
echo "查看日志: pm2 logs nestjs-api"
echo "重启服务: pm2 restart nestjs-api" 