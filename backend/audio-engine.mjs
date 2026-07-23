import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { FFMPEG } from './bin-resolver.mjs';
import { runCmd } from './ffmpeg-utils.mjs';

export async function analyzeLoudness(file) {
  if (!file || !existsSync(file)) return { ok: false, error: 'file tidak ditemukan' };
  const result = await runCmd(FFMPEG, [
    '-hide_banner',
    '-nostats',
    '-i',
    file,
    '-af',
    'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json',
    '-f',
    'null',
    '-',
  ]);
  const text = `${result.stderr}\n${result.stdout}`;
  const m = text.match(/\{[\s\S]*?"target_offset"[\s\S]*?\}/);
  if (!m) return { ok: false, error: 'loudness analysis gagal', raw: text.slice(-1000) };
  try {
    const j = JSON.parse(m[0]);
    const inputI = Number(j.input_i);
    const inputTp = Number(j.input_tp);
    const inputLra = Number(j.input_lra);
    const targetOffset = Number(j.target_offset);
    const warnings = [];
    if (inputTp > -1) warnings.push('true peak dekat/di atas batas aman');
    if (inputI > -10) warnings.push('audio terlalu keras untuk standar upload');
    if (inputI < -20) warnings.push('audio cenderung terlalu pelan');
    return {
      ok: true,
      integratedLufs: inputI,
      truePeak: inputTp,
      lra: inputLra,
      targetOffset,
      recommendation: `${targetOffset > 0 ? '+' : ''}${targetOffset.toFixed(1)} dB`,
      warnings,
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function waveformData(file, seconds = 45, buckets = 160) {
  if (!file || !existsSync(file)) return { ok: false, error: 'file tidak ditemukan', peaks: [] };
  const maxSeconds = Math.max(1, Math.min(300, Number(seconds) || 45));
  return await new Promise(resolve => {
    const child = spawn(
      FFMPEG,
      ['-v', 'error', '-i', file, '-t', String(maxSeconds), '-ac', '1', '-ar', '8000', '-f', 's16le', 'pipe:1'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const chunks = [];
    let stderr = '';
    child.stdout.on('data', b => chunks.push(b));
    child.stderr.on('data', b => (stderr += b.toString()));
    child.on('error', error => resolve({ ok: false, error: error.message, peaks: [] }));
    child.on('close', code => {
      if (code !== 0) return resolve({ ok: false, error: stderr || 'waveform gagal', peaks: [] });
      const buf = Buffer.concat(chunks);
      const samples = Math.floor(buf.length / 2);
      const count = Math.max(20, Math.min(500, Number(buckets) || 160));
      const per = Math.max(1, Math.floor(samples / count));
      const peaks = [];
      for (let i = 0; i < count; i++) {
        let peak = 0;
        const start = i * per;
        const end = Math.min(samples, start + per);
        for (let j = start; j < end; j++) peak = Math.max(peak, Math.abs(buf.readInt16LE(j * 2)) / 32768);
        peaks.push(Number(peak.toFixed(3)));
      }
      resolve({ ok: true, seconds: maxSeconds, sampleRate: 8000, peaks });
    });
  });
}

export function detectBeatsFromPeaks(peaks, seconds = 45) {
  const arr = (peaks || []).map(Number);
  if (!arr.length) return [];
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const threshold = Math.max(avg * 1.45, 0.18);
  const beats = [];
  arr.forEach((v, i) => {
    const prev = arr[i - 1] || 0;
    const next = arr[i + 1] || 0;
    if (v >= threshold && v >= prev && v >= next)
      beats.push({ time: Number(((i / arr.length) * seconds).toFixed(2)), strength: Number(v.toFixed(3)) });
  });
  return beats.slice(0, 300);
}

export function audioSafetyReport(config, assets, loudness) {
  const warnings = [];
  for (const a of assets) {
    if (!a.ok) warnings.push(`${path.basename(a.file || '')}: tidak terbaca`);
    else {
      if (!a.hasAudio) warnings.push(`${path.basename(a.file)}: tidak ada audio stream`);
      if ((a.bitrate || 0) > 0 && a.bitrate < 96000) warnings.push(`${path.basename(a.file)}: bitrate rendah`);
      const ch = a.streams?.find(s => s.type === 'audio');
      if (ch?.duration && Number(ch.duration) < 1) warnings.push(`${path.basename(a.file)}: durasi terlalu pendek`);
    }
  }
  if (loudness?.truePeak > -1) warnings.push('clipping risk / true peak terlalu tinggi');
  if (config.audio?.normalize === false && loudness?.integratedLufs < -20)
    warnings.push('normalize disarankan karena audio pelan');
  if (config.audio?.limiter === false) warnings.push('limiter off: risiko pecah saat gain tinggi');
  return { ok: warnings.length === 0, warnings };
}

export function tuneSpectrumFromWaveform(waveform, beats, _config = {}) {
  const peaks = waveform?.peaks || [];
  const avg = peaks.length ? peaks.reduce((a, b) => a + Number(b), 0) / peaks.length : 0;
  const max = peaks.length ? Math.max(...peaks.map(Number)) : 0;
  const dynamicRange = max - avg;
  const beatDensity = (beats?.length || 0) / Math.max(1, Number(waveform?.seconds || 45));
  const sensitivity = Math.max(25, Math.min(85, Math.round(45 + dynamicRange * 70 - beatDensity * 8)));
  const height = dynamicRange > 0.45 ? 120 : dynamicRange > 0.25 ? 150 : 180;
  const transparency = avg > 0.35 ? 72 : 84;
  const warnings = [];
  if (!peaks.length) warnings.push('waveform tidak tersedia');
  if (max < 0.08) warnings.push('audio terlalu pelan untuk spectrum reaktif');
  if (beats?.length === 0) warnings.push('beat tidak terdeteksi, gunakan fallback reactive');
  return {
    sensitivity,
    height,
    transparency,
    dynamicRange: Number(dynamicRange.toFixed(3)),
    avgPeak: Number(avg.toFixed(3)),
    maxPeak: Number(max.toFixed(3)),
    beatDensity: Number(beatDensity.toFixed(3)),
    warnings,
  };
}
