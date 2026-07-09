import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { lrcRowsToSrt, formatSrtTime } from './media-utils.mjs';

export function cleanLyricLines(text, config = {}) {
  const maxChars = Number(config.lyrics?.maxChars || 42);
  const uppercase = Boolean(config.lyrics?.uppercase);
  const raw = String(text || '').split(/\r?\n/).map(x => x.replace(/^\s*\[[^\]]+\]\s*/, '').trim()).filter(Boolean);
  const out = [];
  for (const line of raw) {
    const clean = uppercase ? line.toUpperCase() : line;
    if (clean.length <= maxChars) out.push(clean);
    else {
      const words = clean.split(/\s+/); let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > maxChars && cur) { out.push(cur); cur = w; }
        else cur = (cur + ' ' + w).trim();
      }
      if (cur) out.push(cur);
    }
  }
  return out;
}

export function rowsToLrc(rows) {
  return rows.map(r => `[${String(Math.floor(Number(r.time||0)/60)).padStart(2,'0')}:${String(Math.floor(Number(r.time||0)%60)).padStart(2,'0')}.${String(Math.round((Number(r.time||0)%1)*100)).padStart(2,'0')}] ${r.text}`).join('\n') + '\n';
}

export function rowsToVtt(rows) {
  const fmt = (sec) => formatSrtTime(sec).replace(',', '.');
  return 'WEBVTT\n\n' + rows.map((r,i)=>`${i+1}\n${fmt(Number(r.time||0))} --> ${fmt(rows[i+1]?.time ? Math.max(Number(r.time||0)+0.6, Number(rows[i+1].time)-0.08) : Number(r.time||0)+3)}\n${r.text || ' '}\n`).join('\n');
}

export function lyricWeights(lines) {
  return lines.map(line => {
    const chars = String(line || '').replace(/\s+/g, '').length;
    const words = String(line || '').split(/\s+/).filter(Boolean).length;
    return Math.max(0.7, chars / 14 + words * 0.18);
  });
}

export function snapToNearestBeat(time, beats = [], window = 0.22) {
  if (!beats?.length) return time;
  let best = null; let dist = Infinity;
  for (const b of beats) {
    const t = Number(b.time ?? b);
    const d = Math.abs(t - time);
    if (d < dist) { dist = d; best = t; }
  }
  return dist <= window ? best : time;
}

export function scoreLyricTimeline(rows, audioDuration, config = {}, beats = []) {
  const warnings = [];
  let score = 100;
  const maxChars = Number(config.lyrics?.maxChars || 42);
  const minDur = Number(config.lyrics?.minLineDuration || 1.1);
  const maxDur = Number(config.lyrics?.maxLineDuration || 5.0);
  const cpsTarget = Number(config.lyrics?.readingSpeedCps || 14);
  if (!rows.length) return { score: 0, warnings: ['belum ada baris lirik'], metrics: {} };
  rows.forEach((r, i) => {
    const next = rows[i+1]?.time ?? audioDuration;
    const dur = Math.max(0.1, Number(next) - Number(r.time));
    const chars = String(r.text || '').length;
    const cps = chars / dur;
    if (chars > maxChars) { score -= 4; warnings.push(`baris ${i+1}: terlalu panjang`); }
    if (dur < minDur) { score -= 5; warnings.push(`baris ${i+1}: durasi terlalu cepat`); }
    if (dur > maxDur && rows.length > 1) { score -= 2; warnings.push(`baris ${i+1}: durasi terlalu lama`); }
    if (cps > cpsTarget * 1.35) { score -= 4; warnings.push(`baris ${i+1}: reading speed terlalu cepat`); }
    if (i > 0 && Number(r.time) <= Number(rows[i-1].time)) { score -= 12; warnings.push(`baris ${i+1}: timestamp tidak naik`); }
  });
  const last = rows.at(-1)?.time || 0;
  if (audioDuration && last > audioDuration + 2) { score -= 10; warnings.push('timestamp melebihi durasi audio'); }
  if (config.lyrics?.beatSnap && beats?.length) {
    const snapped = rows.filter(r => beats.some(b => Math.abs(Number(b.time ?? b) - Number(r.time)) <= Number(config.lyrics?.beatSnapWindow || 0.22))).length;
    if (snapped / rows.length < 0.35) { score -= 3; warnings.push('sedikit lirik yang snap ke beat'); }
  }
  return { score: Math.max(0, Math.min(100, Math.round(score))), warnings: [...new Set(warnings)].slice(0, 30), metrics: { lines: rows.length, audioDuration, beats: beats?.length || 0 } };
}

export function autoAlignLyrics(text, audioDuration, config = {}, beats = []) {
  const lines = cleanLyricLines(text, config);
  const duration = Math.max(1, Number(audioDuration || config.target?.duration || 180));
  const offset = Number(config.lyrics?.offset || 0);
  const leadIn = Number(config.lyrics?.leadIn ?? 0.15);
  const fixed = Number(config.lyrics?.lineDuration || 0);
  const minDur = Number(config.lyrics?.minLineDuration || 1.1);
  const maxDur = Number(config.lyrics?.maxLineDuration || 5.0);
  const useSmart = config.lyrics?.smartTiming !== false;
  let cursor = Math.max(0, offset);
  const rows = [];
  if (!useSmart || fixed > 0) {
    const span = fixed > 0 ? fixed : Math.max(1.2, (duration - cursor - 1) / Math.max(1, lines.length));
    for (let i = 0; i < lines.length; i++) rows.push({ time: Math.max(0, cursor + i * span - leadIn), text: lines[i] });
  } else {
    const weights = lyricWeights(lines);
    const totalWeight = weights.reduce((a,b)=>a+b,0) || 1;
    const usable = Math.max(lines.length * minDur, duration - cursor - 0.5);
    for (let i = 0; i < lines.length; i++) {
      let start = cursor;
      if (config.lyrics?.beatSnap !== false) start = snapToNearestBeat(start, beats, Number(config.lyrics?.beatSnapWindow || 0.22));
      rows.push({ time: Math.max(0, start - leadIn), text: lines[i] });
      const weightedDur = Math.max(minDur, Math.min(maxDur, usable * (weights[i] / totalWeight)));
      cursor += weightedDur;
    }
  }
  return rows.map((r, i) => ({ ...r, index: i + 1 }));
}

export async function readLyricSource({ text, file }) {
  if (text) return String(text);
  if (file && existsSync(file)) return await readFile(file, 'utf8');
  return '';
}

export async function saveLyricsExport(rows, format, outFile) {
  const fmt = format || 'srt'; let content = '';
  if (fmt === 'lrc') content = rowsToLrc(rows);
  else if (fmt === 'vtt') content = rowsToVtt(rows);
  else content = lrcRowsToSrt(rows);
  if (outFile) { await mkdir(path.dirname(outFile), { recursive: true }); await writeFile(outFile, content); }
  return { format: fmt, content, outputFile: outFile || '' };
}

export function parseNowPlaying(config = {}, audioFile = '') {
  const sp = config.spectrum || {}; const input = config.input || {};
  let title = input.title || '';
  if (!title && sp.nowPlayingAutoFromFile && audioFile) title = path.basename(audioFile).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const artist = sp.nowPlayingArtist || '';
  const album = sp.nowPlayingAlbum || '';
  const template = sp.nowPlayingTemplate || '{title}';
  const text = template.replaceAll('{title}', title || 'Now Playing').replaceAll('{artist}', artist).replaceAll('{album}', album).replaceAll('{filename}', audioFile ? path.basename(audioFile) : '');
  return { title, artist, album, text };
}
