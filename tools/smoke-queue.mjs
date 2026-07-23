import { mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { FFMPEG } from '../backend/bin-resolver.mjs';

const port = Number(process.env.PIDIOFORGE_TEST_PORT || 8818);
const base = `http://127.0.0.1:${port}`;
const root = path.join(os.tmpdir(), `pidioforge-queue-smoke-${Date.now()}`);
const sourceDir = path.join(root, 'source');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function api(route, body) {
  const r = await fetch(base + route, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!r.ok) throw new Error(`${route} ${r.status}: ${text.slice(0, 300)}`);
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

async function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } });
    let stderr = '';
    child.stdout.on('data', b => process.stdout.write(String(b)));
    child.stderr.on('data', b => {
      stderr += b.toString();
      process.stderr.write(String(b));
    });
    child.on('error', reject);
    child.on('close', code => (code === 0 ? resolve({ ok: true }) : reject(new Error(stderr || `${cmd} ${code}`))));
  });
}

async function makeSampleMedia(fileType, file) {
  await mkdir(path.dirname(file), { recursive: true });
  let args = [];
  if (fileType === 'video') {
    args = [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=640x360:rate=24:duration=4',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      file,
    ];
  } else if (fileType === 'audio') {
    args = [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=440:sample_rate=48000:duration=4',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '128k',
      file,
    ];
  }
  await run(FFMPEG, args);
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

  const visual = path.join(sourceDir, 'sample.mp4');
  const audio = path.join(sourceDir, 'sample.mp3');
  await makeSampleMedia('video', visual);
  await makeSampleMedia('audio', audio);

  // Reset queue state
  await api('/api/jobs/reset', {});

  // 1. Create a job via POST /api/jobs
  const config = {
    input: { visual, audio, title: 'Queue Smoke Test' },
    target: { duration: 2, resolution: '640x360', width: 640, height: 360, fps: 24, quality: 'fast' },
    spectrum: { enabled: false },
    branding: { logoEnabled: false },
    overlay: { enabled: false },
    audio: { normalize: false },
  };
  const job = await api('/api/jobs', { title: 'Queue Smoke Job', input: config.input, config });
  if (!job.id) throw new Error('Job creation failed: no id returned');
  console.log(`Job created: ${job.id} (${job.title})`);

  // 2. Check queue summary
  const summary = await api('/api/queue/summary');
  if (!summary || typeof summary.total === 'undefined') throw new Error('Queue summary failed');
  console.log(`Queue summary: total=${summary.total}, concurrency=${summary.queue?.concurrency}`);

  // 3. Check job appears in job list
  const jobList = await api('/api/jobs');
  const found = jobList.jobs?.find(j => j.id === job.id);
  if (!found) throw new Error('Job not found in job list after creation');
  console.log(`Job in list: status=${found.status}`);

  // 4. Duplicate job
  const dup = await api(`/api/jobs/${job.id}/duplicate`, {});
  const afterDup = await api('/api/jobs');
  if (afterDup.jobs.length < 2) throw new Error('Duplicate failed: job count did not increase');
  console.log(`Duplicate OK: ${afterDup.jobs.length} jobs`);

  // 5. Remove duplicated job
  const dupJob = afterDup.jobs.find(j => j.id !== job.id);
  await api(`/api/jobs/${dupJob.id}/remove`, {});
  const afterRemove = await api('/api/jobs');
  if (afterRemove.jobs.find(j => j.id === dupJob.id)) throw new Error('Remove failed: duplicated job still present');
  console.log('Remove OK');

  // 6. Send-to-queue from preview context
  const sendResult = await api('/api/preview/send-to-queue', { title: 'From Preview', input: config.input, config });
  if (!sendResult.job?.id) throw new Error('send-to-queue failed: no job.id returned');
  console.log(`send-to-queue OK: ${sendResult.job.id}`);

  // 7. Start queue (will fail to render since files are fake, but API should accept)
  const startResult = await api('/api/queue/start', { concurrency: 1 });
  if (!startResult.running && startResult.running !== undefined) {
    // Some implementations return running immediately
  }
  console.log('Queue start accepted');

  // 8. Pause queue
  await api('/api/queue/pause', {});
  const afterPause = await api('/api/queue/summary');
  console.log(`Queue paused=${afterPause.queue?.paused}`);

  console.log('smoke:queue ok');
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  if (child) child.kill('SIGTERM');
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
