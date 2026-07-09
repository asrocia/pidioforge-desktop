import { existsSync } from 'node:fs';
import path from 'node:path';
import { isAudio, isImage, isVideo } from './media-utils.mjs';
import { normalizeName, similarity, pickByOrder } from './media-scanner.mjs';

export function outputName(title, config, index = 1) {
  const safeTitle = String(title || `render-${index}`).replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  const d = new Date(); const date = d.toISOString().slice(0,10).replace(/-/g,''); const time = d.toTimeString().slice(0,8).replace(/:/g,''); const num = String(index).padStart(3, '0');
  return String(config.target?.outputPattern || '{title}-{date}-{num}').replaceAll('{title}', safeTitle).replaceAll('{date}', date).replaceAll('{time}', time).replaceAll('{num}', num) + '.mp4';
}

export function ensureUniqueOutput(fullPath, overwrite) {
  if (overwrite || !existsSync(fullPath)) return fullPath;
  const dir = path.dirname(fullPath); const extn = path.extname(fullPath); const stem = path.basename(fullPath, extn);
  let i = 2; let candidate = path.join(dir, `${stem}-${i}${extn}`);
  while (existsSync(candidate)) candidate = path.join(dir, `${stem}-${++i}${extn}`);
  return candidate;
}

export function validateRenderConfig(config = {}, options = {}) {
  const errors = [];
  const warnings = [];
  const input = config.input || {};
  const target = config.target || {};
  const visual = options.visual || input.visual || '';
  const audio = options.audio || input.audio || '';
  const outputDir = options.outputDir || input.output || '';
  const width = Number(target.width || String(target.resolution || '').split('x')[0] || 0);
  const height = Number(target.height || String(target.resolution || '').split('x')[1] || 0);
  const fps = Number(target.fps || 0);
  const duration = Number(target.duration || 0);

  if (!visual) errors.push('File visual belum dipilih.');
  else if (!existsSync(visual)) errors.push(`File visual tidak ditemukan: ${visual}`);
  else if (!isVideo(visual) && !isImage(visual)) errors.push(`Format visual belum didukung: ${path.extname(visual) || visual}`);

  if (!audio) errors.push('File audio belum dipilih.');
  else if (!existsSync(audio)) errors.push(`File audio tidak ditemukan: ${audio}`);
  else if (!isAudio(audio)) errors.push(`Format audio belum didukung: ${path.extname(audio) || audio}`);

  if (!width || !height || width < 240 || height < 135) errors.push('Resolusi target tidak valid.');
  if (!fps || fps < 1 || fps > 120) errors.push('FPS target tidak valid.');
  if (duration < 0) errors.push('Durasi target tidak boleh negatif.');
  if (outputDir) {
    const dir = path.resolve(outputDir);
    const parent = path.dirname(dir);
    if (!existsSync(dir) && !existsSync(parent)) warnings.push(`Folder output belum ada dan parent tidak ditemukan: ${dir}`);
  }
  if (config.spectrum?.enabled !== false && !audio) warnings.push('Spectrum aktif tetapi audio belum siap.');
  if (config.branding?.logoEnabled && config.branding?.logo && !existsSync(config.branding.logo)) warnings.push('Logo aktif tetapi file logo tidak ditemukan.');
  if (config.overlay?.overlayEnabled && config.overlay?.overlayFile && !existsSync(config.overlay.overlayFile)) warnings.push('Overlay aktif tetapi file overlay tidak ditemukan.');
  if (config.overlay?.videoParticle && config.overlay?.particleFile && !existsSync(config.overlay.particleFile)) warnings.push('Particle aktif tetapi file particle tidak ditemukan.');
  const lyricPos = String(config.lyrics?.position || 'Bawah');
  const spectrumPos = String(config.spectrum?.position || 'Bawah');
  const lowerThirdPos = String(config.overlay?.lowerThirdPosition || 'Bawah');
  const timestampPos = String(config.overlay?.timestampPosition || 'Kiri Atas');
  if (config.lyrics?.enabled !== false && config.spectrum?.enabled !== false && lyricPos === 'Bawah' && spectrumPos === 'Bawah') warnings.push('Lirik dan spectrum sama-sama di bawah; pertimbangkan naikkan salah satunya.');
  if (config.overlay?.lowerThirdEnabled && config.lyrics?.enabled !== false && lowerThirdPos === 'Bawah' && lyricPos === 'Bawah') warnings.push('Lower third dan lirik sama-sama di bawah; ada risiko tabrakan.');
  if (config.overlay?.lowerThirdEnabled && config.spectrum?.enabled !== false && lowerThirdPos === 'Bawah' && spectrumPos === 'Bawah') warnings.push('Lower third dan spectrum sama-sama di bawah; hasil bisa terlalu padat.');
  if (config.overlay?.timestamp && config.spectrum?.nowPlaying && timestampPos.includes('Atas') && String(config.spectrum?.nowPlayingPosition || 'Atas') === 'Atas') warnings.push('Timestamp dan now playing sama-sama di area atas; cek jarak aman.');
  if (height > width && config.overlay?.lowerThirdEnabled && lowerThirdPos === 'Bawah' && Number(config.overlay?.lowerThirdDuration || 0) > 6) warnings.push('Lower third cukup lama untuk format vertical; pertimbangkan durasi lebih pendek.');
  return { ok: errors.length === 0, errors, warnings };
}

