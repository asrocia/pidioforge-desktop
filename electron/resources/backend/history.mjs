import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { workspaceDir } from './config.mjs';

const require = createRequire(import.meta.url);
const vendorPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vendor', 'node_modules', 'better-sqlite3');
const databasePackage = process.env.PIDIOFORGE_SQLITE_PACKAGE || (existsSync(vendorPath) ? vendorPath : 'better-sqlite3');

let Database = null;
let db = null;
let sqliteAvailable = false;

// Try to load better-sqlite3, but don't fail if it's not available
try {
  Database = require(databasePackage);
  sqliteAvailable = true;
  console.log('SQLite (better-sqlite3) loaded successfully');
} catch (error) {
  console.warn('=== SQLite Not Available ===');
  console.warn('better-sqlite3 could not be loaded:', error.message);
  console.warn('History features will be disabled. This is normal in development mode.');
  console.warn('In production builds, better-sqlite3 will be properly compiled for Electron.');
  sqliteAvailable = false;
}

export async function initHistory() {
  console.log('=== Initializing History Database ===');
  
  if (!sqliteAvailable || !Database) {
    console.warn('SQLite not available - history features disabled');
    return null;
  }
  
  try {
    console.log('Vendor path:', vendorPath);
    console.log('Database package:', databasePackage);
    console.log('Vendor path exists:', existsSync(vendorPath));
    
    const dbDir = path.join(workspaceDir, 'db');
    console.log('Database directory:', dbDir);
    
    await mkdir(dbDir, { recursive: true });
    console.log('Database directory created/verified');
    
    const dbPath = path.join(dbDir, 'history.sqlite');
    console.log('Database path:', dbPath);
    console.log('Creating Database instance...');
    
    db = new Database(dbPath);
    console.log('Database instance created successfully');
    
    db.pragma('journal_mode = WAL');
    console.log('WAL mode enabled');
    
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
    console.log('Database schema created/verified');
    console.log('History database initialization complete');
    
    return db;
  } catch (error) {
    console.error('=== initHistory() Failed ===');
    console.error('Error:', error.message);
    console.warn('History features will be disabled');
    db = null;
    return null;
  }
}

export function recordRender(job) {
  if (!db || !sqliteAvailable) {
    console.log('[History] Recording skipped - SQLite not available');
    return;
  }
  
  try {
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
  } catch (error) {
    console.error('[History] Failed to record render:', error.message);
  }
}

export function getHistory({ page = 1, limit = 20, status = '' } = {}) {
  if (!db || !sqliteAvailable) {
    console.log('[History] Query skipped - SQLite not available');
    return { items: [], total: 0, page, limit };
  }
  
  try {
    const offset = (page - 1) * limit;
    const where = status ? 'WHERE status = ?' : '';
    const params = status ? [status] : [];

    const total = db.prepare(`SELECT COUNT(*) as count FROM renders ${where}`).get(...params)?.count || 0;
    const items = db
      .prepare(`SELECT * FROM renders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return { items, total, page, limit };
  } catch (error) {
    console.error('[History] Failed to get history:', error.message);
    return { items: [], total: 0, page, limit };
  }
}

export function getHistoryStats() {
  if (!db || !sqliteAvailable) {
    console.log('[History] Stats skipped - SQLite not available');
    return { total: 0, done: 0, failed: 0, totalSize: 0, totalDuration: 0, avgElapsed: 0 };
  }

  try {
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
  } catch (error) {
    console.error('[History] Failed to get stats:', error.message);
    return { total: 0, done: 0, failed: 0, totalSize: 0, totalDuration: 0, avgElapsed: 0 };
  }
}

export function clearHistory() {
  if (!db || !sqliteAvailable) {
    console.log('[History] Clear skipped - SQLite not available');
    return;
  }
  
  try {
    db.exec('DELETE FROM renders');
  } catch (error) {
    console.error('[History] Failed to clear history:', error.message);
  }
}
