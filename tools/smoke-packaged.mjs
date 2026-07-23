/**
 * Smoke test for packaged backend (electron/resources/backend/server.mjs).
 * Spawns the bundled backend, waits for health, hits core routes, then kills.
 * Also verifies Phase 4 error hardening (invalid JSON → 400, no stack leak).
 *
 * Usage: npm run smoke:packaged
 * Requires: npm run prepare:build ran first.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resourceBackend = path.join(root, 'electron', 'resources', 'backend', 'server.mjs');
const nodeBin = path.join(
  root,
  'electron',
  'resources',
  'bin',
  process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux',
  process.platform === 'win32' ? 'node.exe' : 'node',
);
const port = 18799;
const base = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(path, opts) {
  const res = await fetch(`${base}${path}`, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: res.status, body };
}

async function waitForHealth(maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { status, body } = await fetchJson('/api/health');
      if (status === 200 && body.ok) return body;
    } catch {
      /* retry */
    }
    await wait(500);
  }
  throw new Error('Packaged backend health check failed after 10s');
}

let passed = 0;
let failed = 0;
function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

let child;
try {
  // Verify resources exist
  if (!existsSync(resourceBackend)) throw new Error(`Missing: ${resourceBackend}. Run npm run prepare:build first.`);
  const nodeCmd = existsSync(nodeBin) ? nodeBin : process.execPath;

  console.log(`Starting packaged backend: ${nodeCmd} ${resourceBackend}`);
  child = spawn(nodeCmd, [resourceBackend], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PIDIOFORGE_API_PORT: String(port),
      PIDIOFORGE_RESOURCE_DIR: path.join(root, 'electron', 'resources'),
      PIDIOFORGE_DATA_DIR: path.join(root, '.test-packaged-data'),
      PIDIOFORGE_LOG_DIR: path.join(root, '.test-packaged-logs'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  child.stderr.on('data', () => {}); // suppress noise

  console.log('Waiting for health...');
  const health = await waitForHealth();
  assert(health.ok === true, 'health endpoint ok');
  assert(health.ffmpeg === true, 'health reports ffmpeg available');
  assert(typeof health.ffmpegPath === 'string' && health.ffmpegPath.length > 0, 'health reports ffmpeg path');
  assert(typeof health.dataDir === 'string' && health.dataDir.length > 0, 'health reports data dir');
  assert(typeof health.app === 'string' && health.app.includes('PidioForge'), 'health reports app name');
  assert(health.ffprobe === true, 'health reports ffprobe available');
  assert(!('stack' in health), 'health response does not leak stack');

  const packagedState = await fetchJson('/api/state');
  assert(packagedState.status === 200, '/api/state returns 200');
  assert(Array.isArray(packagedState.body.projects), '/api/state returns projects array');
  assert(!('stack' in packagedState.body), '/api/state does not leak stack');

  const packagedJobs = await fetchJson('/api/jobs');
  assert(packagedJobs.status === 200, '/api/jobs returns 200');
  assert(Array.isArray(packagedJobs.body.jobs), '/api/jobs returns jobs array');
  assert(!('stack' in packagedJobs.body), '/api/jobs does not leak stack');

  const diagnostics = await fetchJson('/api/system/diagnostics');
  assert(diagnostics.status === 200, '/api/system/diagnostics returns 200');
  assert(typeof diagnostics.body.version === 'string', 'diagnostics returns ffmpeg version string');
  assert(typeof diagnostics.body.recommended === 'string', 'diagnostics returns recommended encoder');

  const pathInfo = await fetchJson('/api/path/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path: root, kind: 'directory', filter: 'media' }),
  });
  assert(pathInfo.status === 200, '/api/path/info returns 200');
  assert(pathInfo.body.ok === true, '/api/path/info returns ok for project root');
  assert(!('stack' in pathInfo.body), '/api/path/info does not leak stack');

  // 404 route
  const notFound = await fetchJson('/api/nonexistent');
  assert(notFound.status === 404, 'unknown route returns 404');
  assert(notFound.body.error === 'not found', '404 has error message');

  // Phase 4 error hardening verification
  console.log('\nError hardening (Phase 4):');
  const invalidJson = await fetchJson('/api/path/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{invalid-json',
  });
  assert(invalidJson.status === 400, 'invalid JSON returns 400');
  assert(typeof invalidJson.body.error === 'string', '400 has error string');
  assert(!('stack' in invalidJson.body), '400 response does not leak stack');

  const bigBody = 'x'.repeat(3_000_000);
  const tooBig = await fetchJson('/api/path/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: bigBody,
  });
  assert(tooBig.status === 413, 'oversized payload returns 413');
  assert(typeof tooBig.body.error === 'string', '413 has error string');

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
} catch (error) {
  console.error('\nSmoke test crashed:', error.message);
  process.exitCode = 1;
} finally {
  if (child) {
    child.kill('SIGTERM');
    await wait(500);
    if (!child.killed) child.kill('SIGKILL');
  }
}