export function outputCollisionReport(pairs = [], config = {}) {
  const outputDir = config.input?.output || 'Hasil';
  const overwrite = Boolean(config.target?.overwrite);
  const seen = new Map();
  return pairs.map((p, i) => {
    const requested = path.join(outputDir, p.outputName || outputName(p.title, config, i + 1));
    const existing = existsSync(requested);
    const duplicateInBatch = seen.has(requested);
    seen.set(requested, true);
    const finalPath = overwrite ? requested : ensureUniqueOutput(requested, false);
    const status = overwrite && existing ? 'will-overwrite' : duplicateInBatch ? 'duplicate-in-batch' : existing ? 'auto-rename' : 'safe';
    return { title: p.title, requested, finalPath, existing, duplicateInBatch, overwrite, status };
  });
}

export function targetRiskSummary(config, files = [], pairs = [], collisions = []) {
  const invalidFiles = files.filter(f => ['Risk','Broken'].includes(f.health?.level)).length;
  const brokenFiles = files.filter(f => f.health?.level === 'Broken').length;
  const lowConfidencePairs = pairs.filter(p => Number(p.confidence || 0) < 60).length;
  const fallbackPairs = pairs.filter(p => /fallback/i.test(p.pairReason || '')).length;
  const noLyrics = pairs.filter(p => !p.lyrics).length;
  const collisionCount = collisions.filter(c => c.status !== 'safe').length;
  const warnings = [];
  if (brokenFiles) warnings.push(`${brokenFiles} file rusak/broken`);
  if (invalidFiles) warnings.push(`${invalidFiles} file risk perlu dicek`);
  if (lowConfidencePairs) warnings.push(`${lowConfidencePairs} pairing confidence rendah`);
  if (fallbackPairs) warnings.push(`${fallbackPairs} pair memakai fallback visual`);
  if (collisionCount) warnings.push(`${collisionCount} output collision/rename`);
  if (noLyrics && config.lyrics?.enabled) warnings.push(`${noLyrics} pair tanpa lirik`);
  const score = Math.max(0, 100 - brokenFiles*25 - invalidFiles*10 - lowConfidencePairs*8 - fallbackPairs*6 - collisionCount*5);
  return { score, level: score >= 85 ? 'Ready' : score >= 65 ? 'Check' : 'Risk', invalidFiles, brokenFiles, lowConfidencePairs, fallbackPairs, noLyrics, collisionCount, warnings };
}

