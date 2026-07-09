import { readdir, stat } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { isAudio, isImage, isVideo, ext } from './media-utils.mjs';
import { mimeFor, ffprobeInfo } from './ffmpeg-utils.mjs';

export const pathExtMap = {
  video: ['.mp4', '.mov', '.mkv', '.webm', '.avi'],
  audio: ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg'],
  image: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
  lyrics: ['.lrc', '.srt', '.txt'],
};

export function detectPathType(file = '') {
  const e = path.extname(String(file)).toLowerCase();
  if (pathExtMap.video.includes(e)) return 'video';
  if (pathExtMap.audio.includes(e)) return 'audio';
  if (pathExtMap.image.includes(e)) return 'image';
  if (pathExtMap.lyrics.includes(e)) return 'lyrics';
  return e ? 'file' : 'unknown';
}

export function isPreviewableMedia(file = '') {
  const type = detectPathType(file);
  return ['video', 'audio', 'image'].includes(type);
}

export function filterAcceptsType(filter = 'media', type = 'unknown') {
  if (filter === 'media') return ['video', 'audio', 'image', 'lyrics', 'file'].includes(type);
  if (filter === 'visual') return ['video', 'image'].includes(type);
  return filter === type || type === 'unknown';
}

export function isInside(child, parent) {
  if (!child || !parent) return false;
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!!rel && !rel.startsWith('..') && !path.isAbsolute(rel));
}

export function normalizeName(name, ignoreWords = '') {
  const ignored = String(ignoreWords).split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  let base = path.basename(name || '').replace(/\.[^.]+$/, '').toLowerCase();
  for (const word of ignored) base = base.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), ' ');
  return base.replace(/[^a-z0-9]+/gi, ' ').replace(/\s+/g, ' ').trim();
}

export function similarity(a, b) {
  const A = new Set(String(a).split(' ').filter(Boolean)); const B = new Set(String(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  const inter = [...A].filter(x => B.has(x)).length;
  return inter / Math.max(A.size, B.size);
}

export async function pathInfo(targetPath = '', kind = 'file', filter = 'media') {
  const raw = String(targetPath || '').trim();
  if (!raw) return { ok: false, exists: false, empty: true, warning: '' };
  const resolved = path.resolve(raw);
  const type = detectPathType(resolved);
  const expectedOk = kind === 'directory' || filterAcceptsType(filter, type);
  const info = { ok: false, exists: false, path: resolved, name: path.basename(resolved), dir: path.dirname(resolved), type, expectedOk, warning: '' };
  try {
    const st = await stat(resolved);
    info.exists = true;
    info.isDirectory = st.isDirectory();
    info.isFile = st.isFile();
    info.size = st.size;
    info.modifiedAt = st.mtime?.toISOString?.();
    info.ok = kind === 'directory' ? info.isDirectory : kind === 'save' ? !info.isDirectory && expectedOk : info.isFile && expectedOk;
  } catch {
    if (kind === 'save') {
      const parent = await stat(path.dirname(resolved)).catch(() => null);
      info.parentExists = Boolean(parent?.isDirectory?.());
      info.ok = Boolean(info.parentExists && expectedOk);
      info.warning = info.ok ? 'File output baru akan dibuat saat render/export.' : 'Folder tujuan tidak ditemukan.';
      return info;
    }
    info.warning = kind === 'directory' ? 'Folder tidak ditemukan.' : 'File tidak ditemukan.';
    return info;
  }
  if (kind === 'directory' && !info.isDirectory) info.warning = 'Yang dipilih bukan folder.';
  else if (kind !== 'directory' && !info.isFile) info.warning = 'Yang dipilih bukan file.';
  else if (!expectedOk) info.warning = `Tipe file ${type} tidak cocok untuk input ${filter}.`;
  else info.warning = 'File siap dipakai.';
  return info;
}

export async function streamMediaFile(req, res, file, corsHeaders) {
  const full = path.resolve(file || '');
  if (!isPreviewableMedia(full) || !existsSync(full)) {
    res.writeHead(404, { 'content-type': 'text/plain', ...corsHeaders() });
    return res.end('media not found');
  }
  const info = await stat(full);
  const range = req.headers.range;
  const headers = { 'content-type': mimeFor(full), 'accept-ranges': 'bytes', 'cache-control': 'no-store', ...corsHeaders() };
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : info.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= info.size) {
      res.writeHead(416, { ...headers, 'content-range': `bytes */${info.size}` });
      return res.end();
    }
    res.writeHead(206, { ...headers, 'content-length': end - start + 1, 'content-range': `bytes ${start}-${end}/${info.size}` });
    return createReadStream(full, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'content-length': info.size });
  return createReadStream(full).pipe(res);
}

