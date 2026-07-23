import { mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FFMPEG } from './bin-resolver.mjs';
import { safeId, isVideo } from './media-utils.mjs';
import { runCmd, runBuffer, runLoopFfmpeg, ffprobeInfo, diskStats } from './ffmpeg-utils.mjs';
import { workspaceDir } from './config.mjs';

export function outputPresetArgs(preset = 'source') {
  if (preset === 'youtube1080')
    return ['-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2'];
  if (preset === 'shorts') return ['-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'];
  if (preset === 'tiktok') return ['-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'];
  if (preset === 'square') return ['-vf', 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080'];
  if (preset === 'wallpaper4k')
    return ['-vf', 'scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2'];
  return [];
}

export async function makeLoopUnit({
  source,
  unitPath,
  trimStart,
  segmentDuration,
  loopStyle,
  crossfade,
  muteAudio,
  audioFade,
  inputInfo,
}) {
  const ss = trimStart > 0 ? ['-ss', String(trimStart)] : [];
  const t = ['-t', String(segmentDuration)];
  if (loopStyle === 'pingpong') {
    const filters = ['[0:v]split[vf][vr]', '[vr]reverse[rv]', '[vf][rv]concat=n=2:v=1:a=0[v]'];
    const args = ['-y', ...ss, ...t, '-i', source, '-filter_complex', filters.join(';'), '-map', '[v]'];
    if (!muteAudio && inputInfo.hasAudio)
      args.push(
        '-map',
        '0:a?',
        '-af',
        audioFade
          ? `afade=t=in:st=0:d=${Math.min(1, segmentDuration / 4)},afade=t=out:st=${Math.max(0, segmentDuration - Math.min(1, segmentDuration / 4))}:d=${Math.min(1, segmentDuration / 4)}`
          : 'anull',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
      );
    args.push(
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      unitPath,
    );
    const result = await runCmd(FFMPEG, args);
    if (!result.ok) throw new Error(result.stderr || 'Ping-pong loop gagal.');
    return;
  }
  if (loopStyle === 'crossfade' && crossfade > 0.05) {
    const fade = Math.min(crossfade, Math.max(0.05, segmentDuration / 3));
    const offset = Math.max(0.05, segmentDuration - fade);
    const filters = [
      `[0:v][1:v]xfade=transition=fade:duration=${fade}:offset=${offset},trim=duration=${segmentDuration},setpts=PTS-STARTPTS,format=yuv420p[v]`,
    ];
    const args = [
      '-y',
      ...ss,
      ...t,
      '-i',
      source,
      ...ss,
      ...t,
      '-i',
      source,
      '-filter_complex',
      filters.join(';'),
      '-map',
      '[v]',
    ];
    if (!muteAudio && inputInfo.hasAudio)
      args.push(
        '-map',
        '0:a?',
        '-af',
        audioFade
          ? `afade=t=in:st=0:d=${fade},afade=t=out:st=${Math.max(0, segmentDuration - fade)}:d=${fade}`
          : 'anull',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
      );
    args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-movflags', '+faststart', unitPath);
    const result = await runCmd(FFMPEG, args);
    if (!result.ok) throw new Error(result.stderr || 'Crossfade loop gagal.');
    return;
  }
  const args = ['-y', ...ss, ...t, '-i', source];
  if (muteAudio) args.push('-an');
  else if (audioFade && inputInfo.hasAudio)
    args.push(
      '-af',
      `afade=t=in:st=0:d=${Math.min(1, segmentDuration / 4)},afade=t=out:st=${Math.max(0, segmentDuration - Math.min(1, segmentDuration / 4))}:d=${Math.min(1, segmentDuration / 4)}`,
    );
  args.push(
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    unitPath,
  );
  const result = await runCmd(FFMPEG, args);
  if (!result.ok) throw new Error(result.stderr || 'Loop unit gagal.');
}

export async function renderLoopVideo(
  {
    input = '',
    duration = 60,
    output = '',
    mode = 'copy',
    loopStyle = 'normal',
    crossfade = 0.5,
    trimStart = 0,
    trimEnd = 0,
    muteAudio = false,
    audioFade = false,
    preset = 'source',
  } = {},
  callbacks = {},
) {
  const source = path.resolve(String(input || ''));
  const targetDuration = Math.max(1, Math.min(24 * 60 * 60, Number(duration || 60)));
  if (!source || !existsSync(source)) throw new Error('File video loop tidak ditemukan.');
  if (!isVideo(source)) throw new Error('Input loop harus file video.');
  const inputInfo = await ffprobeInfo(source).catch(() => ({ duration: 0 }));
  const outDir = path.join(workspaceDir, 'loops');
  await mkdir(outDir, { recursive: true });
  const fallbackName = `${path.basename(source, path.extname(source))}-loop-${Math.round(targetDuration)}s.mp4`;
  const finalOutput = output ? path.resolve(String(output)) : path.join(outDir, fallbackName);
  await mkdir(path.dirname(finalOutput), { recursive: true });
  const start = Math.max(0, Number(trimStart || 0));
  const end = Number(trimEnd || 0);
  const sourceDuration = Number(inputInfo.duration || 0);
  const segmentDuration = Math.max(
    0.2,
    end > start ? end - start : Math.max(0.2, sourceDuration - start || sourceDuration || targetDuration),
  );
  const needsUnit =
    loopStyle !== 'normal' ||
    start > 0 ||
    end > 0 ||
    muteAudio ||
    audioFade ||
    mode === 'encode' ||
    preset !== 'source';
  const loopInput = needsUnit ? path.join(outDir, `${safeId('loop-unit')}.mp4`) : source;
  if (needsUnit)
    await makeLoopUnit({
      source,
      unitPath: loopInput,
      trimStart: start,
      segmentDuration,
      loopStyle,
      crossfade: Number(crossfade || 0),
      muteAudio,
      audioFade,
      inputInfo,
    });
  const args = [
    '-y',
    '-stream_loop',
    '-1',
    '-i',
    loopInput,
    '-t',
    String(targetDuration),
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
  ];
  const presetArgs = outputPresetArgs(preset);
  if (mode === 'copy' && !needsUnit && !presetArgs.length) args.push('-c', 'copy');
  else
    args.push(
      ...presetArgs,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      muteAudio ? '-an' : '-c:a',
      muteAudio ? '' : 'aac',
      ...(muteAudio ? [] : ['-b:a', '192k']),
    );
  for (let i = args.length - 1; i >= 0; i--) if (args[i] === '') args.splice(i, 1);
  args.push('-movflags', '+faststart');
  if (callbacks.onProgress || callbacks.onProcess) {
    args.push('-progress', 'pipe:1', '-nostats', finalOutput);
    await runLoopFfmpeg(args, targetDuration, callbacks);
    callbacks.onProgress?.({ progress: 100, renderedSeconds: targetDuration });
  } else {
    args.push(finalOutput);
    const result = await runCmd(FFMPEG, args);
    if (!result.ok) throw new Error(result.stderr || 'Looping video gagal.');
  }
  const st = await stat(finalOutput).catch(() => null);
  return {
    ok: true,
    output: finalOutput,
    url: `/api/media/file?path=${encodeURIComponent(finalOutput)}`,
    inputDuration: Number(inputInfo.duration || 0),
    unitDuration: segmentDuration,
    duration: targetDuration,
    size: st?.size || 0,
    mode,
    loopStyle,
    preset,
  };
}

export async function renderLoopSeamPreview(options = {}) {
  const source = path.resolve(String(options.input || ''));
  if (!source || !existsSync(source) || !isVideo(source)) throw new Error('File video preview loop tidak valid.');
  const info = await ffprobeInfo(source);
  const start = Math.max(0, Number(options.trimStart || 0));
  const end = Number(options.trimEnd || 0);
  const segmentDuration = Math.max(0.2, end > start ? end - start : Math.max(0.2, Number(info.duration || 0) - start));
  const previewSeconds = Math.min(2, Math.max(0.5, Number(options.previewSeconds || 1)));
  const outDir = path.join(workspaceDir, 'loops');
  await mkdir(outDir, { recursive: true });
  const output = path.join(outDir, `${safeId('seam-preview')}.mp4`);
  const tailStart = start + Math.max(0, segmentDuration - previewSeconds);
  const filter = '[0:v][1:v]concat=n=2:v=1:a=0[v]';
  const args = [
    '-y',
    '-ss',
    String(tailStart),
    '-t',
    String(previewSeconds),
    '-i',
    source,
    '-ss',
    String(start),
    '-t',
    String(previewSeconds),
    '-i',
    source,
    '-filter_complex',
    filter,
    '-map',
    '[v]',
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '22',
    '-pix_fmt',
    'yuv420p',
    output,
  ];
  const result = await runCmd(FFMPEG, args);
  if (!result.ok) throw new Error(result.stderr || 'Preview sambungan gagal.');
  const st = await stat(output).catch(() => null);
  const quality = await analyzeLoopPoint(options).catch(() => null);
  return {
    ok: true,
    output,
    url: `/api/media/file?path=${encodeURIComponent(output)}`,
    size: st?.size || 0,
    previewSeconds,
    quality: quality?.best || null,
    candidates: quality?.candidates || [],
  };
}

export async function renderLoopBatch({ items = [], outputDir = '', ...options } = {}) {
  const files = Array.isArray(items) ? items : [];
  if (!files.length) throw new Error('Batch loop kosong.');
  const outDir = outputDir ? path.resolve(String(outputDir)) : path.join(workspaceDir, 'loops', `batch-${Date.now()}`);
  await mkdir(outDir, { recursive: true });
  const expanded = [];
  const seen = new Set();
  const limit = Math.max(1, Math.min(250, Number(options.batchLimit || 100)));
  async function pushMedia(entry) {
    const resolved = path.resolve(String(entry));
    if (seen.has(resolved)) return;
    seen.add(resolved);
    if (isVideo(resolved)) expanded.push(resolved);
  }
  async function expandEntry(entry) {
    const input = typeof entry === 'string' ? entry : entry.input || entry.path || '';
    if (!input) return;
    const resolved = path.resolve(String(input));
    const st = await stat(resolved).catch(() => null);
    if (!st) return;
    if (st.isFile()) {
      await pushMedia(resolved);
      return;
    }
    if (!st.isDirectory()) return;
    const stack = [resolved];
    while (stack.length) {
      const dir = stack.pop();
      const entries = await readdir(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      for (const item of entries) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          stack.push(full);
          continue;
        }
        if (isVideo(full)) await pushMedia(full);
        if (expanded.length >= limit) return;
      }
    }
  }
  for (const item of files) {
    await expandEntry(item);
    if (expanded.length >= limit) break;
  }
  if (!expanded.length) throw new Error('Batch loop tidak menemukan file video.');
  const results = [];
  const skipped = [];
  for (const input of expanded) {
    try {
      const name = path.basename(input, path.extname(input));
      const output = path.join(outDir, `${name}-loop-${Math.round(Number(options.duration || 60))}s.mp4`);
      results.push(await renderLoopVideo({ ...options, input, output }));
    } catch (error) {
      skipped.push({ input, error: error.message });
    }
  }
  return {
    ok: true,
    outputDir: outDir,
    created: results,
    skipped,
    scanned: expanded.length,
    limited: expanded.length >= limit,
  };
}