export function autoTargetTune(config, files = [], pairs = []) {
  const visuals = files.filter(f => f.type === 'video' || f.type === 'image');
  const v = visuals.find(f => f.probe?.streams?.some?.(s => s.type === 'video')) || visuals[0];
  const stream = v?.probe?.streams?.find?.(s => s.type === 'video') || {};
  const width = Number(stream.width || config.target?.width || 1280);
  const height = Number(stream.height || config.target?.height || 720);
  const portrait = height > width;
  const square = Math.abs(width - height) < Math.max(width, height) * 0.12;
  const jobCount = pairs.length || files.filter(f => f.type === 'audio').length || 1;
  const avgDuration = Math.round((pairs.map(p => files.find(f => f.path === p.audio)?.duration).filter(Boolean).reduce((a,b)=>a+b,0) || Number(config.target?.duration || 0) * jobCount || 180) / Math.max(1, pairs.map(p => files.find(f => f.path === p.audio)?.duration).filter(Boolean).length || 1));
  const target = portrait ? { resolution: '1080x1920', width: 1080, height: 1920, aspect: '9:16', bitrate: jobCount > 20 ? '5500k' : '7000k' } : square ? { resolution: '1080x1080', width: 1080, height: 1080, aspect: '1:1', bitrate: '6000k' } : { resolution: width >= 1600 ? '1920x1080' : '1280x720', width: width >= 1600 ? 1920 : 1280, height: width >= 1600 ? 1080 : 720, aspect: '16:9', bitrate: width >= 1600 ? '8000k' : '4500k' };
  target.duration = Number(config.target?.duration || 0) || Math.max(3, avgDuration || 180);
  target.fps = jobCount > 30 ? 24 : 30;
  target.quality = jobCount > 20 ? 'fast' : 'balanced';
  target.hardwareAccel = 'auto';
  target.outputPattern = config.target?.outputPattern || '{title}-{date}-{num}';
  const reasons = [`visual ${portrait ? 'portrait' : square ? 'square' : 'landscape'}`, `${jobCount} job`, `durasi rata-rata ${avgDuration || target.duration}s`];
  return { patch: { target }, reasons };
}

export function pairMedia(files, config = {}) {
  const visuals = files.filter(f => f.type === 'video' || f.type === 'image'); const audios = files.filter(f => f.type === 'audio'); const lyrics = files.filter(f => f.type === 'lyrics');
  const mode = config.input?.pairMode || 'by-name'; const ignore = config.input?.ignoreWords || ''; const fallbackVisual = config.input?.visual || visuals[0]?.path || '';
  const visualByPath = new Map(visuals.map(v => [v.path, v]));
  if (mode === 'one-audio-all-visual') {
    const audio = config.input?.audio || audios[0]?.path || '';
    return visuals.map((visual, i) => { const title = path.basename(visual.name).replace(/\.[^.]+$/, ''); return { title, visual: visual.path, audio, lyrics: '', index: i + 1, outputName: outputName(title, config, i + 1), confidence: 80, pairReason: 'one audio untuk semua visual', lyricConfidence: 0 }; }).filter(x => x.audio);
  }
  return audios.map((audio, i) => {
    const aBase = normalizeName(audio.name, ignore); let visual = fallbackVisual; let lyric = ''; let confidence = 45; let pairReason = 'fallback visual'; let lyricConfidence = 0; let lyricReason = 'lirik kosong';
    if (mode === 'by-order') { visual = pickByOrder(visuals, i) || fallbackVisual; confidence = visual ? 75 : 0; pairReason = 'by-order'; }
    else if (mode === 'random-visual') { visual = pickByOrder([...visuals].sort(() => Math.random() - 0.5), i) || fallbackVisual; confidence = visual ? 65 : 0; pairReason = 'random visual'; }
    else {
      const exact = visuals.find(v => normalizeName(v.name, ignore) === aBase); const fuzzy = visuals.map(v => ({ v, score: similarity(normalizeName(v.name, ignore), aBase) })).sort((a,b)=>b.score-a.score)[0];
      if (exact) { visual = exact.path; confidence = 100; pairReason = 'exact name match'; }
      else if (fuzzy?.score >= 0.34) { visual = fuzzy.v.path; confidence = Math.round(fuzzy.score * 100); pairReason = `fuzzy match ${(fuzzy.score*100).toFixed(0)}%`; }
      const lExact = lyrics.find(l => normalizeName(l.name, ignore) === aBase); const lFuzzy = lyrics.map(l => ({ l, score: similarity(normalizeName(l.name, ignore), aBase) })).sort((a,b)=>b.score-a.score)[0];
      if (lExact) { lyric = lExact.path; lyricConfidence = 100; lyricReason = 'exact lirik'; }
      else if (lFuzzy?.score >= 0.34) { lyric = lFuzzy.l.path; lyricConfidence = Math.round(lFuzzy.score * 100); lyricReason = `fuzzy lirik ${(lFuzzy.score*100).toFixed(0)}%`; }
    }
    if (!visual) { confidence = 0; pairReason = 'visual tidak ditemukan'; }
    const vHealth = visualByPath.get(visual)?.health;
    if (vHealth?.level === 'Risk') confidence = Math.max(0, confidence - 15);
    if (vHealth?.level === 'Broken') confidence = Math.max(0, confidence - 40);
    const title = path.basename(audio.name).replace(/\.[^.]+$/, '');
    return { title, visual, audio: audio.path, lyrics: lyric, index: i + 1, outputName: outputName(title, config, i + 1), confidence, pairReason, lyricConfidence, lyricReason };
  });
}

