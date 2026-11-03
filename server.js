import express from 'express';
import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PORT = Number(process.env.ADMIN_PORT) || 3001;

// ---- Meta Conversions API（服务端 Lead）----
// 不配 META_CAPI_TOKEN 时整体不发送，行为与现在一致
const META_PIXEL_ID = process.env.META_PIXEL_ID || '994085383416135';
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || '';
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';
const META_API_VERSION = process.env.META_API_VERSION || 'v21.0';

// ---- TikTok Events API（服务端 SubmitForm）----
// 不配 TIKTOK_ACCESS_TOKEN 时整体不发送，行为与现在一致
const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'D93MPDRC77UARCKAUGE0';
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '';
const TIKTOK_TEST_EVENT_CODE = process.env.TIKTOK_TEST_EVENT_CODE || '';

// 本地开发开关：ADMIN_PUBLIC=1 时跳过 IP 白名单，免去配置
const ADMIN_PUBLIC = process.env.ADMIN_PUBLIC === '1';
// 反代场景下需信任代理，才能从 X-Forwarded-For 拿到真实客户端 IP
// 取值：'true'（信任全部，最宽松）| 数字（信任的代理跳数，单个 nginx 用 1，最安全）
//      | 'loopback' | IP/子网列表 | 空（不信任）
function parseTrustProxy(v) {
  if (!v) return false;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}
const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);

// 白名单：本机地址始终放行；公司办公室出口 IP 通过环境变量配置（逗号分隔）
function parseList(value) {
  return (value || '').split(',').map((s) => s.trim()).filter(Boolean);
}
const ALLOWED_IPS = new Set(['127.0.0.1', '::1', ...parseList(process.env.ADMIN_ALLOWED_IPS)]);

// 把 IPv6 映射的 IPv4（::ffff:1.2.3.4）归一化为纯 IPv4
function normalizeIp(ip) {
  if (!ip) return ip;
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function ipAllowlist(req, res, next) {
  if (ADMIN_PUBLIC) return next();
  const ip = normalizeIp(req.ip);
  if (ALLOWED_IPS.has(ip)) return next();
  res.status(403).type('text/plain').send('403 Forbidden');
}

// ---- 限流：按 IP 固定窗口计数（内存级，单实例适用）----
const RATE_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const RATE_MAX = Number(process.env.RATE_LIMIT_MAX) || 5;
const rateHits = new Map(); // ip -> { count, resetAt }

function rateLimit(req, res, next) {
  const ip = normalizeIp(req.ip) || 'unknown';
  const now = Date.now();
  let rec = rateHits.get(ip);
  if (!rec || now >= rec.resetAt) {
    rec = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateHits.set(ip, rec);
  }
  rec.count += 1;
  if (rec.count > RATE_MAX) {
    res.set('Retry-After', String(Math.ceil((rec.resetAt - now) / 1000)));
    return res.status(429).json({ error: '提交过于频繁，请稍后再试' });
  }
  next();
}

// 定期清理过期 IP 记录，避免 Map 无限增长
const rateSweep = setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of rateHits) if (now >= rec.resetAt) rateHits.delete(ip);
}, RATE_WINDOW_MS);
rateSweep.unref();

// 未匹配的 /api 路由：返回 JSON 而非默认 HTML
function apiNotFound(req, res) {
  res.status(404).json({ error: '接口不存在' });
}

