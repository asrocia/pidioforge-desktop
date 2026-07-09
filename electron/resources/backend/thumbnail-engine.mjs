import path from 'node:path';
import { mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { FFMPEG } from './bin-resolver.mjs';
import { runCmd, ffprobeInfo } from './ffmpeg-utils.mjs';
import { workspaceDir } from './config.mjs';
import { safeId } from './media-utils.mjs';

export async function generateThumbnails({ input = '', timestamps = [], count = 4, outputDir = '' } = {}) {
  const source = path.resolve(String(input || ''));
  if (!source || !existsSync(source)) throw new Error('File video tidak ditemukan.');

  const info = await ffprobeInfo(source).catch(() => ({ duration: 0 }));
  const duration = Number(info.duration || 0);
  if (duration <= 0) throw new Error('Durasi video tidak terdeteksi.');

  const outDir = outputDir ? path.resolve(outputDir) : path.join(workspaceDir, 'thumbnails');
  await mkdir(outDir, { recursive: true });

  // Generate timestamps if not provided
  const times = timestamps.length > 0
    ? timestamps.map(t => Math.max(0, Math.min(duration, Number(t))))
    : generateSmartTimestamps(duration, count);

  const results = [];
  for (const t of times) {
    const id = safeId('thumb');
    const output = path.join(outDir, `${id}.jpg`);
    const args = [
      '-y', '-ss', String(t), '-i', source,
      '-vframes', '1', '-q:v', '2',
      '-vf', 'scale=1280:-2',
      output,
    ];
    const result = await runCmd(FFMPEG, args);
    if (result.ok && existsSync(output)) {
      const st = await stat(output).catch(() => null);
      results.push({
        timestamp: t,
        path: output,
        url: `/api/media/file?path=${encodeURIComponent(output)}`,
        size: st?.size || 0,
      });
    }
  }

  if (!results.length) throw new Error('Gagal mengekstrak thumbnail dari video.');

  // Pick best thumbnail (largest file = most detail/contrast)
  const best = results.reduce((a, b) => (b.size > a.size ? b : a), results[0]);

  return {
    ok: true,
    thumbnails: results,
    best,
    inputDuration: duration,
    outputDir: outDir,
  };
}

function generateSmartTimestamps(duration, count = 4) {
  const timestamps = [];
  // Skip first/last 10% of video (usually intro/outro)
  const start = duration * 0.1;
  const end = duration * 0.9;
  const range = end - start;
  const step = range / (count + 1);

  for (let i = 1; i <= count; i++) {
    timestamps.push(Math.round((start + step * i) * 100) / 100);
  }
  return timestamps;
}
