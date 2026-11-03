# 部署指南

面向生产环境的部署步骤。本项目是一个 Node 进程，对外暴露公开服务（表单），后台服务仅限白名单 IP。

## 1. 前置条件

- Node.js 20.6+（用到了 `--env-file`）
- 一台服务器（云主机 / VPS）
- 一个域名 + HTTPS 证书（强烈建议，见下文）

## 2. 拉取代码 + 安装

```sh
git clone <repo> /opt/cuddolab
cd /opt/cuddolab
npm ci --omit=dev      # 仅装运行依赖
```

## 3. 配置环境变量

```sh
cp .env.example .env
```

编辑 `.env`，关键项：

```ini
ADMIN_ALLOWED_IPS=<公司办公室出口 IP>   # 在办公室网络打开 https://ifconfig.me 获取
TRUST_PROXY=true                        # 后台位于 nginx / 负载均衡之后时必须设
```

> ⚠️ 若用反向代理，`TRUST_PROXY=true` **必须**设置，否则限流与 IP 白名单都会读到代理 IP 而失效。

## 4. 进程守护（二选一）

服务本身不负责自启 / 崩溃重启，需要进程管理器托管。

### 方式 A：pm2（推荐，简单）

```sh
npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save            # 保存进程列表
pm2 startup         # 生成开机自启脚本，按提示执行
```

日志在 `logs/out.log` 与 `logs/err.log`，或 `pm2 logs cuddolab`。

### 方式 B：systemd

```sh
sudo cp deploy/cuddolab.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cuddolab
journalctl -u cuddolab -f     # 看日志
```

两种方式都已配置：崩溃自动重启、开机自启、给优雅关闭留足时间（约 11 秒）。

## 5. HTTPS 反向代理（nginx 示例）

公开服务建议放在 nginx 后面并启用 HTTPS（证书可用 Let's Encrypt / Caddy / Cloudflare）：

```nginx
server {
    listen 443 ssl;
    server_name feedback.example.com;

    ssl_certificate     /etc/letsencrypt/live/feedback.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/feedback.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;   # 公开服务
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

后台服务（3001）**不要**经 nginx 暴露到公网；运营在办公室网络内直接访问 `http://<服务器内网/IP>:3001`，由 IP 白名单放行。

> 🔒 双保险建议：在云服务器安全组里，把端口 **3001** 限制为只允许办公室 IP 入站。这样网络层 + 应用层都挡住，最稳。

## 6. 数据库备份（务必配置）

`feedback.db` 是唯一的数据副本，配置定时备份：

```sh
# 手动备份一次
npm run backup

# 加到 crontab（每天凌晨 3 点），保留最近 14 份
0 3 * * * cd /opt/cuddolab && /usr/bin/node scripts/backup.js >> logs/backup.log 2>&1
```

备份文件在 `backups/`。建议再用 `rsync` / 对象存储把 `backups/` 同步到**异地**，防止整机故障。

## 7. 健康检查

- 公开服务：`GET http://127.0.0.1:3000/healthz`
- 后台服务：`GET http://127.0.0.1:3001/healthz`

返回 `{"status":"ok"}` 表示进程存活且数据库可达；可接入负载均衡 / 监控探活。

## 升级

```sh
cd /opt/cuddolab
git pull
npm ci --omit=dev
pm2 reload cuddolab        # 或 sudo systemctl restart cuddolab
```

---

# Docker 部署（替代方案）

不想装 Node / pm2，可用 Docker。仓库已提供 `Dockerfile`、`.dockerignore`、`docker-compose.yml`。

### 1. 配置

```sh
cp .env.example .env
```

编辑 `.env`（**容器内必须设 `TRUST_PROXY=true`**，原因见下）：

```ini
ADMIN_ALLOWED_IPS=<公司办公室出口 IP>
TRUST_PROXY=true
# 不要设 ADMIN_PUBLIC
```

### 2. 启动

容器内应用以非 root 的 `node`（uid 1000）运行，而挂载卷 `./data` 默认归 root 所有，
直接启动会因无权写库而崩溃（`SqliteError: unable to open database file`）。
**首次启动前先建好数据目录并授权：**

