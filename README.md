# Mimmu 意见收集系统

一个前后端集成的意见收集应用：用户提交产品反馈，运营在后台查看 / 导出 / 删除数据。

- **前端**：原生 HTML/CSS/JS（无构建步骤）
- **后端**：Node.js + Express
- **数据库**：SQLite（`better-sqlite3`，零配置，单文件）

## 架构：一个进程，两个监听

为了让“面向公众的表单”和“仅内部可见的后台”在网络层面彻底隔离，服务在同一个进程里起了两个端口：

| 服务 | 端口 | 内容 | 公网可达 |
|------|------|------|---------|
| **公开服务** | 3000 | 表单页 + `POST /api/feedback`（提交） | ✅ 是 |
| **后台服务** | 3001 | 后台页（根路径 `/`）+ 数据读取 / 删除接口 | ❌ 否（IP 白名单） |

`admin.html` 不在 `public/` 目录内，因此公开端口永远访问不到后台页面。

## 目录结构

```
cuddolab/
├── server.js            # 后端：两个服务 + 校验 + 限流 + 错误处理 + 优雅关闭
├── db.js                # SQLite 连接与建表
├── public/              # 公开静态资源（表单页）
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── site-config.js   # 品牌 / 文案 / 颜色 / 校验配置
│   └── assets/
├── admin/
│   └── admin.html       # 后台仪表盘（独立页面，受 IP 白名单保护）
├── .env.example         # 环境变量模板
└── feedback.db          # SQLite 数据文件（自动生成，已 gitignore）
```

## 快速开始

需要 Node.js 20.6+（生产启动用到了 `--env-file`）。

```sh
npm install
npm run dev      # 开发模式：自动重启 + 跳过后台 IP 白名单
```

- 表单页：<http://localhost:3000>
- 后台页：<http://localhost:3001>

生产部署（进程守护 / HTTPS / 备份 / 升级）见 **[DEPLOY.md](./DEPLOY.md)**，下方[部署](#部署)为简版。

## 环境变量

复制 `.env.example` 为 `.env` 后填写，用 `node --env-file=.env server.js` 启动。

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `3000` | 公开服务端口 |
| `ADMIN_PORT` | `3001` | 后台服务端口 |
| `ADMIN_ALLOWED_IPS` | 空 | 允许访问后台的 IP（逗号分隔），通常填公司办公室出口 IP |
| `TRUST_PROXY` | 空 | 位于 nginx / 负载均衡后面时设为 `true`，才能拿到真实客户端 IP（限流与白名单都依赖它） |
| `RATE_LIMIT_MAX` | `5` | 每个 IP 在限流窗口内最多提交次数 |
| `RATE_LIMIT_WINDOW_MS` | `60000` | 限流窗口（毫秒） |
| `ADMIN_PUBLIC` | 空 | 设为 `1` 跳过后台 IP 白名单（⚠️ 仅限本地开发，生产勿用） |

## API

### 公开服务（端口 3000）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/feedback` | 提交反馈（限流 + 蜜罐防刷 + 字段校验） |
| `GET` | `/healthz` | 健康检查（含数据库可达性） |

提交字段：`email`(必填)、`name`(必填,≤50)、`favoriteColor`、`features`(数组)、`preorderIntent`、`expectedPrice`、`message`(≤200)。所有字段在**前后端双重校验**，并使用白名单约束取值。

### 后台服务（端口 3001，IP 白名单保护）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/` | 后台仪表盘页面 |
| `GET` | `/api/feedback?page=&size=` | 分页查询（默认每页 20，上限 200），返回 `{items,total,page,size}` |
| `GET` | `/api/feedback?all=1` | 全量查询（供导出使用） |
| `DELETE` | `/api/feedback` | 批量删除，body `{ids:[...]}` |
| `GET` | `/api/stats` | KPI 统计（总数 / 想预购 / 含留言 / 今日新增） |
| `GET` | `/healthz` | 健康检查（不受白名单限制） |

## 后台功能

- 仪表盘布局：可收起的侧栏 + KPI 卡片 + 数据表格
- 表格：邮箱/姓名足宽显示，固定字段完整展示，期望功能/留言截断（点击弹窗看完整）
- **分页**：后端 `LIMIT/OFFSET`，可扛上万条数据
- **导出**：Excel(.xls) 或 CSV（带 UTF-8 BOM），始终导出全部数据
- **删除**：行选择框 + 全选 + 二次确认弹窗

## 安全

- **后台不暴露公网**：独立端口 + IP 白名单（只放行配置的 IP，其余 403）
- **提交限流**：按 IP 固定窗口计数，超限返回 429
- **蜜罐防刷**：隐藏字段 `website`，机器人填写后提交被静默丢弃
- **统一错误处理**：异常返回 JSON，不向客户端泄露堆栈
- **优雅关闭**：`SIGTERM/SIGINT` 时停止接收新连接、处理完现有请求、关闭数据库再退出

> ⚠️ IP 白名单基于来源 IP。若后台位于反向代理后面，**必须**设置 `TRUST_PROXY=true`，否则读到的永远是代理 IP，白名单会失效。

## 部署

### GitHub Pages（公开静态预览）

仓库包含 `.github/workflows/pages.yml`。推送到 `main` 后会自动发布 `public/` 目录，网站地址为：

`https://<你的 GitHub 用户名>.github.io/<仓库名>/`

GitHub Pages 只托管静态前端，页面上的首批体验表单需要 Express 后端才能保存数据；在 Pages 预览中会显示提示，不会把数据误报为已提交。

1. 在办公室网络打开 <https://ifconfig.me> 获取办公室出口 IP
2. 配置 `.env`：
   ```
   ADMIN_ALLOWED_IPS=你的办公室IP
   TRUST_PROXY=true   # 若后台在 nginx / 负载均衡后面
   ```
3. 启动：`node --env-file=.env server.js`
4. **建议再加一层防火墙**：在云服务器安全组中，把后台端口（3001）也限制为只允许办公室 IP 访问，做到网络层 + 应用层双保险。

## 数据库

- 首次启动自动创建 `feedback.db` 与 `feedback` 表
- `features` 多选字段以 JSON 文本存储
- `feedback.db*` 已加入 `.gitignore`，不会进版本库
