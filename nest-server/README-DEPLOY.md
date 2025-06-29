# NestJS 服务部署说明

## 目录结构
```
nest-server/nest-server/
├── simple-docker.sh    # 最简单的 Docker 部署（推荐）
├── docker-deploy.sh    # 完整的 Docker 部署
├── deploy.sh           # Docker Compose 部署
├── quick-deploy.sh     # 快速 Docker Compose 部署
├── docker-compose.yml  # Docker Compose 配置
├── Dockerfile          # Docker 构建文件
└── ...
```

## 部署方式

### 方式1：简单 Docker 部署（推荐，类似 airbnb 服务）
```bash
cd nest-server/nest-server
chmod +x simple-docker.sh
./simple-docker.sh
```

### 方式2：完整 Docker 部署
```bash
cd nest-server/nest-server
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### 方式3：Docker Compose 部署
```bash
cd nest-server/nest-server
chmod +x deploy.sh
./deploy.sh
```

## 为什么选择简单 Docker 部署？

1. **与 airbnb 服务一致**：使用 `docker run` 命令，通过 `docker ps` 查看
2. **无需 Docker Compose**：不需要额外的工具
3. **简单直接**：构建镜像 → 启动容器
4. **易于管理**：使用标准的 Docker 命令

## 验证部署

```bash
# 查看容器状态（类似 airbnb 服务）
docker ps

# 查看日志
docker logs -f nest_api

# 测试 API
curl http://localhost:3001/health

# 停止服务
docker stop nest_api

# 重启服务
docker restart nest_api
```

## 管理命令

```bash
# 查看所有容器
docker ps -a

# 查看容器资源使用
docker stats nest_api

# 进入容器
docker exec -it nest_api sh

# 删除容器和镜像
docker stop nest_api && docker rm nest_api
docker rmi nestjs-api
```

## 解决的问题

1. **网络超时**：Dockerfile 中已配置淘宝镜像源
2. **构建问题**：修复了 nest 命令找不到的问题
3. **部署简化**：使用与 airbnb 服务相同的部署方式

## 故障排除

1. **权限问题**：确保脚本有执行权限
2. **网络问题**：脚本会自动配置镜像源
3. **Docker Compose 问题**：脚本会自动检测和安装 