export async function validateLoopOptions(options = {}) {
  const errors = [];
  const warnings = [];
  const source = path.resolve(String(options.input || ''));
  const targetDuration = Number(options.duration || 0);
  if (!options.input) errors.push('Video pendek belum dipilih.');
  else if (!existsSync(source)) errors.push(`Video tidak ditemukan: ${source}`);
  else if (!isVideo(source)) errors.push('Input harus file video.');
  if (!targetDuration || targetDuration < 1) errors.push('Durasi target tidak valid.');
  if (targetDuration > 3600) warnings.push('Durasi lebih dari 1 jam; pastikan disk cukup dan gunakan progress/cancel.');
  const info = existsSync(source) ? await ffprobeInfo(source).catch(() => null) : null;
  if (info && !info.hasVideo) errors.push('File tidak punya stream video.');
  if (options.output) {
    const out = path.resolve(String(options.output));
    const parent = path.dirname(out);
    if (!existsSync(parent)) errors.push(`Folder output tidak ditemukan: ${parent}`);
    if (existsSync(out)) warnings.push('Output sudah ada dan akan ditimpa.');
  }
  const disk = await diskStats(options.output ? path.dirname(path.resolve(String(options.output))) : workspaceDir);
  if (disk.ok && disk.freeGB < 2) warnings.push(`Sisa disk rendah: ${disk.freeGB} GB.`);
  const inputDuration = Number(info?.duration || 0);
  const loopsNeeded = inputDuration ? Math.ceil(targetDuration / Math.max(0.1, inputDuration)) : 0;
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    inputDuration,
    loopsNeeded,
    disk,
    estimate: { duration: targetDuration, mode: options.mode || 'copy', preset: options.preset || 'source' },
    error: errors.join(' '),
  };
}