```sh
mkdir -p data
sudo chown -R 1000:1000 data    # 让容器内 node 用户可写
```

然后构建并启动：

```sh
docker compose up -d --build
docker compose logs -f          # 看日志
```

- 镜像用多阶段构建，会在构建阶段编译原生依赖 `better-sqlite3`
- 进程以非 root 的 `node` 用户运行
- `docker compose` 已配置：崩溃自动重启、`init` 转发信号、`stop_grace_period: 15s` 配合优雅关闭、内置 healthcheck

### 3. 数据持久化（重要）

数据库与备份写在容器内 `/data`，已通过卷挂载到宿主机 `./data`：

```yaml
volumes:
  - ./data:/data
```

**只要保留宿主机的 `./data` 目录，容器删了重建数据都不会丢。** 千万不要把数据库留在容器内层。

### 4. 网络与真实 IP（关键）

`docker-compose.yml` 把两个端口都只绑到 `127.0.0.1`（不直接对公网暴露）：

```yaml
ports:
  - "127.0.0.1:3000:3000"   # 公开服务
  - "127.0.0.1:3001:3001"   # 后台服务
```

⚠️ **容器内拿不到真实客户端 IP**（默认只看到 Docker 网关 IP），所以：

1. 必须在宿主机用 **nginx 反向代理**，把 `X-Forwarded-For` 透传给容器；
2. 容器内 **`TRUST_PROXY=true`**，限流与后台 IP 白名单才会读 `X-Forwarded-For` 里的真实 IP。

