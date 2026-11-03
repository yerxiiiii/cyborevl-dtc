// 数据库在线备份：拷贝 feedback.db 到 backups/，并清理过旧的备份
// 用法：node scripts/backup.js
// 环境变量：BACKUP_DIR（默认 ./backups）、BACKUP_KEEP（保留份数，默认 14）
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const DB_PATH = process.env.DB_PATH || join(root, 'feedback.db');
const BACKUP_DIR = process.env.BACKUP_DIR || join(root, 'backups');
const KEEP = Number(process.env.BACKUP_KEEP) || 14;

mkdirSync(BACKUP_DIR, { recursive: true });

const d = new Date();
const p = (n) => String(n).padStart(2, '0');
const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
const dest = join(BACKUP_DIR, `feedback-${stamp}.db`);

// 只读打开源库，在线备份（即使服务正在运行也能得到一致快照）
const db = new Database(DB_PATH, { readonly: true });
await db.backup(dest);
db.close();
console.log(`✅ 备份完成: ${dest}`);

// 清理：仅保留最新的 KEEP 份
const files = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith('feedback-') && f.endsWith('.db'))
  .map((f) => ({ f, t: statSync(join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);

for (const { f } of files.slice(KEEP)) {
  unlinkSync(join(BACKUP_DIR, f));
  console.log(`🗑️  清理旧备份: ${f}`);
}
