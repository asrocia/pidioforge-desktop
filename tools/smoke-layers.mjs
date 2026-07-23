import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = path.join(root, '.test-layer-order-tmp');
const { buildFfmpegArgs } = await import('../backend/render-engine.mjs');
const { FFMPEG } = await import('../backend/bin-resolver.mjs');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', b => (stderr += b.toString()));
    child.on('error', reject);
    child.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}: ${stderr.slice(0, 300)}`)),
    );
  });
}

async function generateImage(name, color) {
  const out = path.join(tmpDir, name);
  await run(FFMPEG, ['-y', '-f', 'lavfi', '-i', `color=c=${color}:s=160x90:d=1`, '-frames:v', '1', out]);
  return out;
}

async function generateAudio(name) {
  const out = path.join(tmpDir, name);
  await run(FFMPEG, ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4', '-c:a', 'pcm_s16le', out]);
  return out;
}

function assert(condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`  ✓ ${label}`);
}

function indexOfOrThrow(text, needle, label) {
  const idx = text.indexOf(needle);
  if (idx === -1) throw new Error(`Missing ${label}: ${needle}`);
  return idx;
}

try {
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  const visual = await generateImage('visual.png', 'black');
  const logo = await generateImage('logo.png', 'white');
  const audio = await generateAudio('audio.wav');
  const lyrics = path.join(tmpDir, 'lyrics.lrc');
  await writeFile(lyrics, '[00:00.00]Halo dunia\n[00:02.00]Baris dua\n', 'utf8');

  const config = {
    input: { visual, audio, title: 'Layer Test', output: tmpDir },
    target: {
      duration: 4,
      resolution: '160x90',
      width: 160,
      height: 90,
      fps: 12,
      bitrate: '800k',
      quality: 'fast',
      hardwareAccel: 'cpu',
      crf: 30,
    },
    lyrics: {
      enabled: true,
      file: lyrics,
      scale: 18,
      color: '#ffffff',
      highlightColor: '#22c55e',
      position: 'Bawah',
      align: 'Rata Tengah',
      outline: 1,
      shadow: 1,
      karaoke: false,
      font: 'Arial',
    },
    spectrum: {
      enabled: true,
      nowPlaying: true,
      progressBar: false,
      height: 40,
      model: 'Wave',
      nowPlayingPosition: 'Atas',
      nowPlayingColor: '#ffffff',
      nowPlayingFontSize: 16,
      nowPlayingTemplate: '{title}',
    },
    branding: {
      logoEnabled: true,
      logo,
      logoPosition: 'Kanan Atas',
      logoScale: 18,
      logoOpacity: 100,
      watermarkEnabled: true,
      watermarkText: 'WM',
      watermarkPosition: 'Kiri Bawah',
      watermarkOpacity: 70,
      layerOrder: 'spectrum,logo,lyrics,watermark,nowPlaying,timestamp,lowerThird',
      bumperEnabled: false,
      ctaEnabled: false,
    },
    overlay: {
      timestamp: true,
      timestampText: 'TS',
      timestampPosition: 'Kiri Atas',
      lowerThirdEnabled: true,
      lowerThirdText: 'LT',
      lowerThirdPosition: 'Bawah',
      lowerThirdAt: 1,
      lowerThirdDuration: 2,
      videoParticle: false,
    },
    audio: { normalize: false, limiter: false, audioBitrate: '128k', beatDetection: false },
    performance: { ffmpegThreads: 1, x264Preset: 'veryfast' },
  };

  const { args } = await buildFfmpegArgs({ id: 'layer-order-test', input: { visual, audio, lyrics } }, config, tmpDir);
  const filterIndex = args.indexOf('-filter_complex');
  assert(filterIndex >= 0, 'filter_complex present');
  const filter = args[filterIndex + 1];

  const spectrumIdx = indexOfOrThrow(filter, 'showwaves', 'spectrum filter');
  const logoIdx = indexOfOrThrow(filter, '[logo]overlay', 'logo overlay');
  const lyricsIdx = indexOfOrThrow(filter, '-lyrics.ass', 'lyrics ass');
  const watermarkIdx = indexOfOrThrow(filter, '-watermark.ass', 'watermark ass');
  const nowPlayingIdx = indexOfOrThrow(filter, '-nowPlaying.ass', 'nowPlaying ass');
  const timestampIdx = indexOfOrThrow(filter, '-timestamp.ass', 'timestamp ass');
  const lowerThirdIdx = indexOfOrThrow(filter, '-lowerThird.ass', 'lowerThird ass');

  assert(spectrumIdx < logoIdx, 'spectrum applied before logo');
  assert(logoIdx < lyricsIdx, 'logo applied before lyrics');
  assert(lyricsIdx < watermarkIdx, 'lyrics applied before watermark');
  assert(watermarkIdx < nowPlayingIdx, 'watermark applied before nowPlaying');
  assert(nowPlayingIdx < timestampIdx, 'nowPlaying applied before timestamp');
  assert(timestampIdx < lowerThirdIdx, 'timestamp applied before lowerThird');

  assert(existsSync(path.join(tmpDir, 'tmp', 'layer-order-test-lyrics.ass')), 'lyrics ass file written');
  assert(existsSync(path.join(tmpDir, 'tmp', 'layer-order-test-watermark.ass')), 'watermark ass file written');
  assert(existsSync(path.join(tmpDir, 'tmp', 'layer-order-test-nowPlaying.ass')), 'nowPlaying ass file written');
  assert(existsSync(path.join(tmpDir, 'tmp', 'layer-order-test-timestamp.ass')), 'timestamp ass file written');
  assert(existsSync(path.join(tmpDir, 'tmp', 'layer-order-test-lowerThird.ass')), 'lowerThird ass file written');

  console.log('\nLayer order smoke test passed');
} catch (error) {
  console.error(error.message);
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
}