export async function startLoopJob(options = {}, loopJobs) {
  const validation = await validateLoopOptions(options);
  if (!validation.ok) throw new Error(validation.error || 'Validasi loop gagal.');
  const id = safeId('loop');
  const startedAt = new Date().toISOString();
  const job = {
    id,
    status: 'running',
    progress: 0,
    etaSeconds: 0,
    elapsedSeconds: 0,
    renderedSeconds: 0,
    startedAt,
    options,
    validation,
  };
  loopJobs.set(id, job);
  renderLoopVideo(options, {
    onProcess: child => {
      job.child = child;
    },
    onProgress: metrics => {
      job.progress = metrics.progress || job.progress || 0;
      job.renderedSeconds = metrics.renderedSeconds || job.renderedSeconds || 0;
      job.elapsedSeconds = Math.max(0, Math.round((Date.now() - Date.parse(startedAt)) / 1000));
      job.etaSeconds =
        job.progress > 0 && job.progress < 100
          ? Math.max(0, Math.round((job.elapsedSeconds / job.progress) * (100 - job.progress)))
          : 0;
      job.updatedAt = new Date().toISOString();
    },
  })
    .then(result => {
      Object.assign(job, result, {
        status: 'done',
        progress: 100,
        etaSeconds: 0,
        finishedAt: new Date().toISOString(),
      });
    })
    .catch(error => {
      if (job.status === 'cancelled') return;
      Object.assign(job, { status: 'failed', error: error.message, finishedAt: new Date().toISOString() });
    })
    .finally(() => {
      delete job.child;
    });
  return { ...job, child: undefined };
}

