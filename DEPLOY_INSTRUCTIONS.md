# 阿里云部署说明

## 问题解决

### 1. Docker Compose 未安装
如果遇到 `docker-compose: command not found` 错误，脚本会自动安装 Docker Compose。

### 2. 目录结构
确保在正确的目录中运行脚本：

```bash
# 正确的目录结构
nest-server/
├── nest-server/          # NestJS 项目目录
├── docker-compose.yml    # Docker Compose 配置
├── deploy-aliyun.sh      # 部署脚本
└── ...

# 在 nest-server 目录中运行脚本
cd nest-server
./deploy-aliyun.sh
```

## 部署步骤

### 方式1：完整部署（推荐）
```bash
chmod +x deploy-aliyun.sh
./deploy-aliyun.sh
```

### 方式2：快速部署
```bash
chmod +x quick-deploy-aliyun.sh
./quick-deploy-aliyun.sh
```

### 方式3：简单部署
```bash
chmod +x simple-deploy.sh
./simple-deploy.sh
```

## 手动安装 Docker Compose

如果脚本无法自动安装，可以手动安装：

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 创建软链接
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# 验证安装
docker-compose --version
```

## 验证部署

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f nestjs-api

# 测试 API
curl http://localhost:3001/health
```

## 故障排除

1. **Docker Compose 未安装**：脚本会自动安装
2. **网络超时**：已配置国内镜像源
3. **权限问题**：确保脚本有执行权限
4. **目录错误**：确保在 nest-server 目录中运行 