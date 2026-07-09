import { mkdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { FFMPEG } from '../backend/bin-resolver.mjs';

const port = Number(process.env.PIDIOFORGE_TEST_PORT || 8816);
const base = `http://127.0.0.1:${port}`;
const duration = Number(process.env.PIDIOFORGE_LOOP_DURATION || 18);
const root = path.join(os.tmpdir(), `pidioforge-loop-smoke-${Date.now()}`);
const sourceDir = path.join(root, 'source');
const batchDir = path.join(root, 'batch');
const outputDir = path.join(root, 'output');

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function api(route, body) {
  const r = await fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`${route} ${r.status}: ${text.slice(0, 300)}`);
  return json;
}
async function waitForApi() {
  for (let i = 0; i < 40; i++) {
    try { return await api('/api/health'); } catch { await wait(400); }
  }
  throw new Error('API tidak aktif');
}
async function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } });
    let stderr = '';
    child.stdout.on('data', b => process.stdout.write(String(b)));
    child.stderr.on('data', b => { stderr += b.toString(); process.stderr.write(String(b)); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ ok: true }) : reject(new Error(stderr || `${cmd} ${code}`)));
  });
}
async function makeSampleVideo(file) {
  await mkdir(path.dirname(file), { recursive: true });
  const args = [
    '-y',
    '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
    '-t', '8',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-shortest',
    file,
  ];
  await run(FFMPEG, args);
}
async function ensureSourceVideo() {
  const candidate = process.env.PIDIOFORGE_TEST_VISUAL || '';
  if (candidate && existsSync(candidate)) return candidate;
  const sample = path.join(sourceDir, 'sample-loop.mp4');
  await makeSampleVideo(sample);
  return sample;
}

let child;
if (process.env.PIDIOFORGE_START_API !== '0') {
  await mkdir(root, { recursive: true });
  child = spawn(process.execPath, ['backend/server.mjs'], {
    env: { ...process.env, PIDIOFORGE_API_PORT: String(port), PIDIOFORGE_DATA_DIR: path.join(root, 'data') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', b => process.stdout.write(`[api] ${b}`));
  child.stderr.on('data', b => process.stderr.write(`[api] ${b}`));
}

try {
  await waitForApi();
  const visual = await ensureSourceVideo();
  await mkdir(outputDir, { recursive: true });
  await api('/api/loop/validate', { input: visual, duration, output: path.join(outputDir, 'single-loop.mp4'), mode: 'encode', loopStyle: 'crossfade', crossfade: 0.5, preset: 'source' });
  const job = await api('/api/loop/start', { input: visual, duration, output: path.join(outputDir, 'single-loop.mp4'), mode: 'encode', loopStyle: 'crossfade', crossfade: 0.5, preset: 'source' });
  let current = job;
  for (let i = 0; i < 120; i++) {
    await wait(1000);
    current = await api(`/api/loop/status?id=${encodeURIComponent(job.id)}`);
    process.stdout.write(`loop status=${current.status} progress=${current.progress} eta=${current.etaSeconds}\n`);
    if (['done', 'failed', 'cancelled'].includes(current.status)) break;
  }
  const batchSource = path.join(batchDir, 'set-a');
  await mkdir(batchSource, { recursive: true });
  await copyFile(visual, path.join(batchSource, 'a.mp4'));
  await copyFile(visual, path.join(batchSource, 'b.mp4'));
  await copyFile(visual, path.join(batchSource, 'c.mp4'));
  const batch = await api('/api/loop/batch', { items: [batchSource], duration: 6, mode: 'copy', loopStyle: 'normal', preset: 'source', outputDir: path.join(outputDir, 'batch') });
  const summary = {
    visual,
    single: { id: job.id, status: current.status, progress: current.progress, output: current.output, size: current.size },
    batch: { created: batch.created.length, skipped: batch.skipped.length, scanned: batch.scanned, limited: batch.limited, outputDir: batch.outputDir },
  };
  console.log(JSON.stringify(summary, null, 2));
  if (current.status !== 'done' || !current.output || !existsSync(current.output) || batch.created.length < 1) process.exitCode = 2;
} finally {
  if (child) child.kill('SIGTERM');
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