export function publicLoopJob(job) {
  if (!job) return null;
  const { child: _child, ...safe } = job;
  return safe;
}

export async function loopFrame(file, seconds) {
  const at = Math.max(0, Number(seconds || 0));
  const result = await runBuffer(FFMPEG, [
    '-v',
    'error',
    '-ss',
    String(at),
    '-i',
    file,
    '-frames:v',
    '1',
    '-vf',
    'scale=64:36:force_original_aspect_ratio=decrease,pad=64:36:(ow-iw)/2:(oh-ih)/2,format=gray',
    '-f',
    'rawvideo',
    'pipe:1',
  ]);
  if (!result.ok || !result.stdout?.length) throw new Error(result.stderr || 'frame loop gagal dibaca');
  return result.stdout;
}

export function frameDiffScore(a, b) {
  const len = Math.min(a.length, b.length);
  if (!len) return 0;
  let diff = 0;
  for (let i = 0; i < len; i++) diff += Math.abs(a[i] - b[i]);
  const avg = diff / len;
  return Math.max(0, Math.min(100, Math.round(100 - (avg / 255) * 100)));
}

export function loopQualityLabel(score) {
  if (score >= 88) return 'Halus';
  if (score >= 72) return 'Lumayan';
  return 'Patah';
}

export async function analyzeLoopPoint({ input = '', trimStart = 0, trimEnd = 0, window = 1.5, samples = 8 } = {}) {
  const source = path.resolve(String(input || ''));
  if (!source || !existsSync(source) || !isVideo(source)) throw new Error('File video loop tidak valid.');
  const info = await ffprobeInfo(source);
  const duration = Number(info.duration || 0);
  if (duration <= 0) throw new Error('Durasi video tidak terbaca.');
  const searchWindow = Math.max(0.2, Math.min(Number(window || 1.5), duration / 3));
  const count = Math.max(3, Math.min(20, Number(samples || 8)));
  const candidates = [];
  for (let i = 0; i < count; i++) {
    const ratio = count === 1 ? 0 : i / (count - 1);
    const start = Math.max(0, Number(trimStart || 0) + ratio * searchWindow);
    const end =
      trimEnd > start
        ? Number(trimEnd) - searchWindow + ratio * searchWindow
        : duration - searchWindow + ratio * searchWindow;
    try {
      const a = await loopFrame(source, start);
      const b = await loopFrame(source, Math.max(start + 0.1, Math.min(duration - 0.05, end)));
      const score = frameDiffScore(a, b);
      candidates.push({
        trimStart: Number(start.toFixed(2)),
        trimEnd: Number(Math.max(start + 0.2, Math.min(duration, end)).toFixed(2)),
        score,
        label: loopQualityLabel(score),
      });
    } catch {
      /* frame read failed, skip candidate */
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0] || {
    trimStart: Number(trimStart || 0),
    trimEnd: Number(trimEnd || duration),
    score: 0,
    label: 'Patah',
  };
  return {
    ok: true,
    duration,
    best,
    candidates: candidates.slice(0, 8),
    warnings: best.score < 72 ? ['Sambungan masih terlihat patah; coba crossfade atau ping-pong.'] : [],
  };
}
