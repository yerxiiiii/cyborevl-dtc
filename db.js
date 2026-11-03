import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SQLite 数据库文件，首次运行自动创建
// DB_PATH 可指向挂载卷（Docker 部署用），默认项目根目录
const DB_PATH = process.env.DB_PATH || join(__dirname, 'feedback.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// 反馈表：字段与前端表单一一对应
// features 为多选，按约定存为 JSON 文本（如 ["heartbeat-light","goodnight-voice"]）
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL,
    name            TEXT    NOT NULL,
    favorite_color  TEXT    NOT NULL,
    features        TEXT    NOT NULL DEFAULT '[]',
    preorder_intent TEXT    NOT NULL,
    expected_price  TEXT    NOT NULL DEFAULT 'not-sure',
    message         TEXT    NOT NULL DEFAULT '',
    preferences     TEXT    NOT NULL DEFAULT '[]',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

// 迁移：老库若无 preferences 列则补上（订阅偏好，JSON 数组）
const hasPreferences = db
  .prepare("PRAGMA table_info('feedback')")
  .all()
  .some((c) => c.name === 'preferences');
if (!hasPreferences) {
  db.exec("ALTER TABLE feedback ADD COLUMN preferences TEXT NOT NULL DEFAULT '[]'");
}

export default db;