export function pickByOrder(list, i) { return list.length ? list[i % list.length]?.path : ''; }

export function mediaHealthScore(file) {
  const warnings = [...(file.warnings || [])];
  let score = 100;
  const info = file.probe || {};
  if (file.size === 0) { score -= 70; warnings.push('file 0 byte'); }
  if ((file.type === 'audio' || file.type === 'video') && !info.ok) { score -= 45; warnings.push('ffprobe tidak valid'); }
  if (file.type === 'audio' && info.ok && !info.hasAudio) { score -= 60; warnings.push('audio stream hilang'); }
  if (file.type === 'video' && info.ok && !info.hasVideo) { score -= 60; warnings.push('video stream hilang'); }
  if (info.duration !== undefined && Number(info.duration) <= 0 && (file.type === 'audio' || file.type === 'video')) { score -= 25; warnings.push('durasi tidak terbaca'); }
  if (file.type === 'audio' && info.duration && info.duration < 2) { score -= 20; warnings.push('audio terlalu pendek'); }
  const vStream = (info.streams || []).find(x => x.type === 'video');
  if ((file.type === 'video' || file.type === 'image') && vStream?.width && vStream?.height) {
    if (vStream.width < 640 || vStream.height < 360) { score -= 15; warnings.push('resolusi visual rendah'); }
  }
  if (info.bitrate && info.bitrate < 64000 && (file.type === 'audio' || file.type === 'video')) { score -= 10; warnings.push('bitrate rendah'); }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const level = score >= 85 ? 'Good' : score >= 65 ? 'Warning' : score >= 35 ? 'Risk' : 'Broken';
  return { score, level, warnings: [...new Set(warnings)] };
}

export async function scanDir(dir, options = {}) {
  const recursive = Boolean(options.recursive); const maxDepth = Number(options.maxDepth ?? (recursive ? 3 : 1));
  const excludeDirs = (options.excludeDirs || []).filter(Boolean).map(x => path.resolve(x));
  const rows = [];
  async function walk(current, depth) {
    if (!current || !existsSync(current) || depth > maxDepth) return;
    const resolved = path.resolve(current);
    if (excludeDirs.some(ex => isInside(resolved, ex))) return;
    for (const item of await readdir(current)) {
      const file = path.join(current, item); const st = await stat(file);
      if (st.isDirectory() && recursive) await walk(file, depth + 1);
      if (st.isFile()) {
        const type = isAudio(file) ? 'audio' : isImage(file) ? 'image' : isVideo(file) ? 'video' : (item.toLowerCase().endsWith('.lrc') || item.toLowerCase().endsWith('.srt') ? 'lyrics' : 'file');
        const warnings = []; if (st.size === 0) warnings.push('0 byte');
        rows.push({ path: file, name: item, size: st.size, modifiedAt: st.mtime?.toISOString?.(), ext: ext(file), type, warnings });
      }
    }
  }
  await walk(dir, 1);
  return rows;
}

export async function enrichValidation(files, sampleLimit = 40) {
  const out = []; let count = 0;
  for (const f of files) {
    const nf = { ...f, warnings: [...(f.warnings || [])] };
    if ((f.type === 'audio' || f.type === 'video') && f.size > 0 && count++ < sampleLimit) {
      const info = await ffprobeInfo(f.path); nf.probe = info; nf.duration = info.duration || 0;
      if (!info.ok) nf.warnings.push('ffprobe gagal');
      if (f.type === 'audio' && info.ok && !info.hasAudio) nf.warnings.push('audio stream tidak ada');
      if (f.type === 'video' && info.ok && !info.hasVideo) nf.warnings.push('video stream tidak ada');
    }
    nf.health = mediaHealthScore(nf);
    nf.warnings = nf.health.warnings;
    out.push(nf);
  }
  return out;
}
