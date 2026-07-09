import os from 'node:os';
import { deepMerge, defaultConfig } from './config.mjs';
import { ffmpegDiagnostics, ffprobeInfo, diskStats } from './ffmpeg-utils.mjs';
import { activeConfig } from './state.mjs';
import { queueSummary } from './queue-engine.mjs';

export function previewConfig(baseConfig, patch = {}) {
  const cfg = deepMerge(baseConfig, patch || {});
  const pv = cfg.preview || defaultConfig.preview;
  const q = pv.quality || cfg.performance?.previewQuality || 'draft';
  const width = Math.max(240, Math.min(1280, Number(pv.width || (q === 'high' ? 960 : q === 'normal' ? 720 : 480))));
  const height = Math.max(135, Math.min(720, Number(pv.height || Math.round(width * 9 / 16))));
  cfg.target = deepMerge(cfg.target, {
    duration: Math.max(1, Math.min(12, Number(pv.duration || 4))),
    width, height, resolution: `${width}x${height}`,
    fps: Math.max(12, Math.min(30, Number(pv.fps || (q === 'high' ? 24 : 18)))),
    bitrate: q === 'high' ? '1800k' : q === 'normal' ? '1100k' : '650k',
    quality: 'fast', crf: q === 'high' ? 24 : 30, hardwareAccel: 'cpu', faststart: true,
  });
  cfg.performance = deepMerge(cfg.performance || {}, { ffmpegThreads: Math.max(1, Math.min(4, Number(cfg.performance?.ffmpegThreads || 2))), x264Preset: 'veryfast' });
  cfg.audio = deepMerge(cfg.audio || {}, { normalize: false, limiter: true });
  return cfg;
}

export async function previewDiagnostics(config) {
  const warnings = [];
  const visual = config.input?.visual; const audio = config.input?.audio;
  const v = await ffprobeInfo(visual); const a = await ffprobeInfo(audio);
  if (!visual) warnings.push('visual belum dipilih'); else if (!v.ok) warnings.push(`visual tidak valid: ${v.error || visual}`);
  if (!audio) warnings.push('audio belum dipilih'); else if (!a.ok) warnings.push(`audio tidak valid: ${a.error || audio}`);
  if (config.spectrum?.enabled && !a.hasAudio) warnings.push('spectrum butuh audio valid');
  if (config.overlay?.overlayEnabled && !config.overlay?.overlayFile) warnings.push('overlay asset aktif tapi file kosong');
  if (config.branding?.logoEnabled && !config.branding?.logo) warnings.push('logo aktif tapi file kosong');
  if (config.branding?.logoEnabled && Number(config.branding?.logoScale || 0) > 45) warnings.push('logo terlalu besar untuk preview, cek safe area');
  if (config.lyrics?.enabled && config.lyrics?.position === 'Bawah' && config.spectrum?.enabled && config.spectrum?.position === 'Bawah') warnings.push('lirik dan spectrum sama-sama di bawah, berpotensi overlap');
  if (config.overlay?.darken && Number(config.overlay?.darkenOpacity || 0) > 35) warnings.push('overlay terlalu gelap untuk preview');
  if (config.spectrum?.enabled && Number(config.spectrum?.height || 0) > Number(config.target?.height || 720) * 0.28) warnings.push('spectrum terlalu tinggi, dapat menutup konten utama');
  if (Number(config.preview?.startAt || 0) > 0 && v.duration && Number(config.preview?.startAt || 0) >= v.duration) warnings.push('start preview melebihi durasi visual');
  const safeArea = safeAreaGuide(config.preview?.safeAreaPreset || config.branding?.safeAreaPreset || 'youtube', config.target?.width || 640, config.target?.height || 360);
  return { ok: warnings.filter(w => /tidak valid|belum dipilih/.test(w)).length === 0, warnings, safeArea, assets: { visual: v, audio: a } };
}

export function safeAreaGuide(preset = 'youtube', width = 640, height = 360) {
  const vertical = height > width;
  if (preset === 'shorts' || vertical) return { preset, top: 0.08, right: 0.08, bottom: 0.16, left: 0.08 };
  if (preset === 'square') return { preset, top: 0.08, right: 0.08, bottom: 0.10, left: 0.08 };
  return { preset, top: 0.07, right: 0.06, bottom: 0.10, left: 0.06 };
}

export async function performanceStatus(state) {
  const cpus = os.cpus?.() || [];
  const load = os.loadavg?.()[0] || 0;
  const cpuPercent = cpus.length ? Math.min(100, Math.round((load / cpus.length) * 100)) : 0;
  const totalMem = os.totalmem?.() || 1; const freeMem = os.freemem?.() || 0;
  const memoryPercent = Math.round((1 - freeMem / totalMem) * 100);
  const disk = await diskStats(activeConfig(state).input?.output || process.cwd());
  const q = queueSummary(state);
  const cfg = activeConfig(state); const diag = await ffmpegDiagnostics();
  const warnings = [];
  if (cpuPercent >= Number(cfg.performance?.maxCpu || 85)) warnings.push('CPU tinggi, turunkan concurrency atau gunakan preset hemat.');
  if (memoryPercent >= Number(cfg.performance?.maxMemory || 85)) warnings.push('Memory tinggi, hindari batch paralel terlalu banyak.');
  if (disk.usedPercent > 90) warnings.push('Disk hampir penuh, bersihkan output lama.');
  if (q.rendering > Number(cfg.performance?.queueConcurrency || q.queue?.concurrency || 1)) warnings.push('Render aktif melebihi target concurrency.');
  return { ok: true, metrics: { cpu: cpuPercent, memory: memoryPercent, disk: disk.usedPercent, wifi: 0, loadAverage: Number(load.toFixed(2)), freeMemoryGB: Number((freeMem/1024/1024/1024).toFixed(1)), totalMemoryGB: Number((totalMem/1024/1024/1024).toFixed(1)), diskFreeGB: disk.freeGB, diskTotalGB: disk.totalGB, activeRenders: q.rendering, queueStandby: q.standby, queueDone: q.done, queueFailed: q.failed }, performance: cfg.performance || defaultConfig.performance, encoder: diag.recommended, encoders: diag.encoders, queue: q.queue, warnings };
}

export function performancePatch(mode) {
  if (mode === 'turbo') return { performance: { mode, queueConcurrency: 2, ffmpegThreads: 0, x264Preset: 'veryfast', previewQuality: 'low', refreshMs: 1000 }, target: { quality: 'fast', crf: 26, hardwareAccel: 'auto' } };
  if (mode === 'quality') return { performance: { mode, queueConcurrency: 1, ffmpegThreads: 0, x264Preset: 'slow', previewQuality: 'high', refreshMs: 2000 }, target: { quality: 'high', crf: 18, hardwareAccel: 'auto' } };
  if (mode === 'eco') return { performance: { mode, queueConcurrency: 1, ffmpegThreads: Math.max(1, Math.floor((os.cpus?.().length || 2)/2)), x264Preset: 'veryfast', previewQuality: 'low', refreshMs: 2500, thermalGuard: true }, target: { quality: 'fast', crf: 28, fps: 24, hardwareAccel: 'cpu' } };
  return { performance: { mode: 'balanced', queueConcurrency: 1, ffmpegThreads: 0, x264Preset: 'medium', previewQuality: 'normal', refreshMs: 1500 }, target: { quality: 'balanced', crf: 22, hardwareAccel: 'auto' } };
}
