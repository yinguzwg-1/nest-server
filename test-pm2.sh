#!/bin/bash

# PM2配置测试脚本
echo "测试PM2配置..."

# 检查当前目录
echo "当前目录: $(pwd)"

# 检查构建输出
echo "检查构建输出..."
if [ -f "dist/src/main.js" ]; then
    echo "✅ dist/src/main.js 存在"
    ls -la dist/src/main.js
else
    echo "❌ dist/src/main.js 不存在"
    echo "请先运行: npm run build"
    exit 1
fi

# 检查package.json脚本
echo "检查package.json脚本..."
if grep -q "start:prod" package.json; then
    echo "✅ start:prod 脚本存在"
    grep "start:prod" package.json
else
    echo "❌ start:prod 脚本不存在"
    exit 1
fi

# 检查ecosystem.config.js
echo "检查ecosystem.config.js..."
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js 存在"
    cat ecosystem.config.js
else
    echo "❌ ecosystem.config.js 不存在"
    exit 1
fi

# 测试PM2配置
echo "测试PM2配置..."
pm2 start ecosystem.config.js --env production --dry-run

echo "测试完成！" 