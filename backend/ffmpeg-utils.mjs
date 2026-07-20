import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FFMPEG, FFPROBE, binaryDiagnostics } from './bin-resolver.mjs';

export function runCmd(command, args = []) {
  return new Promise(resolve => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', b => stdout += b.toString());
    child.stderr.on('data', b => stderr += b.toString());
    child.on('error', error => resolve({ ok: false, code: -1, stdout, stderr: error.message }));
    child.on('close', code => resolve({ ok: code === 0, code, stdout, stderr }));
  });
}

export function runBuffer(command, args = []) {
  return new Promise(resolve => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [], stderr = [];
    child.stdout.on('data', b => stdout.push(b));
    child.stderr.on('data', b => stderr.push(b));
    child.on('error', error => resolve({ ok: false, code: -1, stdout: Buffer.concat(stdout), stderr: error.message }));
    child.on('close', code => resolve({ ok: code === 0, code, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr).toString() }));
  });
}

export function runLoopFfmpeg(args = [], duration = 0, callbacks = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    callbacks.onProcess?.(child);
    let stderr = '';
    child.stdout.on('data', buf => {
      for (const line of buf.toString().split(/\r?\n/)) {
        if (!line.startsWith('out_time_ms=')) continue;
        const seconds = Number(line.split('=')[1] || 0) / 1_000_000;
        const progress = duration > 0 ? Math.max(1, Math.min(99, Math.round((seconds / duration) * 100))) : 0;
        callbacks.onProgress?.({ progress, renderedSeconds: Number(seconds.toFixed(1)) });
      }
    });
    child.stderr.on('data', b => stderr += b.toString());
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ ok: true }) : reject(new Error(stderr || `FFmpeg loop gagal kode ${code}`)));
  });
}

export async function ffmpegDiagnostics() {
  const version = await runCmd(FFMPEG, ['-version']);
  const enc = await runCmd(FFMPEG, ['-hide_banner', '-encoders']);
  const text = `${enc.stdout}\n${enc.stderr}`;
  const encoders = { libx264: /libx264/.test(text), h264_nvenc: /h264_nvenc/.test(text), h264_qsv: /h264_qsv/.test(text), h264_amf: /h264_amf/.test(text) };
  return { ffmpeg: version.ok, ffprobe: (await runCmd(FFPROBE, ['-version'])).ok, ...binaryDiagnostics(), version: (version.stdout.split('\n')[0] || version.stderr.split('\n')[0] || ''), encoders, recommended: encoders.h264_nvenc ? 'nvidia' : encoders.h264_qsv ? 'intel' : encoders.h264_amf ? 'amd' : 'cpu' };
}

export async function diskStats(dir = process.cwd()) {
  try {
    const root = path.parse(path.resolve(dir)).root || '/';
    const r = await runCmd(process.platform === 'win32' ? 'wmic' : 'df', process.platform === 'win32' ? ['logicaldisk','get','size,freespace,caption'] : ['-k', root]);
    if (!r.ok) return { ok: false, usedPercent: 0, freeGB: 0, totalGB: 0 };
    if (process.platform === 'win32') {
      const lines = r.stdout.trim().split(/\r?\n/).slice(1).map(x=>x.trim()).filter(Boolean);
      const first = lines[0]?.split(/\s+/) || [];
      const free = Number(first[1] || 0), total = Number(first[2] || 0);
      return { ok: true, usedPercent: total ? Math.round((1 - free/total) * 100) : 0, freeGB: Math.round(free/1024/1024/1024), totalGB: Math.round(total/1024/1024/1024) };
    }
    const parts = r.stdout.trim().split(/\r?\n/).pop().trim().split(/\s+/);
    const total = Number(parts[1] || 0) * 1024, used = Number(parts[2] || 0) * 1024, free = Number(parts[3] || 0) * 1024;
    return { ok: true, usedPercent: total ? Math.round((used/total)*100) : 0, freeGB: Math.round(free/1024/1024/1024), totalGB: Math.round(total/1024/1024/1024) };
  } catch { return { ok: false, usedPercent: 0, freeGB: 0, totalGB: 0 }; }
}

export function mimeFor(file) {
  const e = path.extname(file || '').toLowerCase();
  if (e === '.mp4') return 'video/mp4';
  if (e === '.webm') return 'video/webm';
  if (e === '.mp3') return 'audio/mpeg';
  if (e === '.wav') return 'audio/wav';
  if (e === '.m4a') return 'audio/mp4';
  if (e === '.aac') return 'audio/aac';
  if (e === '.flac') return 'audio/flac';
  if (e === '.ogg') return 'audio/ogg';
  if (e === '.jpg' || e === '.jpeg') return 'image/jpeg';
  if (e === '.png') return 'image/png';
  if (e === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

export async function ffprobeInfo(file) {
  if (!file || !existsSync(file)) return { ok: false, error: 'file tidak ditemukan' };
  const result = await runCmd(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
  if (!result.ok) return { ok: false, error: result.stderr || 'ffprobe gagal' };
  try {
    const data = JSON.parse(result.stdout || '{}');
    const streams = data.streams || [];
    return { ok: true, duration: Number(data.format?.duration || 0), bitrate: Number(data.format?.bit_rate || 0), hasVideo: streams.some(x => x.codec_type === 'video'), hasAudio: streams.some(x => x.codec_type === 'audio'), streams: streams.map(x => ({ type: x.codec_type, codec: x.codec_name, width: x.width, height: x.height, duration: x.duration })) };
  } catch (error) { return { ok: false, error: error.message }; }
}

export async function ffprobeMetadata(file) {
  if (!file || !existsSync(file)) return { ok: false, tags: {} };
  const result = await runCmd(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', file]);
  if (!result.ok) return { ok: false, tags: {} };
  try { const data = JSON.parse(result.stdout || '{}'); return { ok: true, tags: data.format?.tags || {}, duration: Number(data.format?.duration || 0), bitrate: Number(data.format?.bit_rate || 0) }; }
  catch { return { ok: false, tags: {} }; }
}
