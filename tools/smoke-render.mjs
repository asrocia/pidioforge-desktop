import { mkdir, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { FFMPEG } from '../backend/bin-resolver.mjs';

const port = Number(process.env.PIDIOFORGE_TEST_PORT || 8815);
const base = `http://127.0.0.1:${port}`;
const root = path.join(os.tmpdir(), `pidioforge-render-smoke-${Date.now()}`);
const sourceDir = path.join(root, 'source');
const outputDir = process.env.PIDIOFORGE_TEST_OUTPUT || path.join(root, 'output');

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
  for (let i = 0; i < 25; i++) {
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

async function ensureSourceMedia(type) {
  const candidate = type === 'video' ? process.env.PIDIOFORGE_TEST_VISUAL : process.env.PIDIOFORGE_TEST_AUDIO;
  if (candidate && existsSync(candidate)) return candidate;
  const sample = path.join(sourceDir, type === 'video' ? 'sample.mp4' : 'sample.mp3');
  await makeSampleMedia(type, sample);
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
  const health = await waitForApi();
  const diag = await api('/api/system/diagnostics');

  const visual = await ensureSourceMedia('video');
  const audio = await ensureSourceMedia('audio');
  const lyrics = process.env.PIDIOFORGE_TEST_LYRICS || ''; // safe to be empty

  await api('/api/jobs/reset', {});
  const config = {
    input: { visual, audio, title: 'PidioForge Smoke Render', output: outputDir },
    target: {
      duration: 2,
      resolution: '640x360',
      width: 640,
      height: 360,
      fps: 24,
      bitrate: '1200k',
      quality: 'fast',
      hardwareAccel: 'cpu',
      crf: 28,
    },
    lyrics: { enabled: existsSync(lyrics), file: lyrics, scale: 22, karaoke: false },
    spectrum: { enabled: true, nowPlaying: true, progressBar: true, height: 80, model: 'Wave' },
    branding: { logoEnabled: false, bumperEnabled: false, ctaEnabled: false, watermarkEnabled: false },
    overlay: { enabled: true, timestamp: true, timestampText: 'Rendered by PidioForge', darken: false },
    audio: { normalize: true, limiter: true, audioBitrate: '128k' },
    performance: { ffmpegThreads: 1, x264Preset: 'veryfast' },
  };

  await mkdir(outputDir, { recursive: true });
  const job = await api('/api/jobs', {
    title: 'PidioForge Smoke Render',
    input: { visual, audio, lyrics },
    outputDir,
    config,
  });
  await api(`/api/jobs/${job.id}/start`, {});
  let finalJob;
  for (let i = 0; i < 90; i++) {
    await wait(1000);
    const jobs = await api('/api/jobs');
    finalJob = jobs.jobs.find(x => x.id === job.id);
    process.stdout.write(`render status=${finalJob?.status} progress=${finalJob?.progress}\n`);
    if (finalJob && ['done', 'failed', 'cancelled'].includes(finalJob.status)) break;
  }
  const size = finalJob?.output && existsSync(finalJob.output) ? statSync(finalJob.output).size : 0;
  const result = {
    health,
    diag: {
      ffmpeg: diag.ffmpeg,
      ffprobe: diag.ffprobe,
      ffmpegPath: diag.ffmpegPath,
      ffprobePath: diag.ffprobePath,
      recommended: diag.recommended,
    },
    job: {
      status: finalJob?.status,
      progress: finalJob?.progress,
      output: finalJob?.output,
      error: finalJob?.error,
      size,
    },
  };
  console.log(JSON.stringify(result, null, 2));
  if (!health.ffmpeg || !diag.ffmpeg || !diag.ffprobe || finalJob?.status !== 'done' || size < 1000)
    process.exitCode = 2;
} finally {
  if (child) child.kill('SIGTERM');
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
