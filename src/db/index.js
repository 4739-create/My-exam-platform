const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

const db = new DatabaseSync(config.dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT    NOT NULL,
  phone         TEXT    NOT NULL UNIQUE,
  department    TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'student',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exams (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  department  TEXT    NOT NULL,
  price       REAL    NOT NULL DEFAULT 0,
  duration    INTEGER NOT NULL DEFAULT 60,
  description TEXT    NOT NULL DEFAULT '',
  document    TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id        INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text  TEXT    NOT NULL,
  option_a       TEXT    NOT NULL,
  option_b       TEXT    NOT NULL,
  option_c       TEXT    NOT NULL,
  option_d       TEXT    NOT NULL,
  correct_option TEXT    NOT NULL,
  explanation    TEXT    NOT NULL DEFAULT '',
  order_index    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id         INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  amount          REAL    NOT NULL,
  payment_method  TEXT    NOT NULL DEFAULT 'Telebirr',
  transaction_ref TEXT    NOT NULL,
  sender_phone    TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'pending',
  provider        TEXT    NOT NULL DEFAULT 'manual',
  provider_ref    TEXT    NOT NULL DEFAULT '',
  checkout_url    TEXT    NOT NULL DEFAULT '',
  provider_status TEXT    NOT NULL DEFAULT '',
  raw_response    TEXT    NOT NULL DEFAULT '',
  submitted_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  approved_at     TEXT,
  reviewed_by     TEXT,
  note            TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id     INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  start_time  TEXT    NOT NULL,
  end_time    TEXT,
  score       INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  answers_json TEXT   NOT NULL DEFAULT '[]',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  action     TEXT NOT NULL,
  details    TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);
CREATE INDEX IF NOT EXISTS idx_questions_exam   ON questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON exam_attempts(student_id, exam_id);
`;

db.exec(SCHEMA);

// Add columns introduced by later versions to existing databases.
function ensureColumns(table, columns) {
  const existing = db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((c) => c.name);
  for (const [name, definition] of columns) {
    if (!existing.includes(name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    }
  }
}

ensureColumns('payments', [
  ['provider', "TEXT NOT NULL DEFAULT 'manual'"],
  ['provider_ref', "TEXT NOT NULL DEFAULT ''"],
  ['checkout_url', "TEXT NOT NULL DEFAULT ''"],
  ['provider_status', "TEXT NOT NULL DEFAULT ''"],
  ['raw_response', "TEXT NOT NULL DEFAULT ''"],
]);

db.exec('CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);');

module.exports = db;
