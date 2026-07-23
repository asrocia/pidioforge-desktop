// tools/rebuild-sqlite-dev.mjs
// Rebuilds better-sqlite3 into backend/vendor/ for the current system Node ABI.
// Safe to run multiple times — skips if ABI stamp matches.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendorDir = path.join(root, 'backend', 'vendor');
const addonPath = path.join(vendorDir, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
const stampPath = path.join(vendorDir, '.node-abi');
const currentAbi = process.versions.modules;

function needsRebuild() {
  if (!existsSync(addonPath)) return true;
  try {
    return readFileSync(stampPath, 'utf8').trim() !== currentAbi;
  } catch {
    return true;
  }
}

if (!needsRebuild()) {
  console.log(`[sqlite-dev] ABI ${currentAbi} OK, skip rebuild.`);
  process.exit(0);
}

console.log(`[sqlite-dev] Rebuilding better-sqlite3 for system Node ABI ${currentAbi}...`);
try {
  mkdirSync(vendorDir, { recursive: true });

  const vendorPkg = path.join(vendorDir, 'package.json');
  if (!existsSync(vendorPkg)) {
    writeFileSync(vendorPkg, JSON.stringify({ name: 'sqlite-vendor', private: true }));
  }

  const rootPkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const bsqVersion = rootPkg.dependencies['better-sqlite3'];

  execFileSync('npm', ['install', `better-sqlite3@${bsqVersion}`, '--prefix', vendorDir, '--no-save'], {
    stdio: 'inherit',
    cwd: root,
    shell: true,
  });

  writeFileSync(stampPath, currentAbi);
  console.log('[sqlite-dev] Done — history will be available in dev.');
} catch (err) {
  console.warn('[sqlite-dev] Rebuild failed (build tools may be missing):', err.message);
  console.warn('[sqlite-dev] History will be disabled in dev — server still starts.');
  process.exit(0);
}
