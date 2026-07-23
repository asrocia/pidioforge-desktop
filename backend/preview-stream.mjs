import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FFMPEG } from './bin-resolver.mjs';
import { runCmd, ffprobeInfo } from './ffmpeg-utils.mjs';
import { safeId } from './media-utils.mjs';
import { previewConfig } from './preview-engine.mjs';
import { buildGallerySlideshowFile } from './render-engine.mjs';

/**
 * Generate a live preview stream with lower quality for real-time playback
 * @param {Object} config - Render configuration
 * @param {Object} options - Stream options
 * @returns {Promise<Object>} Stream info
 */
export async function generateLivePreview(config, options = {}) {
  const {
    startAt = 0,
    duration = 10,
    quality = 'draft',
    fps = 15,
    width = 640,
    height = 360,
    workspaceDir,
    onProgress,
    onLog,
  } = options;

  const previewDir = path.join(workspaceDir, 'previews', 'live');
  await mkdir(previewDir, { recursive: true });

  const id = safeId('live');
  const output = path.join(previewDir, `${id}.mp4`);
  const patchedConfig = previewConfig(config, { preview: { width, height, fps, duration } });
  const galleryVisual = await buildGallerySlideshowFile(patchedConfig, workspaceDir, { id: `${id}-gallery`, duration });

  const visual = galleryVisual || config.input?.visual;
  const audio = config.input?.audio;

  if (!visual && !audio) throw new Error('No visual or audio input provided');

  const visualInfo = visual ? await ffprobeInfo(visual) : null;
  const audioInfo = audio ? await ffprobeInfo(audio) : null;
  onLog?.(`[LivePreview] input visual=${visual || '-'} audio=${audio || '-'} gallery=${galleryVisual ? 'on' : 'off'}`);
  void visualInfo;
  void audioInfo;

  const args = ['-y'];
  if (visual) {
    args.push('-ss', String(startAt));
    args.push('-i', visual);
  }
  if (audio) {
    args.push('-ss', String(startAt));
    args.push('-i', audio);
  }
  args.push('-t', String(duration));
  args.push('-c:v', 'libx264');
  args.push('-preset', 'ultrafast');
  args.push('-crf', quality === 'draft' ? '28' : '23');
  args.push('-r', String(fps));
  args.push('-s', `${width}x${height}`);
  if (audio) {
    args.push('-c:a', 'aac');
    args.push('-b:a', '128k');
    args.push('-ar', '44100');
  } else {
    args.push('-an');
  }
  args.push('-movflags', '+faststart');
  args.push('-pix_fmt', 'yuv420p');
  args.push(output);

  onLog?.(`[LivePreview] Starting: ${width}x${height} @ ${fps}fps, ${duration}s from ${startAt}s`);
  onLog?.(`[LivePreview] Command: ffmpeg ${args.join(' ')}`);

  const startTime = Date.now();
  let lastProgress = 0;
  const result = await runCmd(FFMPEG, args, {
    onStderr: line => {
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const mins = parseInt(timeMatch[2]);
        const secs = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + mins * 60 + secs;
        const progress = Math.min(100, Math.round((currentTime / duration) * 100));
        if (progress > lastProgress) {
          lastProgress = progress;
          onProgress?.({ progress, currentTime, duration, elapsed: Date.now() - startTime });
        }
      }
      onLog?.(line);
    },
  });

  if (!result.ok) throw new Error(`Live preview generation failed: ${result.stderr}`);

  const elapsed = Date.now() - startTime;
  const speed = duration / (elapsed / 1000);
  return {
    id,
    output,
    url: `/api/preview/file?path=${encodeURIComponent(output)}`,
    duration,
    startAt,
    resolution: `${width}x${height}`,
    fps,
    quality,
    elapsed,
    speed: `${speed.toFixed(2)}x`,
    size: existsSync(output) ? (await import('node:fs/promises')).stat(output).then(s => s.size) : 0,
  };
}

/**
 * Generate preview with filter complex (full rendering pipeline)
 * @param {Object} config - Full render configuration
 * @param {Object} options - Preview options
 * @returns {Promise<Object>} Preview info
 */
