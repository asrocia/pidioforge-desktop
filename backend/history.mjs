import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
const vendorPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vendor', 'node_modules', 'better-sqlite3');
const databasePackage = process.env.PIDIOFORGE_SQLITE_PACKAGE || (existsSync(vendorPath) ? vendorPath : 'better-sqlite3');
const Database = require(databasePackage);
import { mkdir } from 'node:fs/promises';
import { workspaceDir } from './config.mjs';

let db = null;

export async function initHistory() {
  const dbDir = path.join(workspaceDir, 'db');
  await mkdir(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, 'history.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS renders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'done',
      duration_seconds REAL DEFAULT 0,
      output_size INTEGER DEFAULT 0,
      output_path TEXT DEFAULT '',
      encoder TEXT DEFAULT '',
      resolution TEXT DEFAULT '',
      started_at TEXT DEFAULT '',
      finished_at TEXT DEFAULT '',
      elapsed_ms INTEGER DEFAULT 0,
      config_json TEXT DEFAULT '{}',
      error TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_renders_status ON renders(status);
    CREATE INDEX IF NOT EXISTS idx_renders_created ON renders(created_at);
  `);
  return db;
}

export function recordRender(job) {
  if (!db) return;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO renders (id, title, status, duration_seconds, output_size, output_path, encoder, resolution, started_at, finished_at, elapsed_ms, config_json, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    job.id || `render-${Date.now()}`,
    job.title || 'Untitled',
    job.status || 'done',
    Number(job.durationSeconds || job.duration || 0),
    Number(job.outputSize || job.size || 0),
    job.output || job.outputDir || '',
    job.encoder || job.config?.target?.hardwareAccel || '',
    job.config?.target?.resolution || '',
    job.startedAt || '',
    job.finishedAt || new Date().toISOString(),
    Number(job.elapsedMs || job.elapsedSeconds ? job.elapsedSeconds * 1000 : 0),
    JSON.stringify(job.config || {}),
    job.error || '',
  );
}

export function getHistory({ page = 1, limit = 20, status = '' } = {}) {
  if (!db) return { items: [], total: 0, page, limit };
  const offset = (page - 1) * limit;
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];

  const total = db.prepare(`SELECT COUNT(*) as count FROM renders ${where}`).get(...params)?.count || 0;
  const items = db
    .prepare(`SELECT * FROM renders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  return { items, total, page, limit };
}

export function getHistoryStats() {
  if (!db) return { total: 0, done: 0, failed: 0, totalSize: 0, totalDuration: 0, avgElapsed: 0 };

  const stats = db
    .prepare(
      `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(output_size) as totalSize,
      SUM(duration_seconds) as totalDuration,
      AVG(elapsed_ms) as avgElapsed
    FROM renders
  `,
    )
    .get();

  return {
    total: stats?.total || 0,
    done: stats?.done || 0,
    failed: stats?.failed || 0,
    totalSize: stats?.totalSize || 0,
    totalDuration: stats?.totalDuration || 0,
    avgElapsed: Math.round(stats?.avgElapsed || 0),
  };
}

export function clearHistory() {
  if (!db) return;
  db.exec('DELETE FROM renders');
}
