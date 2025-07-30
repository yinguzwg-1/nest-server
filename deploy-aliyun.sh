#!/bin/bash

# 阿里云服务器专用部署脚本
# 针对网络延迟和超时问题进行优化

set -e

echo "🚀 开始阿里云服务器部署..."

# 配置环境变量
export NODE_ENV=production
export PATH=$PATH:/usr/local/bin

# 网络优化配置
configure_network() {
    echo "🌐 配置网络优化..."
    
    # 设置npm镜像源为淘宝镜像
    npm config set registry https://registry.npmmirror.com
    npm config set disturl https://npmmirror.com/dist
    npm config set sass_binary_site https://npmmirror.com/mirrors/node-sass/
    npm config set electron_mirror https://npmmirror.com/mirrors/electron/
    npm config set puppeteer_download_host https://npmmirror.com/mirrors/
    npm config set chromedriver_cdnurl https://npmmirror.com/mirrors/chromedriver
    npm config set operadriver_cdnurl https://npmmirror.com/mirrors/operadriver
    npm config set phantomjs_cdnurl https://npmmirror.com/mirrors/phantomjs/
    npm config set selenium_cdnurl https://npmmirror.com/mirrors/selenium/
    npm config set node_inspector_cdnurl https://npmmirror.com/mirrors/node-inspector/
    
    # 设置pnpm镜像源
    pnpm config set registry https://registry.npmmirror.com
    
    echo "✅ 网络配置完成"
}

# 检查并安装依赖（带重试和超时）
install_dependencies() {
    local max_retries=5
    local retry_count=0
    
    echo "📦 检查系统依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo "📦 安装 Node.js..."
        while [ $retry_count -lt $max_retries ]; do
            if curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs; then
                echo "✅ Node.js 安装成功"
                break
            else
                echo "⚠️ Node.js 安装失败，重试中... ($((retry_count + 1))/$max_retries)"
                retry_count=$((retry_count + 1))
                sleep 30
            fi
        done
        
        if [ $retry_count -eq $max_retries ]; then
            echo "❌ Node.js 安装失败"
            return 1
        fi
    fi
    
    # 检查PM2
    if ! command -v pm2 &> /dev/null; then
        echo "📦 安装 PM2..."
        retry_count=0
        while [ $retry_count -lt $max_retries ]; do
            if timeout 600 sudo npm install -g pm2 --timeout=600000; then
                echo "✅ PM2 安装成功"
                break
            else
                echo "⚠️ PM2 安装失败，重试中... ($((retry_count + 1))/$max_retries)"
                retry_count=$((retry_count + 1))
                sleep 30
            fi
        done
        
        if [ $retry_count -eq $max_retries ]; then
            echo "❌ PM2 安装失败"
            return 1
        fi
    fi
    
    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "📦 安装 pnpm..."
        retry_count=0
        while [ $retry_count -lt $max_retries ]; do
            if timeout 600 sudo npm install -g pnpm --timeout=600000; then
                echo "✅ pnpm 安装成功"
                break
            else
                echo "⚠️ pnpm 安装失败，重试中... ($((retry_count + 1))/$max_retries)"
                retry_count=$((retry_count + 1))
                sleep 30
            fi
        done
        
        if [ $retry_count -eq $max_retries ]; then
            echo "❌ pnpm 安装失败"
            return 1
        fi
    fi
    
    echo "✅ 所有依赖安装完成"
    return 0
}

# 安装项目依赖（带重试和超时）
install_project_deps() {
    local max_retries=5
    local retry_count=0
    
    echo "📦 安装项目依赖..."
    
    while [ $retry_count -lt $max_retries ]; do
        echo "📦 安装项目依赖 (尝试 $((retry_count + 1))/$max_retries)..."
        
        if timeout 900 pnpm install --frozen-lockfile --prefer-offline --network-timeout=300000; then
            echo "✅ 项目依赖安装完成"
            return 0
        else
            echo "⚠️ 项目依赖安装失败，重试中..."
            retry_count=$((retry_count + 1))
            sleep 60
        fi
    done
    
    echo "❌ 项目依赖安装失败，已达到最大重试次数"
    return 1
}

# 构建项目（带超时）
build_project() {
    echo "🏗️ 构建项目..."
    
    if timeout 900 pnpm run build; then
        echo "✅ 项目构建完成"
        return 0
    else
        echo "❌ 项目构建失败"
        return 1
    fi
}

# 配置PM2
setup_pm2() {
    echo "📝 配置 PM2..."
    
    # 创建 PM2 配置文件
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nest-server',
    script: 'npm',
    args: 'run start:prod',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_HOST: '223.4.248.176',
      DB_PORT: 3306,
      DB_USERNAME: 'deploy_user',
      DB_PASSWORD: 'qq123456',
      DB_DATABASE: 'nest_db',
      YOUDAO_APP_KEY: '20220529001233310',
      YOUDAO_APP_SECRET: 'yuM_bOR5cbjZVttocWs1'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    ignore_watch: ['node_modules', 'logs', 'dist'],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
    
    # 创建日志目录
    mkdir -p logs
    
    echo "✅ PM2 配置完成"
}

# 启动服务
start_service() {
    echo "🚀 启动服务..."
    
    # 停止现有进程
    pm2 stop nest-server || true
    pm2 delete nest-server || true
    
    # 启动新进程
    pm2 start ecosystem.config.js --env production
    
    # 保存配置
    pm2 save
    
    # 设置开机自启
    pm2 startup
    
    echo "✅ 服务启动完成"
}

# 健康检查（带重试）
health_check() {
    local max_attempts=30
    local attempt=1
    
    echo "🔍 执行健康检查..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f --connect-timeout 15 --max-time 45 http://localhost:3001/health > /dev/null 2>&1; then
            echo "✅ 健康检查通过！"
            return 0
        else
            echo "⏳ 等待应用启动... ($attempt/$max_attempts)"
            sleep 5
            attempt=$((attempt + 1))
        fi
    done
    
    echo "❌ 健康检查失败"
    return 1
}

# 主执行流程
main() {
    echo "开始阿里云服务器部署流程..."
    
    # 配置网络
    configure_network
    
    # 安装依赖
    if ! install_dependencies; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    
    # 确保MySQL服务运行
    sudo systemctl start mysql || true
    
    # 安装项目依赖
    if ! install_project_deps; then
        echo "❌ 项目依赖安装失败"
        exit 1
    fi
    
    # 构建项目
    if ! build_project; then
        echo "❌ 项目构建失败"
        exit 1
    fi
    
    # 配置PM2
    setup_pm2
    
    # 启动服务
    start_service
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 20
    
    # 检查服务状态
    echo "📋 检查服务状态..."
    pm2 status
    
    # 健康检查
    if health_check; then
        echo "✅ 部署成功！"
        echo "🌐 API 地址: http://localhost:3001"
        echo "🌐 健康检查: http://localhost:3001/health"
        echo "📊 PM2 状态:"
        pm2 show nest-server
        echo "🎉 阿里云服务器部署完成！"
    else
        echo "⚠️ 健康检查失败，但应用可能仍在启动中"
        echo "📋 PM2 状态:"
        pm2 status
        echo "📋 最近日志:"
        pm2 logs nest-server --lines 10
        echo "⚠️ 部署流程完成，请手动检查应用状态"
        exit 1
    fi
}

# 执行主函数
main "$@" 