import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbDir = join(__dirname, '..', 'data');
mkdirSync(dbDir, { recursive: true });

const DB_PATH = join(dbDir, 'gstmcp.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      plan TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      key TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      called_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      response_ms INTEGER,
      success INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      api_key TEXT NOT NULL,
      period TEXT NOT NULL,
      call_count INTEGER DEFAULT 0,
      reset_at DATETIME NOT NULL,
      PRIMARY KEY (api_key, period)
    );

    CREATE TABLE IF NOT EXISTS auth_codes (
      code TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hsn_codes (
      code TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      gst_rate REAL NOT NULL,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS pincodes (
      pincode TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      region TEXT
    );
  `);
}

export function createUser(id, email, name) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO users (id, email, name) VALUES (?, ?, ?)
  `).run(id, email, name);
}

export function getUserByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getUserById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function createApiKey(key, userId) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO api_keys (key, user_id) VALUES (?, ?)
  `).run(key, userId);
}

export function getApiKey(key) {
  const db = getDb();
  return db.prepare(`
    SELECT ak.*, u.plan, u.email FROM api_keys ak
    JOIN users u ON ak.user_id = u.id
    WHERE ak.key = ? AND ak.is_active = 1
  `).get(key);
}

export function logUsage(apiKey, toolName, responseMs, success) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO usage_logs (api_key, tool_name, response_ms, success)
    VALUES (?, ?, ?, ?)
  `).run(apiKey, toolName, responseMs, success ? 1 : 0);
}

export function saveAuthCode(code, userId, expiresAt) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO auth_codes (code, user_id, expires_at) VALUES (?, ?, ?)
  `).run(code, userId, expiresAt);
}

export function consumeAuthCode(code) {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM auth_codes WHERE code = ? AND used = 0 AND expires_at > datetime('now')
  `).get(code);
  if (row) {
    db.prepare('UPDATE auth_codes SET used = 1 WHERE code = ?').run(code);
  }
  return row;
}

export function getRateLimit(apiKey, period) {
  const db = getDb();
  return db.prepare('SELECT * FROM rate_limits WHERE api_key = ? AND period = ?').get(apiKey, period);
}

export function upsertRateLimit(apiKey, period, resetAt) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO rate_limits (api_key, period, call_count, reset_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(api_key, period) DO UPDATE SET call_count = call_count + 1
  `).run(apiKey, period, resetAt);
}

export function resetRateLimit(apiKey, period, resetAt) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO rate_limits (api_key, period, call_count, reset_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(api_key, period) DO UPDATE SET call_count = 1, reset_at = ?
  `).run(apiKey, period, resetAt, resetAt);
}

export function lookupPincode(pincode) {
  const db = getDb();
  return db.prepare('SELECT * FROM pincodes WHERE pincode = ?').get(pincode);
}

export function lookupHsn(code) {
  const db = getDb();
  return db.prepare('SELECT * FROM hsn_codes WHERE code = ?').get(code);
}

export function searchHsn(query) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM hsn_codes WHERE description LIKE ? OR code LIKE ? LIMIT 10
  `).all(`%${query}%`, `${query}%`);
}

export function insertHsn(code, description, gstRate, category) {
  const db = getDb();
  return db.prepare(`
    INSERT OR REPLACE INTO hsn_codes (code, description, gst_rate, category) VALUES (?, ?, ?, ?)
  `).run(code, description, gstRate, category);
}

export function insertPincode(pincode, city, district, state, region) {
  const db = getDb();
  return db.prepare(`
    INSERT OR REPLACE INTO pincodes (pincode, city, district, state, region) VALUES (?, ?, ?, ?, ?)
  `).run(pincode, city, district, state, region);
}
