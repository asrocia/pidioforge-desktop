// tools/smoke-pipeline.mjs
import { mkdir, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { FFMPEG } from '../backend/bin-resolver.mjs';

const port = Number(process.env.PIDIOFORGE_TEST_PORT || 8821);
const base = `http://127.0.0.1:${port}`;
const root = path.join(os.tmpdir(), `pidioforge-pipeline-smoke-${Date.now()}`);
const sourceDir = path.join(root, 'source');
const outputDir = path.join(root, 'output');

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
async function api(route, body, method) {
  const m = method ?? (body !== undefined ? 'POST' : 'GET');
  const r = await fetch(base + route, {
    method: m,
    headers: { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!r.ok) throw new Error(`${m} ${route} ${r.status}: ${text.slice(0, 300)}`);
  return json;
}
async function waitForApi() {
  for (let i = 0; i < 30; i++) {
    try {
      return await api('/api/health');
    } catch {
      await wait(400);
    }
  }
  throw new Error('API tidak aktif');
}
async function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', b => {
      stderr += b;
    });
    child.on('error', reject);
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(stderr || `exit ${code}`))));
  });
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
  await mkdir(sourceDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  // Synthesize test media
  const visual = path.join(sourceDir, 'visual.mp4');
  const audio = path.join(sourceDir, 'audio.mp3');
  await run(FFMPEG, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc2=size=640x360:rate=24:duration=3',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    visual,
  ]);
  await run(FFMPEG, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=48000:duration=3',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '128k',
    audio,
  ]);

  // STEP 1: patch config
  await api('/api/config', {
    input: { visual, audio, title: 'Pipeline Smoke', output: outputDir },
    target: {
      duration: 2,
      resolution: '640x360',
      width: 640,
      height: 360,
      fps: 24,
      quality: 'fast',
      crf: 28,
      hardwareAccel: 'cpu',
    },
    spectrum: { enabled: true, model: 'Wave', height: 60, nowPlaying: true, progressBar: true },
    branding: { logoEnabled: false, bumperEnabled: false, ctaEnabled: false, watermarkEnabled: false },
    overlay: { enabled: false },
    audio: { normalize: true, limiter: true, audioBitrate: '128k' },
    performance: { ffmpegThreads: 1, x264Preset: 'veryfast' },
  });
  const cfg = await api('/api/config');
  if (cfg.input?.title !== 'Pipeline Smoke') throw new Error('Config not persisted');
  console.log('step1 config-patch ok');

  // STEP 2: validate config
  const validation = await api('/api/config/validate', {
    config: cfg,
    visual,
    audio,
    outputDir,
  });
  console.log(`step2 validate ok=${validation.ok} warnings=${validation.warnings?.length ?? 0}`);

  // STEP 3: render/validate endpoint
  const renderVal = await api('/api/render/validate', {
    config: cfg,
    input: { visual, audio },
    outputDir,
  });
  console.log(`step3 render-validate ok=${renderVal.ok}`);

  // STEP 4: queue job
  await api('/api/jobs/reset', {});
  const job = await api('/api/jobs', {
    title: 'Pipeline Smoke Job',
    input: { visual, audio, lyrics: '' },
    outputDir,
    config: cfg,
  });
  if (!job.id) throw new Error('Job create: no id');
  console.log(`step4 job created: ${job.id}`);

  // STEP 5: start job
  await api(`/api/jobs/${job.id}/start`, {});
  let finalJob;
  for (let i = 0; i < 90; i++) {
    await wait(1000);
    const list = await api('/api/jobs');
    finalJob = list.jobs.find(j => j.id === job.id);
    process.stdout.write(`step5 render status=${finalJob?.status} progress=${finalJob?.progress}\n`);
    if (finalJob && ['done', 'failed', 'cancelled'].includes(finalJob.status)) break;
  }
  if (finalJob?.status !== 'done') {
    const list = await api('/api/jobs');
    const logs = list.logs || [];
    throw new Error(`Job did not complete: ${finalJob?.status} ${finalJob?.error}\nLogs:\n${logs.join('\n')}`);
  }
  const size = finalJob.output && existsSync(finalJob.output) ? statSync(finalJob.output).size : 0;
  if (size < 1000) throw new Error(`Output file too small: ${size} bytes at ${finalJob.output}`);
  console.log(`step5 render done output=${finalJob.output} size=${size}`);

  // STEP 6: verify history
  const stats = await api('/api/history/stats');
  console.log(`step6 history stats: ${JSON.stringify(stats)}`);

  // STEP 7: clear done jobs
  const cleared = await api('/api/queue/clear-done', {});
  if (cleared.removed < 1) throw new Error('clear-done: nothing removed');
  console.log(`step7 clear-done ok removed=${cleared.removed}`);

  console.log('smoke:pipeline ok');
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  if (child) child.kill('SIGTERM');
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
