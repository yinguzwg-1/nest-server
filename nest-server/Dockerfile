# 使用官方 Node.js 18 镜像作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 设置 npm 配置，使用淘宝镜像源避免网络问题
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set timeout 300000

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci --no-audit --no-fund --prefer-offline || \
    (echo "⚠️ npm ci 失败，尝试 npm install..." && npm install --no-audit --no-fund)

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 删除开发依赖，只保留生产依赖
RUN npm prune --production

# 创建非 root 用户
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

# 更改文件所有权
RUN chown -R nestjs:nodejs /app
USER nestjs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 启动应用
CMD ["npm", "run", "start:prod"] 