export function estimateRender(config, pairs = [], files = []) {
  const bitrateNum = Number(String(config.target?.bitrate || '4500k').replace(/k/i,'')) || 4500;
  const audioBitrate = Number(String(config.audio?.audioBitrate || '192k').replace(/k/i,'')) || 192;
  const durations = pairs.map(p => files.find(f => f.path === p.audio)?.duration).filter(Boolean);
  const duration = Number(config.target?.duration || 0) || Math.round(durations.reduce((a,b)=>a+b,0) / Math.max(1,durations.length)) || 180;
  const jobs = pairs.length || Math.max(1, files.filter(f => f.type === 'audio').length);
  const sizeMB = Math.round(((bitrateNum + audioBitrate) * duration / 8 / 1024) * jobs);
  return { jobs, durationPerJob: duration, estimatedTotalDuration: duration * jobs, estimatedSizeMB: sizeMB, bitrate: `${bitrateNum}k`, audioBitrate: `${audioBitrate}k`, resolution: config.target?.resolution || `${config.target?.width || 1280}x${config.target?.height || 720}`, encoder: config.target?.hardwareAccel || 'auto' };
}

export function targetSummary(config, files = [], pairs = []) {
  const videos = files.filter(f => f.type === 'video').length; const images = files.filter(f => f.type === 'image').length; const audios = files.filter(f => f.type === 'audio').length; const lyrics = files.filter(f => f.type === 'lyrics').length;
  const warnings = files.flatMap(f => (f.warnings || []).map(w => `${f.name}: ${w}`)); const errors = [];
  if (!config.input?.visual && videos + images === 0) errors.push('Visual belum dipilih dan folder tidak berisi video/gambar.');
  if (!config.input?.audio && audios === 0) errors.push('Audio belum dipilih dan folder tidak berisi audio.');
  if (!config.input?.output) errors.push('Folder output belum diisi.');
  if (!pairs.length && audios > 0 && videos + images > 0) errors.push('Pairing belum menghasilkan batch.');
  const resolution = config.target?.resolution || `${config.target?.width || 1280}x${config.target?.height || 720}`;
  const collisions = outputCollisionReport(pairs, config);
  const risk = targetRiskSummary(config, files, pairs, collisions);
  const autoTune = autoTargetTune(config, files, pairs);
  return { counts: { videos, images, audios, lyrics, total: files.length }, resolution, ready: errors.length === 0 && risk.level !== 'Risk', errors, warnings: [...warnings, ...(risk.warnings || [])].slice(0, 80), estimate: estimateRender(config, pairs, files), collisions, risk, autoTune };
}
