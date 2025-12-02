# 系统兼容性指南

## 问题概述

在Linux系统上部署77ai项目时，可能会遇到Node.js版本兼容性问题，特别是glibc库版本过低导致的错误：

```
node: /lib64/libm.so.6: version `GLIBC_2.27' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.25' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.28' not found (required by node)
node: /lib64/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by node)
node: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.20' not found (required by node)
node: /lib64/libstdc++.so.6: version `GLIBCXX_3.4.21' not found (required by node)
```

## 系统兼容性矩阵

| 操作系统 | 版本 | glibc版本 | 推荐部署方式 | 状态 |
|---------|------|-----------|-------------|------|
| CentOS/RHEL | 6.x | 2.12 | Docker | ✅ 支持 |
| CentOS/RHEL | 7.x | 2.17 | Docker | ✅ 支持 |
| CentOS/RHEL | 8.x | 2.28 | 原生/Docker | ✅ 支持 |
| Ubuntu | 16.04 | 2.23 | Docker | ✅ 支持 |
| Ubuntu | 18.04 | 2.27 | 原生/Docker | ✅ 支持 |
| Ubuntu | 20.04 | 2.31 | 原生/Docker | ✅ 支持 |
| Ubuntu | 22.04 | 2.35 | 原生/Docker | ✅ 支持 |
| Debian | 9 | 2.24 | Docker | ✅ 支持 |
| Debian | 10 | 2.28 | 原生/Docker | ✅ 支持 |
| Debian | 11 | 2.31 | 原生/Docker | ✅ 支持 |
| Alpine Linux | 3.12+ | musl | Docker | ✅ 支持 |

## 部署方案详解

### 方案1：Docker部署（推荐所有系统）

**优点：**
- 完全解决系统兼容性问题
- 环境隔离，不影响宿主系统
- 部署简单，一键启动
- 易于扩展和维护

**适用场景：**
- 所有Linux系统
- 生产环境
- 开发环境
- 系统glibc版本低于2.25

**部署步骤：**
```bash
# 1. 克隆项目
git clone https://github.com/l18784175468-oss/77ai.git
cd 77ai

# 2. 使用自动部署脚本
chmod +x deploy.sh
./deploy.sh

# 3. 或手动部署
docker-compose up -d
```

### 方案2：原生部署（仅限高版本系统）

**优点：**
- 性能最佳
- 资源占用少
- 直接访问系统资源

**缺点：**
- 需要系统glibc版本 >= 2.25
- 依赖系统环境
- 可能存在版本冲突

**适用场景：**
- Ubuntu 18.04+
- CentOS 8+
- Debian 10+

**部署步骤：**
```bash
# 1. 检查glibc版本
ldd --version

# 2. 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装项目依赖
npm run install:all

# 4. 配置环境变量
cp .env.example .env

# 5. 启动项目
npm run dev
```

### 方案3：使用旧版本Node.js（兼容方案）

**适用场景：**
- 无法使用Docker的系统
- glibc版本介于2.17-2.24之间

**部署步骤：**
```bash
# 1. 安装Node.js 16（兼容性更好）
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 修改package.json中的engines字段
# 将node版本限制改为: "node": ">=16.0.0 <17.0.0"

# 3. 安装依赖
npm run install:all

# 4. 可能需要降级某些依赖包
npm install some-package@legacy-version
```

### 方案4：从源码编译Node.js（高级方案）

**适用场景：**
- 特殊系统环境
- 需要特定Node.js版本
- 有编译环境的系统

**部署步骤：**
```bash
# 1. 安装编译依赖
sudo apt-get install -y python3 make g++

# 2. 下载Node.js源码
wget https://nodejs.org/dist/v18.17.0/node-v18.17.0.tar.gz
tar -xzf node-v18.17.0.tar.gz
cd node-v18.17.0

# 3. 配置编译选项
./configure --prefix=/usr/local/node18

# 4. 编译安装
make -j$(nproc)
sudo make install

# 5. 添加到PATH
echo 'export PATH=/usr/local/node18/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## 常见问题解决

### 问题1：Docker安装失败

**解决方案：**
```bash
# CentOS/RHEL
sudo yum remove docker docker-common docker-selinux docker-engine
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Ubuntu/Debian
sudo apt-get remove docker docker-engine docker.io containerd runc
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

### 问题2：Docker权限问题

**解决方案：**
```bash
# 将用户添加到docker组
sudo usermod -aG docker $USER

# 重新登录或使用
newgrp docker
```

### 问题3：端口冲突

**解决方案：**
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# 修改docker-compose.yml中的端口映射
ports:
  - "8080:3000"  # 修改前端端口
  - "8081:5000"  # 修改后端端口
```

### 问题4：内存不足

**解决方案：**
```bash
# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 问题5：磁盘空间不足

**解决方案：**
```bash
# 清理Docker未使用的资源
docker system prune -a

# 清理日志文件
sudo journalctl --vacuum-time=7d

# 清理包缓存
sudo apt-get clean
sudo yum clean all
```

## 性能优化建议

### 1. Docker优化

```yaml
# docker-compose.yml中添加资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. 系统优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 3. 数据库优化

```javascript
// MongoDB配置
db.adminCommand({
  setParameter: 1,
  wiredTigerConcurrentReadTransactions: 128
});

db.adminCommand({
  setParameter: 1,
  wiredTigerConcurrentWriteTransactions: 128
});
```

## 监控和日志

### 1. 系统监控

```bash
# 安装htop
sudo apt-get install htop

# 监控资源使用
htop
iostat -x 1
free -h
df -h
```

### 2. Docker监控

```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
```

### 3. 应用监控

```bash
# 查看应用日志
tail -f server/logs/app.log
tail -f server/logs/error.log

# 查看数据库状态
docker-compose exec mongodb mongosh --eval "db.stats()"
```

## 安全建议

### 1. 网络安全

```bash
# 配置防火墙
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. 数据库安全

```javascript
// 创建专用数据库用户
db.createUser({
  user: "77ai_user",
  pwd: "strong_password",
  roles: [
    { role: "readWrite", db: "77ai" }
  ]
});
```

### 3. 应用安全

```bash
# 使用非root用户运行
# 在Dockerfile中已配置
USER nodejs
```

## 总结

1. **Docker部署是最佳选择**，适用于所有系统，完全解决兼容性问题
2. **原生部署需要高版本系统**，glibc版本 >= 2.25
3. **旧版本Node.js可以作为兼容方案**，但可能影响功能
4. **从源码编译适合高级用户**，需要编译环境
5. **生产环境建议使用Docker**，配合监控和安全配置

选择合适的部署方案后，请参考相应的部署步骤进行操作。如遇到问题，请查看常见问题解决部分。