nginx 配置同[上文第 5 节](#5-https-反向代理nginx-示例)（`proxy_pass` 指向 `127.0.0.1:3000`）。后台（3001）同理反代一个内部 vhost，并建议加 `allow <办公室IP>; deny all;` 作为额外一层。

> 若没有反代、想让容器直接看到真实 IP，可改用 `network_mode: host`（仅 Linux），但会失去端口隔离，不推荐。

### 5. 备份（Docker 下）

备份文件已落到 `./data/backups`。用宿主机 cron 定时在容器内执行：

```sh
0 3 * * * cd /opt/cuddolab && docker compose exec -T cuddolab node scripts/backup.js >> /opt/cuddolab/data/backup.log 2>&1
```

同样建议把 `./data` 异地同步（rsync / 对象存储）。

### 6. 升级（Docker）

**方式 A：服务器能访问 Git**

```sh
cd /opt/cuddolab
git pull
docker compose up -d --build
```

**方式 B：服务器访问不到 Git（用代码包更新）**

本地打包（排除依赖、数据、密钥等）并上传到服务器 `/tmp/`：

```sh
# 本地（项目上级目录）打包
tar --exclude='cuddolab/node_modules' --exclude='cuddolab/.git' \
    --exclude='cuddolab/feedback.db*' --exclude='cuddolab/data' \
    --exclude='cuddolab/backups' --exclude='cuddolab/logs' --exclude='cuddolab/.env' \
    -czf cuddolab.tar.gz cuddolab
# 再把 cuddolab.tar.gz 传到服务器 /tmp/（scp 或堡垒机文件传输）
```

服务器上解压并重建：

```sh
# --exclude 保护服务器上改过的 docker-compose.yml（端口绑定等）
tar -xzf /tmp/cuddolab.tar.gz -C /opt --exclude='cuddolab/docker-compose.yml'
cd /opt/cuddolab && docker compose up -d --build
```

> `.env` 与 `data/`（数据库）不在代码包内，**不会被覆盖、数据不丢**。
> 若某次改动重命名/删除了文件（如 `admin/admin.html` → `admin/index.html`），解压不会删除旧文件，需手动 `rm` 掉残留的旧文件。

---

# Meta Conversions API（服务端 Lead，可选）

前端 Meta Pixel 事件会被广告拦截器 / iOS 隐私限制挡掉，导致 `Lead` 转化少报。CAPI 让**后端**在提交成功后再发一次 `Lead`，与前端 Pixel 用同一 `event_id` 去重，提升数据完整度。

**不配置也能正常运行**——`META_CAPI_TOKEN` 为空时不发送服务端事件，行为与原来一致。

## 1. 获取访问令牌

Events Manager → 选中数据源（Pixel `994085383416135`）→ **设置 / Settings** → **Conversions API** → **生成访问令牌**。这是密钥，只放服务器 `.env`，不要提交。

## 2. 配置 `.env`

在服务器上把变量追加到 `/opt/cuddolab/.env`（`=` 后不要加引号）：

```sh
cat >> /opt/cuddolab/.env <<'EOF'

META_CAPI_TOKEN=粘贴你的令牌
META_TEST_EVENT_CODE=TESTxxxxx
EOF
grep META /opt/cuddolab/.env   # 确认写入
```

| 变量 | 说明 |
|------|------|
| `META_CAPI_TOKEN` | 访问令牌（必填才会启用 CAPI） |
| `META_TEST_EVENT_CODE` | 联调用，Events Manager → Test Events 里的 `TEST***`；**正式上线删除/留空** |
| `META_PIXEL_ID` | 默认 `994085383416135`，一般不用改 |
| `META_API_VERSION` | 默认 `v21.0`，一般不用改 |

## 3. 重启加载

只改了 `.env`、没改代码：

```sh
cd /opt/cuddolab && docker compose up -d   # 重建容器加载新环境变量，无需 --build
```

## 4. 联调验证

Events Manager → **Test Events** 标签 → 用真机/浏览器实际提交一次表单，应看到：

- 浏览器 `Lead`（来源 Browser）
- 服务端 `Lead`（来源 Server）
- 两者**自动去重**（同一 `event_id`），只算一次转化

服务端发送失败会在容器日志可见：`docker compose logs --tail=50 | grep capi`。

## 5. 转正式

验证无误后，从 `.env` 删除（或留空）`META_TEST_EVENT_CODE`，再 `docker compose up -d` 重启。

## 隐私

邮箱在服务端经 **SHA-256 哈希**后才发送（不传明文 PII）；IP / User-Agent / `_fbp` / `_fbc` 为 Meta 允许的匹配信号。

---

# TikTok Events API（服务端 SubmitForm，可选）

与 Meta CAPI 同一套思路:前端 TikTok Pixel 发 `SubmitForm`,后端在提交成功后再发一次,用同一 `event_id` 去重,抗拦截、提升匹配率。

**不配置也能正常运行**——`TIKTOK_ACCESS_TOKEN` 为空时不发送服务端事件。

## 1. 获取访问令牌

TikTok Events Manager → 选中数据源(Pixel `D93MPDRC77UARCKAUGE0`)→ **设置 / Settings** → **Events API** → **生成 Access Token**。密钥,只放服务器 `.env`,不要提交。

## 2. 配置 `.env`

```sh
cat >> /opt/cuddolab/.env <<'EOF'

TIKTOK_ACCESS_TOKEN=粘贴你的令牌
TIKTOK_TEST_EVENT_CODE=你的测试码
EOF
grep TIKTOK /opt/cuddolab/.env   # 确认写入
```

| 变量 | 说明 |
|------|------|
| `TIKTOK_ACCESS_TOKEN` | 访问令牌(必填才会启用) |
| `TIKTOK_TEST_EVENT_CODE` | 联调用,Events Manager 的 Test Event Code;**正式上线删除/留空** |
| `TIKTOK_PIXEL_ID` | 默认 `D93MPDRC77UARCKAUGE0`,一般不用改 |

## 3. 重启加载

```sh
cd /opt/cuddolab && docker compose up -d   # 仅改 .env 时无需 --build
```

## 4. 联调验证

TikTok Events Manager → **Test Events** → 提交一次表单,应看到 **Server 来源**的 `SubmitForm`,并与客户端 Pixel 事件按 `event_id` **去重**。

服务端失败会在日志可见:`docker compose logs --tail=50 | grep tiktok`。

## 5. 转正式

验证无误后从 `.env` 删除(或留空)`TIKTOK_TEST_EVENT_CODE`,再 `docker compose up -d`。

## 隐私

邮箱在服务端经 **SHA-256 哈希**后才发送;IP / User-Agent / `_ttp` / `ttclid` 为 TikTok 允许的匹配信号。
