import { existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';

const port = Number(process.env.PIDIOFORGE_TEST_PORT || 8815);
const base = `http://127.0.0.1:${port}`;
const visual = process.env.PIDIOFORGE_TEST_VISUAL || '/data/satsetpidio-test/visual.mp4';
const audio = process.env.PIDIOFORGE_TEST_AUDIO || '/data/satsetpidio-test/audio.mp3';
const lyrics = process.env.PIDIOFORGE_TEST_LYRICS || '/data/satsetpidio-test/lirik.lrc';
const outputDir = process.env.PIDIOFORGE_TEST_OUTPUT || '/data/satsetpidio-test/Hasil';

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function api(path, body) {
  const r = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`${path} ${r.status}: ${text.slice(0, 300)}`);
  return json;
}
async function waitForApi() {
  for (let i = 0; i < 25; i++) {
    try { return await api('/api/health'); } catch { await wait(400); }
  }
  throw new Error('API tidak aktif');
}

let child;
if (process.env.PIDIOFORGE_START_API !== '0') {
  child = spawn(process.execPath, ['backend/server.mjs'], {
    env: { ...process.env, PIDIOFORGE_API_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', b => process.stdout.write(`[api] ${b}`));
  child.stderr.on('data', b => process.stderr.write(`[api] ${b}`));
}

try {
  const health = await waitForApi();
  const diag = await api('/api/system/diagnostics');
  await api('/api/jobs/reset', {});
  const config = {
    input: { visual, audio, title: 'PidioForge Smoke Render', output: outputDir },
    target: { duration: 2, resolution: '640x360', width: 640, height: 360, fps: 24, bitrate: '1200k', quality: 'fast', hardwareAccel: 'cpu', crf: 28 },
    lyrics: { enabled: existsSync(lyrics), file: lyrics, scale: 22, karaoke: false },
    spectrum: { enabled: true, nowPlaying: true, progressBar: true, height: 80, model: 'Wave' },
    branding: { logoEnabled: false, bumperEnabled: false, ctaEnabled: false, watermarkEnabled: false },
    overlay: { enabled: true, timestamp: true, timestampText: 'Rendered by PidioForge', darken: false },
    audio: { normalize: true, limiter: true, audioBitrate: '128k' },
    performance: { ffmpegThreads: 1, x264Preset: 'veryfast' },
  };
  const job = await api('/api/jobs', { title: 'PidioForge Smoke Render', input: { visual, audio, lyrics }, outputDir, config });
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
  const result = { health, diag: { ffmpeg: diag.ffmpeg, ffprobe: diag.ffprobe, ffmpegPath: diag.ffmpegPath, ffprobePath: diag.ffprobePath, recommended: diag.recommended }, job: { status: finalJob?.status, progress: finalJob?.progress, output: finalJob?.output, error: finalJob?.error, size } };
  console.log(JSON.stringify(result, null, 2));
  if (!health.ffmpeg || !diag.ffmpeg || !diag.ffprobe || finalJob?.status !== 'done' || size < 1000) process.exitCode = 2;
} finally {
  if (child) child.kill('SIGTERM');
}
