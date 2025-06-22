# NestJS服务

这是一个使用NestJS框架创建的后端服务，连接到本地MySQL数据库。

## 环境要求

- Node.js (建议 v18+)
- MySQL数据库
- npm或yarn

## 安装和配置

1. 安装依赖：
```bash
npm install
```

2. 配置数据库：
   - 确保MySQL服务已启动
   - 创建数据库：`CREATE DATABASE nest_db;`
   - 在 `.env` 文件中配置数据库连接信息

3. 环境变量配置：
   在根目录创建 `.env` 文件：
```
# 数据库配置
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=qq123456
DB_DATABASE=nest_db

# 应用配置
PORT=3000
NODE_ENV=development
```

## 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

## API端点

- `GET /` - 返回欢迎消息
- `GET /health` - 健康检查，包含数据库连接状态

## 项目结构

```
src/
├── main.ts          # 应用入口
├── app.module.ts    # 根模块
├── app.controller.ts # 控制器
└── app.service.ts   # 服务
```