export async function generateFullPreview(config, options = {}) {
  const { startAt = 0, duration = 10, workspaceDir, onProgress, onLog } = options;

  const previewDir = path.join(workspaceDir, 'previews', 'full');
  await mkdir(previewDir, { recursive: true });

  const id = safeId('preview');
  const output = path.join(previewDir, `${id}.mp4`);
  const galleryVisual = await buildGallerySlideshowFile(config, workspaceDir, { id: `${id}-gallery`, duration });
  const visual = galleryVisual || config.input?.visual;

  // Note: buildFilterComplex is not exported from render-engine.mjs
  // Using simplified preview without complex filters
  const filterComplex = [];

  onLog?.(`[FullPreview] Using simplified preview mode / gallery=${galleryVisual ? 'on' : 'off'}`);

  // Build FFmpeg command with full pipeline
  const args = ['-y'];

  // Inputs
  if (visual) {
    args.push('-ss', String(startAt));
    args.push('-i', visual);
  }

  if (config.input?.audio) {
    args.push('-ss', String(startAt));
    args.push('-i', config.input.audio);
  }

  // Add overlay inputs (logo, watermark, etc.)
  if (config.branding?.logo && config.branding?.logoEnabled) {
    args.push('-i', config.branding.logo);
  }

  // Duration
  args.push('-t', String(duration));

  // Filter complex
  if (filterComplex.length > 0) {
    args.push('-filter_complex', filterComplex.join(';'));
  }

  // Video encoding
  args.push('-c:v', config.target?.videoCodec || 'libx264');
  args.push('-preset', config.target?.encodingPreset || 'medium');
  args.push('-crf', String(config.target?.crf || 23));
  args.push('-r', String(config.target?.fps || 30));

  // Audio encoding
  args.push('-c:a', 'aac');
  args.push('-b:a', config.target?.audioBitrate || '192k');

  // Fast start
  args.push('-movflags', '+faststart');

  // Output
  args.push(output);

  onLog?.(`[FullPreview] Starting full render preview`);

  const startTime = Date.now();
  let lastProgress = 0;

  const result = await runCmd(FFMPEG, args, {
    onStderr: line => {
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const mins = parseInt(timeMatch[2]);
        const secs = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + mins * 60 + secs;
        const progress = Math.min(100, Math.round((currentTime / duration) * 100));

        if (progress > lastProgress) {
          lastProgress = progress;
          onProgress?.({
            progress,
            currentTime,
            duration,
            elapsed: Date.now() - startTime,
          });
        }
      }
      onLog?.(line);
    },
  });

  if (!result.ok) {
    throw new Error(`Full preview generation failed: ${result.stderr}`);
  }

  const elapsed = Date.now() - startTime;
  const speed = duration / (elapsed / 1000);

  return {
    id,
    output,
    url: `/api/preview/file?path=${encodeURIComponent(output)}`,
    duration,
    startAt,
    resolution: config.target?.resolution || '1280x720',
    fps: config.target?.fps || 30,
    quality: 'full',
    elapsed,
    speed: `${speed.toFixed(2)}x`,
    size: existsSync(output) ? (await import('node:fs/promises')).stat(output).then(s => s.size) : 0,
  };
}

/**
 * Clean up old preview files
 * @param {string} workspaceDir - Workspace directory
 * @param {number} maxAge - Max age in milliseconds (default: 1 hour)
 */
export async function cleanupPreviews(workspaceDir, maxAge = 3600000) {
  const previewDir = path.join(workspaceDir, 'previews');
  if (!existsSync(previewDir)) return;

  const { readdir, stat, unlink } = await import('node:fs/promises');
  const now = Date.now();
  let cleaned = 0;

  async function cleanDir(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await cleanDir(fullPath);
      } else if (entry.isFile()) {
        const stats = await stat(fullPath);
        if (now - stats.mtimeMs > maxAge) {
          await unlink(fullPath);
          cleaned++;
        }
      }
    }
  }

  await cleanDir(previewDir);
  return { cleaned };
}
