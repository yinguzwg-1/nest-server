# 阿里云 NestJS 服务部署指南

## 问题说明
在阿里云服务器上部署时，经常会遇到 Docker Hub 网络超时问题：
```
mysql Error Get "https://registry-1.docker.io/v2/": context deadline exceeded
```

## 解决方案

### 1. 配置 Docker 镜像源
在阿里云服务器上执行以下命令：

```bash
# 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 配置国内镜像源
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://registry.docker-cn.com"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 2. 快速部署
使用提供的脚本快速部署：

```bash
# 给脚本添加执行权限
chmod +x deploy-aliyun.sh
chmod +x quick-deploy-aliyun.sh

# 方式1：完整部署（推荐）
./deploy-aliyun.sh

# 方式2：快速部署
./quick-deploy-aliyun.sh
```

### 3. 手动部署步骤

如果不想使用脚本，可以手动执行：

```bash
# 1. 清理旧容器
docker-compose down --remove-orphans
docker system prune -f

# 2. 构建服务（使用 BuildKit 加速）
DOCKER_BUILDKIT=1 docker-compose build --no-cache

# 3. 启动服务
docker-compose up -d

# 4. 检查状态
docker-compose ps
docker-compose logs -f nestjs-api
```

### 4. 网络优化配置

#### Dockerfile 优化
- 使用淘宝 npm 镜像源
- 增加网络超时时间
- 添加重试机制

#### docker-compose 优化
- 使用国内镜像源
- 配置资源限制
- 添加健康检查

### 5. 常见问题解决

#### 问题1：npm 安装超时
```bash
# 在 Dockerfile 中已配置淘宝镜像源
npm config set registry https://registry.npmmirror.com
```

#### 问题2：Docker 拉取镜像超时
```bash
# 使用国内镜像源（已在 daemon.json 中配置）
# 或者使用阿里云容器镜像服务
```

#### 问题3：构建失败
```bash
# 清理缓存重新构建
docker system prune -a
DOCKER_BUILDKIT=1 docker-compose build --no-cache
```

### 6. 验证部署

```bash
# 检查服务状态
docker-compose ps

# 测试 API 接口
curl http://localhost:3001/health

# 查看日志
docker-compose logs -f nestjs-api
```

### 7. 性能优化建议

1. **使用 BuildKit**：`DOCKER_BUILDKIT=1`
2. **多阶段构建**：减少最终镜像大小
3. **缓存优化**：合理使用 Docker 层缓存
4. **资源限制**：避免容器占用过多资源

### 8. 监控和维护

```bash
# 查看容器资源使用
docker stats

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 更新服务
docker-compose pull && docker-compose up -d
```

## 注意事项

1. 确保服务器防火墙开放 3001 端口
2. 数据库连接配置正确
3. 定期清理 Docker 缓存和日志
4. 监控服务健康状态

## 故障排除

如果部署失败，请检查：
1. Docker 服务状态：`sudo systemctl status docker`
2. 网络连接：`ping registry-1.docker.io`
3. 磁盘空间：`df -h`
4. 内存使用：`free -h` 