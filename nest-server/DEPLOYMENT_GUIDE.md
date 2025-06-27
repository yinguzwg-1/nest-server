# Nest.js 服务部署指南

## 📋 概述

本项目包含两个 GitHub Actions 工作流：

### 1. 🚀 Auto Build and Deploy (`auto-deploy.yml`)
- **触发条件**: 推送到 main/master 分支或手动触发
- **功能**: 构建 Nest.js 应用、推送 Docker 镜像、部署到服务器
- **包含**: 构建 + 部署

### 2. 🐳 Build and Push Docker Image (`build.yml`)
- **触发条件**: 推送到 main/master 分支或手动触发
- **功能**: 仅构建和推送 Docker 镜像
- **包含**: 仅构建

## 🔧 前置要求

### GitHub Secrets 配置

在 GitHub 仓库中配置以下 secrets：

| Secret 名称 | 描述 | 示例值 |
|------------|------|--------|
| `HOST` | 服务器 IP 地址 | `223.4.248.176` |
| `USERNAME` | SSH 用户名 | `root` |
| `SSH_KEY` | SSH 私钥内容 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PORT` | SSH 端口 | `22` |

### 服务器环境要求

- Node.js 18.x 或更高版本
- PM2 进程管理器
- MySQL 数据库（可选，用于数据存储）

## 🚀 部署流程

### 自动部署

1. **推送代码到 main 分支**
   ```bash
   git add .
   git commit -m "feat: 新功能"
   git push origin main
   ```

2. **GitHub Actions 自动执行**：
   - 构建 Nest.js 应用
   - 推送 Docker 镜像到 GitHub Container Registry
   - 部署到服务器

### 手动部署

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 选择 `🚀 Nest.js Auto Build and Deploy` 工作流
4. 点击 `Run workflow`
5. 选择部署环境（production/staging）
6. 点击 `Run workflow`

## 📊 服务信息

### 部署后服务信息

- **服务名称**: `nestjs-api`
- **端口**: 3000
- **访问地址**: `http://your-server-ip:3000`
- **进程管理**: PM2

### 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs nestjs-api

# 重启服务
pm2 restart nestjs-api

# 停止服务
pm2 stop nestjs-api

# 查看详细信息
pm2 show nestjs-api
```

## 🔍 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本兼容性
   - 确保所有依赖都已安装
   - 查看 GitHub Actions 日志

2. **部署失败**
   - 检查 SSH 连接
   - 验证服务器上的 Node.js 状态
   - 确认环境变量配置正确

3. **服务无法访问**
   - 检查防火墙设置
   - 验证端口配置
   - 查看 PM2 日志

### 调试命令

```bash
# 检查 Node.js 版本
node --version

# 检查 PM2 状态
pm2 status

# 查看详细日志
pm2 logs nestjs-api --lines 50

# 检查端口占用
netstat -tlnp | grep :3000

# 测试 API 连接
curl http://localhost:3000
```

## 📈 性能优化

### PM2 配置优化

```javascript
module.exports = {
  apps: [{
    name: 'nestjs-api',
    script: 'npm',
    args: 'start:prod',
    instances: 'max', // 使用所有 CPU 核心
    exec_mode: 'cluster', // 集群模式
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 监控和日志

- **日志位置**: `./logs/`
- **错误日志**: `./logs/err.log`
- **输出日志**: `./logs/out.log`
- **综合日志**: `./logs/combined.log`

## 🔐 安全配置

### 环境变量

确保在生产环境中正确配置敏感信息：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=your_database

# 应用配置
NODE_ENV=production
PORT=3000
```

### 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 3000/tcp # Nest.js API
sudo ufw enable
```

## 📞 支持

如果遇到问题，请：

1. 查看 GitHub Actions 日志
2. 检查服务器 PM2 日志
3. 验证环境配置
4. 联系技术支持 