// 请求日志：method / path / 状态码 / 耗时 / IP（健康检查除外，避免刷屏）
const LOG_REQUESTS = process.env.LOG_REQUESTS !== '0';
function requestLogger(tag) {
  return (req, res, next) => {
    if (!LOG_REQUESTS || req.path === '/healthz') return next();
    const start = Date.now();
    res.on('finish', () => {
      const ip = normalizeIp(req.ip) || '-';
      console.log(
        `[${new Date().toISOString()}] ${tag} ${ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
      );
    });
    next();
  };
}

// 统一错误处理：记录日志、不向客户端泄露堆栈
function errorHandler(err, req, res, next) {
  // express.json() 解析失败（请求体不是合法 JSON）
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ error: '请求体格式错误' });
  }
  // 请求体过大
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: '请求体过大' });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(err.status || 500).json({ error: '服务器内部错误' });
}

// ---- 校验规则（与前端表单保持一致）----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 50;
const MESSAGE_MAX = 200;
const COLORS = ['cream', 'cocoa', 'blush', 'lavender', 'mint', 'sky-blue', 'honey', 'coral'];
const FEATURES = [
  'hug',
  'breathing',
  'heartbeat',
  'memory',
  'personality',
  'owner-recognition',
  'voice-conversation',
  'sleep-monitoring',
];
const PRICES = ['under-99', '99-159', '159-199', '199-259', '259-299'];
const PREFS = ['launch', 'early-bird', 'community'];

function validate(body) {
  const email = String(body?.email ?? '').trim();
  const name = String(body?.name ?? '').trim();
  const favoriteColor = Array.isArray(body?.favoriteColor) ? body.favoriteColor.map(String) : [];
  const features = Array.isArray(body?.features) ? body.features.map(String) : [];
  const expectedPrice = String(body?.expectedPrice ?? '');
  const message = String(body?.message ?? '').trim();
  // 订阅偏好：可空，仅保留白名单内的值
  const preferences = Array.isArray(body?.preferences)
    ? body.preferences.map(String).filter((p) => PREFS.includes(p))
    : [];

  if (!email || !EMAIL_RE.test(email)) return { error: '邮箱格式不正确' };
  if (!name) return { error: '请填写姓名' };
  if (name.length > NAME_MAX) return { error: `姓名不能超过 ${NAME_MAX} 个字符` };
  if (!favoriteColor.length) return { error: '请选择喜爱颜色' };
  if (favoriteColor.some((c) => !COLORS.includes(c))) return { error: '包含无效的颜色选项' };
  if (features.some((f) => !FEATURES.includes(f))) return { error: '包含无效的功能选项' };
  if (!PRICES.includes(expectedPrice)) return { error: '请选择有效的预期价格' };
  if (message.length > MESSAGE_MAX) return { error: `留言不能超过 ${MESSAGE_MAX} 个字符` };

  return {
    value: { email, name, favoriteColor, features, expectedPrice, message, preferences },
  };
}

// ---- 预编译 SQL ----
const insertStmt = db.prepare(`
  INSERT INTO feedback (email, name, favorite_color, features, preorder_intent, expected_price, message, preferences)
  VALUES (@email, @name, @favoriteColor, @features, @preorderIntent, @expectedPrice, @message, @preferences)
`);
const SELECT_COLS =
  'SELECT id, email, name, favorite_color, features, preorder_intent, expected_price, message, preferences, created_at FROM feedback';
const listPageStmt = db.prepare(`${SELECT_COLS} ORDER BY id DESC LIMIT ? OFFSET ?`);
const listAllStmt = db.prepare(`${SELECT_COLS} ORDER BY id DESC`);
const countStmt = db.prepare('SELECT COUNT(*) AS n FROM feedback');
const deleteStmt = db.prepare('DELETE FROM feedback WHERE id = ?');
const deleteManyTx = db.transaction((ids) => {
  let n = 0;
  for (const id of ids) n += deleteStmt.run(id).changes;
  return n;
});
// 4 个 KPI 直接用 SQL 聚合，避免把全量数据拉到前端
const statsStmt = db.prepare(`
  SELECT
    COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN message != '' THEN 1 ELSE 0 END), 0) AS withMessage,
    COALESCE(SUM(CASE WHEN date(created_at) = date('now', 'localtime') THEN 1 ELSE 0 END), 0) AS today
  FROM feedback
`);
const pingStmt = db.prepare('SELECT 1 AS ok');

// 健康检查：进程存活 + 数据库可达
const startedAt = Date.now();
function healthCheck(req, res) {
  try {
    pingStmt.get();
    res.json({ status: 'ok', uptime: Math.floor((Date.now() - startedAt) / 1000) });
  } catch (e) {
    res.status(503).json({ status: 'error', error: 'database unavailable' });
  }
}

// 编码值 → 可读文案（与 public/site-config.js 的 copy.form 保持一致，用于导出）
const COLOR_LABEL = {
  cream: 'Cream', cocoa: 'Cocoa', blush: 'Blush', lavender: 'Lavender',
  mint: 'Mint', 'sky-blue': 'Sky blue', honey: 'Honey', coral: 'Coral',
};
const FEATURE_LABEL = {
  hug: 'Hug', breathing: 'Breathing', heartbeat: 'Heartbeat', memory: 'Memory',
  personality: 'Personality', 'owner-recognition': 'Owner recognition',
  'voice-conversation': 'Voice chat', 'sleep-monitoring': 'Sleep tracking',
};
const PRICE_LABEL = {
  'under-99': 'Under $99', '99-159': '$99-$159', '159-199': '$159-$199',
  '199-259': '$199-$259', '259-299': '$259-$299',
};
const PREF_LABEL = {
  launch: 'Notify me about launch',
  'early-bird': 'Receive Early Bird reminders',
  community: 'Community invitations',
};
const lbl = (map, v) => map[v] || v || '';

function rowToFeedback(row) {
  let features = [];
  try {
    features = JSON.parse(row.features);
  } catch {
    features = [];
  }
  // favorite_color：新记录是 JSON 数组；旧记录是单值字符串，兼容包成数组
  let favoriteColor = [];
  try {
    const v = JSON.parse(row.favorite_color);
    favoriteColor = Array.isArray(v) ? v : [String(v)];
  } catch {
    favoriteColor = row.favorite_color ? [row.favorite_color] : [];
  }
  let preferences = [];
  try {
    preferences = JSON.parse(row.preferences || '[]');
  } catch {
    preferences = [];
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    favoriteColor,
    features,
    preorderIntent: row.preorder_intent,
    expectedPrice: row.expected_price,
    message: row.message,
    preferences,
    createdAt: row.created_at,
  };
}

// 价格区间 → 估算数值（与前端 Pixel 保持一致）
const PRICE_VALUE = {
  'under-99': 79,
  '99-159': 129,
  '159-199': 179,
  '199-259': 229,
  '259-299': 279,
};

// 把邮箱规范化后做 SHA-256（CAPI 要求 PII 哈希后传）
function sha256(value) {
  return createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

// 服务端发送 Lead 到 Meta Conversions API（与前端 Pixel 用同一 eventId 去重）
// 未配置 token → 直接跳过；任何异常只记日志，绝不影响用户提交
async function sendCapiLead({ value, ip, userAgent, sourceUrl, body }) {
  if (!META_CAPI_TOKEN) return;
  try {
    const userData = {
      em: [sha256(value.email)],
      client_ip_address: ip || undefined,
      client_user_agent: userAgent || undefined,
    };
    if (body?.fbp) userData.fbp = String(body.fbp);
    if (body?.fbc) userData.fbc = String(body.fbc);

    const payload = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_id: body?.eventId ? String(body.eventId) : undefined,
          event_source_url: sourceUrl || undefined,
          user_data: userData,
          custom_data: {
            content_category: (value.favoriteColor || []).join(','),
            value: PRICE_VALUE[value.expectedPrice] ?? 0,
            num_items: (value.features || []).length,
            currency: 'USD',
          },
        },
      ],
    };
    if (META_TEST_EVENT_CODE) payload.test_event_code = META_TEST_EVENT_CODE;

    const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(
      META_CAPI_TOKEN,
    )}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('[capi] Lead 发送失败:', res.status, (await res.text()).slice(0, 300));
    }
  } catch (e) {
    console.error('[capi] Lead 异常:', e.message);
  }
}

// 服务端发送 SubmitForm 到 TikTok Events API（与前端 Pixel 用同一 event_id 去重）
// 未配置 token → 直接跳过；任何异常只记日志，绝不影响用户提交
async function sendTiktokSubmitForm({ ip, userAgent, sourceUrl, value, body }) {
  if (!TIKTOK_ACCESS_TOKEN) return;
  try {
    const user = { email: sha256(value.email) };
    if (ip) user.ip = ip;
    if (userAgent) user.user_agent = userAgent;
    if (body?.ttp) user.ttp = String(body.ttp);
    if (body?.ttclid) user.ttclid = String(body.ttclid);

    const payload = {
      event_source: 'web',
      event_source_id: TIKTOK_PIXEL_ID,
      data: [
        {
          event: 'SubmitForm',
          event_time: Math.floor(Date.now() / 1000),
          event_id: body?.eventId ? String(body.eventId) : undefined,
          user,
          properties: {
            content_type: 'product',
            content_id: 'mimmu-waitlist',
            content_name: 'Mimmu waitlist',
            content_category: (value.favoriteColor || []).join(','),
            quantity: (value.features || []).length,
            value: PRICE_VALUE[value.expectedPrice] ?? 0,
            currency: 'USD',
          },
          page: sourceUrl ? { url: sourceUrl } : undefined,
        },
      ],
    };
    if (TIKTOK_TEST_EVENT_CODE) payload.test_event_code = TIKTOK_TEST_EVENT_CODE;

    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': TIKTOK_ACCESS_TOKEN },
      body: JSON.stringify(payload),
    });
    // TikTok 即使逻辑错误也返回 HTTP 200，靠 body.code(0=成功) 判断
    const json = await res.json().catch(() => ({}));
    if (!res.ok || (json && json.code !== undefined && json.code !== 0)) {
      console.error('[tiktok] SubmitForm 发送失败:', res.status, JSON.stringify(json).slice(0, 300));
    }
  } catch (e) {
    console.error('[tiktok] SubmitForm 异常:', e.message);
  }
}

// ============================================================
// 公开服务：表单页 + 提交接口（对全网开放）
// ============================================================
const publicApp = express();
if (TRUST_PROXY !== false) {
  publicApp.set('trust proxy', TRUST_PROXY);
}
publicApp.use(requestLogger('pub'));
publicApp.use(express.json());
publicApp.get('/healthz', healthCheck);
// 整个公开站点挂在 /feedback 下；根路径重定向过去（/feedback、/feedback/ 交给静态服务）
publicApp.get('/', (req, res) => res.redirect('/feedback/'));
publicApp.use('/feedback', express.static(join(__dirname, 'public')));

publicApp.post('/feedback/api/feedback', rateLimit, (req, res) => {
  // 蜜罐：正常用户不会填 website 字段，填了即判定为机器人，静默丢弃
  if (String(req.body?.website ?? '').trim() !== '') {
    return res.status(201).json({ id: null });
  }

  const { error, value } = validate(req.body);
  if (error) return res.status(400).json({ error });

  // preorder_intent 列仍存在（NOT NULL），写入空串以兼容旧库结构
  // favorite_color / features 多选，存为 JSON 文本
  const info = insertStmt.run({
    ...value,
    preorderIntent: '',
    favoriteColor: JSON.stringify(value.favoriteColor),
    features: JSON.stringify(value.features),
    preferences: JSON.stringify(value.preferences),
  });

  // 服务端事件（Meta CAPI + TikTok Events API）——非阻塞、不影响给用户的响应
  const serverEventCtx = {
    value,
    ip: normalizeIp(req.ip),
    userAgent: req.headers['user-agent'],
    sourceUrl: req.headers.referer,
    body: req.body,
  };
  sendCapiLead(serverEventCtx);
  sendTiktokSubmitForm(serverEventCtx);

  res.status(201).json({ id: info.lastInsertRowid });
});

publicApp.use('/feedback/api', apiNotFound);
publicApp.use(errorHandler);

// ============================================================
// 后台服务：仅白名单 IP 可访问（IP 白名单 + 独立端口）
// admin.html 不在 public/ 内，因此公开端口永远访问不到它
// ============================================================
const adminApp = express();
if (TRUST_PROXY !== false) {
  adminApp.set('trust proxy', TRUST_PROXY);
}
adminApp.use(requestLogger('adm'));
// 健康检查放在白名单之前：探活不应被 IP 限制拦截（且不含敏感信息）
adminApp.get('/healthz', healthCheck);
// 白名单中间件必须最先执行：连静态文件也一并保护
adminApp.use(ipAllowlist);
adminApp.use(express.json());
// 后台页即根路径首页：admin/index.html（端口 3001 直接打开就是后台）
adminApp.use(express.static(join(__dirname, 'admin')));
adminApp.use(express.static(join(__dirname, 'public'))); // 共享 site-config.js / favicon

// 按订阅偏好构建 WHERE（白名单过滤防注入；多选为 AND，都包含才命中）
function buildPrefsFilter(prefsQuery) {
  const prefs = String(prefsQuery || '')
    .split(',')
    .map((s) => s.trim())
    .filter((p) => PREFS.includes(p));
  const where = prefs.length ? 'WHERE ' + prefs.map(() => 'preferences LIKE ?').join(' AND ') : '';
  const args = prefs.map((p) => `%"${p}"%`);
  return { where, args };
}

adminApp.get('/api/feedback', (req, res) => {
  const { where, args } = buildPrefsFilter(req.query.prefs);

  // 导出用：?all=1 返回全部（支持 prefs 筛选）
  if (req.query.all === '1') {
    const items = db
      .prepare(`${SELECT_COLS} ${where} ORDER BY id DESC`)
      .all(...args)
      .map(rowToFeedback);
    return res.json({ items });
  }

  // 分页：page 从 1 开始，size 限 1~200
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const size = Math.min(200, Math.max(1, parseInt(req.query.size, 10) || 20));
  const total = db.prepare(`SELECT COUNT(*) AS n FROM feedback ${where}`).get(...args).n;
  const items = db
    .prepare(`${SELECT_COLS} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...args, size, (page - 1) * size)
    .map(rowToFeedback);
  res.json({ items, total, page, size });
});
// 导出为真正的 .xlsx（全量，流式下载；支持 prefs 筛选）
adminApp.get('/api/feedback/export.xlsx', async (req, res, next) => {
  try {
    const { where, args } = buildPrefsFilter(req.query.prefs);
    const rows = db
      .prepare(`${SELECT_COLS} ${where} ORDER BY id DESC`)
      .all(...args)
      .map(rowToFeedback);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('反馈');
    ws.columns = [
      { header: '邮箱', key: 'email', width: 30 },
      { header: '姓名', key: 'name', width: 16 },
      { header: '喜爱颜色', key: 'color', width: 14 },
      { header: '期望功能', key: 'features', width: 36 },
      { header: '预期价格', key: 'price', width: 14 },
      { header: '留言', key: 'message', width: 40 },
      { header: '订阅偏好', key: 'preferences', width: 40 },
      { header: '提交时间', key: 'createdAt', width: 20 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const it of rows) {
      ws.addRow({
        email: it.email,
        name: it.name,
        color: (it.favoriteColor || []).map((c) => lbl(COLOR_LABEL, c)).join('、'),
        features: (it.features || []).map((f) => lbl(FEATURE_LABEL, f)).join('、'),
        price: lbl(PRICE_LABEL, it.expectedPrice),
        message: it.message,
        preferences: (it.preferences || []).map((p) => lbl(PREF_LABEL, p)).join('、'),
        createdAt: it.createdAt,
      });
    }
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="feedback-${stamp}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

// 批量删除
adminApp.delete('/api/feedback', (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];
  if (!ids.length) return res.status(400).json({ error: '未提供要删除的 ID' });
  const deleted = deleteManyTx(ids);
  res.json({ deleted });
});

adminApp.get('/api/stats', (req, res) => {
  res.json(statsStmt.get());
});

adminApp.use('/api', apiNotFound);
adminApp.use(errorHandler);

// ---- 启动两个监听 ----
const publicServer = publicApp.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 公开服务: http://localhost:${PORT}`);
});
const adminServer = adminApp.listen(ADMIN_PORT, '0.0.0.0', () => {
  console.log(`🔒 后台服务: http://localhost:${ADMIN_PORT}`);
  if (ADMIN_PUBLIC) {
    console.log('   ⚠️  ADMIN_PUBLIC=1：已跳过 IP 白名单（仅供本地开发）');
  } else {
    console.log(`   IP 白名单: ${[...ALLOWED_IPS].join(', ')}`);
  }
});

// ---- 优雅关闭：停止新连接 → 等现有请求结束 → 关闭数据库 ----
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n收到 ${signal}，正在优雅关闭…`);
  clearInterval(rateSweep);

  // 超时兜底：现有连接迟迟不结束时强制退出
  const force = setTimeout(() => {
    console.error('关闭超时，强制退出');
    process.exit(1);
  }, 10_000);
  force.unref();

  const closeServer = (s) => new Promise((resolve) => s.close(resolve));
  Promise.all([closeServer(publicServer), closeServer(adminServer)]).then(() => {
    try {
      db.close(); // WAL 落盘
    } catch (e) {
      console.error('关闭数据库出错:', e.message);
    }
    clearTimeout(force);
    console.log('已安全关闭。');
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
