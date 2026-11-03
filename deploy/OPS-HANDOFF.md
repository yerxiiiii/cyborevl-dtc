# 运维交接清单 — Cuddolab 意见收集系统

一份给运维同学的速览。完整说明见仓库根目录 `DEPLOY.md`。

## 这是什么

- 一个 Node.js 应用，**单进程起两个端口**：
  - `3000` 公开服务：用户提交反馈的表单页 + 提交接口（面向全网）
  - `3001` 后台服务：运营查看 / 导出 / 删除数据（**仅限授权 IP，不可对公网开放**）
- 数据库是 SQLite 单文件 `feedback.db`（应用自动创建）。

## 部署方式（二选一）

| 方式 | 适用 | 文档 |
|------|------|------|
| **Docker** | 已有 Docker 环境 | `DEPLOY.md` → “Docker 部署” + `docker-compose.yml` |
| **裸机 + pm2/systemd** | 直接装 Node | `DEPLOY.md` → 第 4 节 + `ecosystem.config.cjs` / `deploy/cuddolab.service` |

两种方式都已配置：崩溃自动重启、开机自启、优雅关闭。

## 必须配置的环境变量（`.env`）

```ini
ADMIN_ALLOWED_IPS=<办公室出口IP>   # 允许访问后台的 IP，逗号分隔
TRUST_PROXY=1                      # 前置 1 个 nginx 时填 1（关键！见下）
```

> 模板见 `.env.example`。**不要**在生产设 `ADMIN_PUBLIC`（那会关闭后台 IP 白名单）。

## ⚠️ 三个最关键的点

1. **后台（3001）绝不能直接暴露到公网。**
   - 应用端口建议只绑 `127.0.0.1`；对外由 nginx 控制。
   - 后台 vhost 用 `allow <办公室IP>; deny all;`（见 `deploy/nginx.conf.example`）。
   - 云安全组里也把 3001 限制到办公室 IP，做双保险。

2. **必须透传真实客户端 IP。**
   - nginx 要带 `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
   - 应用要设 `TRUST_PROXY=1`。
   - 否则：限流和 IP 白名单都会以为所有请求来自同一个代理 IP → 失效。

3. **`feedback.db` 是数据的唯一副本，必须备份。**
   - 命令：`node scripts/backup.js`（Docker：`docker compose exec -T cuddolab node scripts/backup.js`）
   - 建议 cron 每天跑一次，并把备份目录异地同步。

## nginx

- 配置示例：`deploy/nginx.conf.example`（公开站点 HTTPS + 后台 vhost IP 白名单 + XFF 透传）
- 公开站点务必上 HTTPS（Let's Encrypt / 公司证书均可）。

## 健康检查

- 公开：`GET /healthz`（经 nginx 即 `https://<公开域名>/healthz`）
- 后台：`GET /healthz`（不受 IP 白名单限制，可直接探活）
- 返回 `{"status":"ok"}` = 进程存活且数据库可达。

## 日志

- 应用把请求日志打到 stdout（`pub`/`adm` 前缀）。
- pm2：`pm2 logs cuddolab` 或 `logs/` 目录；systemd：`journalctl -u cuddolab -f`；Docker：`docker compose logs -f`。

## 升级

```sh
git pull
# Docker:   docker compose up -d --build
# pm2:      npm ci --omit=dev && pm2 reload cuddolab
# systemd:  npm ci --omit=dev && systemctl restart cuddolab
```

## 有问题找谁

- 应用 / 代码：<开发负责人>
- 本系统由开发侧搭建，运维侧主要负责：部署、nginx/证书、防火墙/安全组、备份 cron、监控探活。
