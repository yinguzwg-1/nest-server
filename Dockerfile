# 使用官方 Node.js 18 镜像作为基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 安装 pnpm
RUN npm install -g pnpm

# 设置 pnpm 配置，使用淘宝镜像源避免网络问题
RUN pnpm config set registry https://registry.npmmirror.com && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 10000 && \
    pnpm config set fetch-retry-maxtimeout 120000

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（包括开发依赖）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用（使用生产专用的 TypeScript 配置）
RUN npx tsc -p tsconfig.build.json

# 删除开发依赖，只保留生产依赖
RUN pnpm prune --prod

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
CMD ["pnpm", "run", "start:prod"] 