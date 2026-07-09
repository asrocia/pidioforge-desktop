
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { hasFile, isImage, isVideo, escapeFilter, readLyricsFile, buildAssDocument } from './media-utils.mjs';
import { FFMPEG, FFPROBE } from './bin-resolver.mjs';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (b) => stdout += b.toString());
    child.stderr.on('data', (b) => stderr += b.toString());
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim() || `${command} exit ${code}`)));
  });
}

export async function ffprobeDuration(file) {
  if (!hasFile(file)) return 0;
  try {
    const out = await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', file]);
    return Number(out) || 0;
  } catch { return 0; }
}

async function buildPlaylistMixFile(files, config, workspaceDir, job) {
  const clean = files.filter(hasFile);
  if (!clean.length) return '';
  if (clean.length === 1) return clean[0];
  await mkdir(path.join(workspaceDir, 'tmp'), { recursive: true });
  const out = path.join(workspaceDir, 'tmp', `${job.id || Date.now()}-playlist.wav`);
  const args = ['-y'];
  clean.forEach(f => args.push('-i', f));
  const cross = Math.max(0, Number(config.audio?.crossfade ?? 0.8));
  const silence = Math.max(0, Number(config.audio?.silenceBetween ?? 0));
  const fmt = (i) => `[${i}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo${silence > 0 ? `,apad=pad_dur=${silence}` : ''}[a${i}]`;
  const filters = clean.map((_, i) => fmt(i));
  let prev = 'a0';
  for (let i = 1; i < clean.length; i++) {
    const label = i === clean.length - 1 ? 'mixout' : `mix${i}`;
    if (cross > 0) filters.push(`[${prev}][a${i}]acrossfade=d=${cross}:c1=tri:c2=tri[${label}]`);
    else filters.push(`[${prev}][a${i}]concat=n=2:v=0:a=1[${label}]`);
    prev = label;
  }
  args.push('-filter_complex', filters.join(';'), '-map', `[${prev}]`, '-c:a', 'pcm_s16le', out);
  await run(FFMPEG, args);
  return out;
}

function qualityPreset(config) {
  const perfPreset = config.performance?.x264Preset;
  const q = config.target.quality || 'balanced';
  if (perfPreset) return { preset: perfPreset, crf: String(config.target?.crf ?? (q === 'fast' ? 26 : q === 'high' ? 18 : 22)) };
  if (q === 'fast') return { preset: 'veryfast', crf: String(config.target?.crf ?? 26) };
  if (q === 'high') return { preset: 'slow', crf: String(config.target?.crf ?? 18) };
  return { preset: 'medium', crf: String(config.target?.crf ?? 22) };
}

function targetSize(config) {
  const res = String(config.target?.resolution || '').match(/^(\d+)x(\d+)$/);
  const width = Number(config.target?.width || res?.[1] || 1280);
  const height = Number(config.target?.height || res?.[2] || 720);
  return { width, height };
}
async function encoderArgs(config) {
  const hw = config.target?.hardwareAccel || 'auto';
  let encText = '';
  try { encText = await run(FFMPEG, ['-hide_banner', '-encoders']); } catch { encText = ''; }
  const has = (name) => encText.includes(name);
  if ((hw === 'nvidia' || hw === 'auto') && has('h264_nvenc')) return ['-c:v', 'h264_nvenc', '-preset', 'p4'];
  if ((hw === 'intel' || hw === 'auto') && has('h264_qsv')) return ['-c:v', 'h264_qsv'];
  if ((hw === 'amd' || hw === 'auto') && has('h264_amf')) return ['-c:v', 'h264_amf'];
  return ['-c:v', 'libx264'];
}

function resolveOutput(job, config) {
  if (job.output) return job.output;
  const outDir = job.outputDir || config.input.output || 'Hasil';
  const name = (job.title || `render-${job.id}`).replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '-');
  const requested = path.join(outDir, `${name}.mp4`);
  if (config.target?.overwrite !== false || !existsSync(requested)) return requested;
  const ext = path.extname(requested);
  const stem = path.basename(requested, ext);
  let i = 2;
  let candidate = path.join(outDir, `${stem}-${i}${ext}`);
  while (existsSync(candidate)) candidate = path.join(outDir, `${stem}-${++i}${ext}`);
  return candidate;
}

function safeMargins(config, baseX = 20, baseY = 20) {
  const preset = config.branding?.safeAreaPreset || 'youtube';
  const vertical = (config.target?.height || 720) > (config.target?.width || 1280);
  if (preset === 'shorts' || vertical) return { x: Math.max(baseX, 56), y: Math.max(baseY, 120) };
  if (preset === 'reels') return { x: Math.max(baseX, 50), y: Math.max(baseY, 110) };
  if (preset === 'center-title') return { x: Math.max(baseX, 90), y: Math.max(baseY, 90) };
  return { x: Math.max(baseX, 28), y: Math.max(baseY, 28) };
}
function overlayPosition(position = 'Kanan Atas', marginX = 20, marginY = 20, config = {}) {
  const safe = safeMargins(config, marginX, marginY);
  const x = position.includes('Kiri') ? safe.x : position.includes('Tengah') ? `(W-w)/2` : `W-w-${safe.x}`;
  const y = position.includes('Atas') ? safe.y : position.includes('Tengah') ? `(H-h)/2` : `H-h-${safe.y}`;
  return `${x}:${y}`;
}
function overlayPositionAnimated(position, marginX, marginY, config, animation, start, end, duration) {
  const base = overlayPosition(position, marginX, marginY, config).split(':');
  const x = base[0], y = base[1];
  const s = Number(start || 0);
  const e = Number(end || 0) > 0 ? Number(end) : duration;
  if (animation === 'slide-left') return [`if(lt(t,${s + 0.6}),W-(W-(${x}))*(t-${s})/0.6,${x})`, y];
  if (animation === 'slide-right') return [`if(lt(t,${s + 0.6}),-w+(${x}+w)*(t-${s})/0.6,${x})`, y];
  if (animation === 'pulse') return [x, `${y}+sin(t*6)*4`];
  if (animation === 'zoom') return [x, `${y}+sin(t*4)*3`];
  return [x, y];
}

function enableExpr(start = 0, end = 0, duration = 0) {
  const s = Math.max(0, Number(start) || 0);
  const e = Number(end) > 0 ? Number(end) : duration;
  return `between(t,${s},${Math.max(s, e)})`;
}
function bumperWindows(position, bumperDuration, duration) {
  const d = Math.max(0.2, Number(bumperDuration) || 3);
  if (position === 'Awal') return [`between(t,0,${Math.min(duration, d)})`];
  if (position === 'Keduanya') return [`between(t,0,${Math.min(duration, d)})`, `between(t,${Math.max(0, duration - d)},${duration})`];
  return [`between(t,${Math.max(0, duration - d)},${duration})`];
}

function parseNowPlayingText(config = {}, audioFile = '', job = {}) {
  const sp = config.spectrum || {}; const input = config.input || {};
  let title = job.title || input.title || '';
  if (!title && sp.nowPlayingAutoFromFile && audioFile) title = path.basename(audioFile).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const artist = sp.nowPlayingArtist || '';
  const album = sp.nowPlayingAlbum || '';
  return String(sp.nowPlayingTemplate || '{title}').replaceAll('{title}', title || 'Now Playing').replaceAll('{artist}', artist).replaceAll('{album}', album).replaceAll('{filename}', audioFile ? path.basename(audioFile) : '');
}
function spectrumOverlayPosition(config, width, height, spectrumHeight) {
  const sp = config.spectrum || {};
  const marginX = Number(sp.marginX ?? 0); const marginY = Number(sp.marginY ?? 34);
  const pos = sp.position || 'Bawah';
  const x = sp.widthMode === 'center' ? `(W-w)/2` : marginX;
  if (Number.isFinite(Number(sp.previewY))) {
    const pct = Math.max(6, Math.min(94, Number(sp.previewY))) / 100;
    return `${x}:H*${pct}-h/2`;
  }
  const y = pos === 'Atas' ? marginY : pos === 'Tengah' ? `(H-h)/2+${Number(sp.y || 0)}` : `H-h-${marginY}`;
  return `${x}:${y}`;
}
function normalizeColor(c) {
  const named = { white: 'white', red: 'red', blue: 'blue', yellow: 'yellow', cyan: 'cyan', green: 'green' };
  if (!c) return 'white';
  const s = String(c); return named[s] || s.replace('#','0x');
}

function audioProcessingChain(inputLabel, outputLabel, config, duration) {
  const a = config.audio || {};
  const filters = [];
  filters.push(`volume=${Number(a.bgmVolume ?? 100) / 100}`);
  if (a.autoDuck && config.branding?.ctaEnabled) {
    const ds = Number(config.branding?.ctaAt || 2);
    const de = ds + Number(config.branding?.ctaDuration || 8);
    const duck = Math.max(0, Math.min(100, Number(a.duckingLevel ?? 35))) / 100;
    filters.push(`volume=enable='between(t,${ds},${de})':volume=${duck}`);
  }
  if (Number(a.pan || 0) !== 0) {
    const pan = Math.max(-100, Math.min(100, Number(a.pan || 0))) / 100;
    const left = pan > 0 ? 1 - pan : 1;
    const right = pan < 0 ? 1 + pan : 1;
    filters.push(`pan=stereo|c0=${left}*c0|c1=${right}*c1`);
  }
  if (Number(a.highPass || 0) > 0) filters.push(`highpass=f=${Number(a.highPass)}`);
  if (Number(a.lowPass || 0) > 0) filters.push(`lowpass=f=${Number(a.lowPass)}`);
  if (a.deHum) filters.push('anequalizer=c0 f=50 w=35 g=-18|c1 f=50 w=35 g=-18');
  if (a.noiseGate) filters.push(`agate=threshold=${Number(a.noiseGateThreshold ?? -45)}dB:ratio=2:attack=20:release=250`);
  if (Number(a.bassGain || 0) !== 0) filters.push(`equalizer=f=100:t=q:w=1:g=${Number(a.bassGain || 0)}`);
  if (Number(a.midGain || 0) !== 0) filters.push(`equalizer=f=1000:t=q:w=1:g=${Number(a.midGain || 0)}`);
  if (Number(a.trebleGain || 0) !== 0) filters.push(`equalizer=f=8000:t=q:w=1:g=${Number(a.trebleGain || 0)}`);
  if (a.compressor) filters.push(`acompressor=threshold=${Number(a.compressorThreshold ?? -18)}dB:ratio=${Number(a.compressorRatio ?? 3)}:attack=20:release=250`);
  if (a.normalize) filters.push('loudnorm=I=-14:TP=-1.5:LRA=11');
  filters.push(`afade=t=in:st=0:d=${Number(a.fadeIn ?? 0.6)}`);
  filters.push(`afade=t=out:st=${Math.max(0, duration - Number(a.fadeOut ?? 1.2))}:d=${Number(a.fadeOut ?? 1.2)}`);
  if (a.limiter) filters.push('alimiter=limit=0.95');
  filters.push(`volume=${Number(a.masterGain ?? 100) / 100}`);
  return `[${inputLabel}]${filters.join(',')}[${outputLabel}]`;
}
function audioReactiveSpec(config) {
  const a = config.audio || {};
  const strength = Math.max(0, Math.min(100, Number(a.reactiveStrength ?? 40))) / 100;
  const opacity = Math.max(0.03, Math.min(0.35, strength * 0.35));
  if (a.reactiveFx === 'Off') return null;
  if (a.reactiveFx === 'Logo Pulse') return { opacity, enable: 'gt(sin(t*5),0.65)' };
  if (a.reactiveFx === 'Background Jedug') return { opacity, enable: 'gt(sin(t*9),0.72)' };
  return { opacity, enable: 'gt(sin(t*12),0.78)' };
}

async function waveformPeaks(file, seconds = 60, buckets = 240) {
  if (!hasFile(file)) return [];
  try {
    const child = spawn(FFMPEG, ['-v', 'error', '-i', file, '-t', String(Math.max(1, Math.min(300, seconds))), '-ac', '1', '-ar', '8000', '-f', 's16le', 'pipe:1'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    await new Promise((resolve) => { child.stdout.on('data', b => chunks.push(b)); child.on('close', resolve); child.on('error', resolve); });
    const buf = Buffer.concat(chunks); const samples = Math.floor(buf.length / 2); const count = Math.max(30, Math.min(500, buckets)); const per = Math.max(1, Math.floor(samples / count)); const peaks = [];
    for (let i = 0; i < count; i++) { let peak = 0; for (let j = i * per; j < Math.min(samples, (i + 1) * per); j++) peak = Math.max(peak, Math.abs(buf.readInt16LE(j * 2)) / 32768); peaks.push(peak); }
    return peaks;
  } catch { return []; }
}
function beatEnableExpression(peaks, seconds = 60, sensitivity = 55) {
  if (!peaks?.length) return '';
  const avg = peaks.reduce((a,b)=>a+b,0) / peaks.length;
  const sens = Math.max(0, Math.min(100, Number(sensitivity ?? 55)));
  const multiplier = 2.0 - (sens / 100) * 1.15;
  const floor = 0.32 - (sens / 100) * 0.18;
  const threshold = Math.max(avg * multiplier, floor);
  const parts = [];
  peaks.forEach((v, i) => { const prev = peaks[i-1] || 0; const next = peaks[i+1] || 0; if (v >= threshold && v >= prev && v >= next) { const t = (i / peaks.length) * seconds; parts.push(`between(t,${Math.max(0,t-0.05).toFixed(2)},${(t+0.14).toFixed(2)})`); } });
  return parts.slice(0, 160).join('+');
}


export async function buildFfmpegArgs(job, config, workspaceDir) {
  const visual = job.input?.visual || config.input.visual;
  let audio = job.input?.audio || config.input.audio;
  const logo = job.input?.logo || config.branding.logo;
  const particle = job.input?.particle || config.overlay.particleFile;
  const bumper = job.input?.bumper || config.branding.bumperVideo;
  const cta = job.input?.cta || config.branding.ctaGreenscreen;
  const lyricFile = job.input?.lyrics || config.lyrics.file || config.lyrics.srtPath;
  const output = job.output || resolveOutput(job, config);

  if (!hasFile(visual)) throw new Error(`File visual tidak ditemukan: ${visual || '(kosong)'}`);
  if (!hasFile(audio)) throw new Error(`File audio tidak ditemukan: ${audio || '(kosong)'}`);
  if (!isImage(visual) && !isVideo(visual)) throw new Error(`Format visual belum didukung: ${visual}`);
  if (config.audio?.mixMode === 'playlist') {
    const playlistFiles = [...(config.audio?.introSongs || []), ...(config.audio?.songs?.length ? config.audio.songs : [audio]), config.audio?.endingSong].filter(Boolean);
    const mixed = await buildPlaylistMixFile(playlistFiles, config, workspaceDir, job);
    if (mixed) audio = mixed;
  }

  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(path.join(workspaceDir, 'tmp'), { recursive: true });

  const audioDuration = await ffprobeDuration(audio);
  const visualDuration = await ffprobeDuration(visual);
  const targetDuration = Number(job.duration || config.target.duration || audioDuration || visualDuration || 60);
  const duration = Math.max(1, targetDuration);
  const { preset, crf } = qualityPreset(config);
  const { width, height } = targetSize(config);
  const args = ['-y'];
  const startAt = Math.max(0, Number(job.startAt ?? config.preview?.startAt ?? 0));

  if (isImage(visual)) args.push('-loop', '1', '-framerate', String(config.target.fps || 30), '-t', String(duration));
  else if (startAt > 0) args.push('-ss', String(startAt));
  args.push('-i', visual);
  if (startAt > 0) args.push('-ss', String(startAt));
  args.push('-i', audio);

  let nextIndex = 2;
  const indexes = {};
  for (const [key, file] of Object.entries({ logo, particle, bumper, cta, overlayAsset: config.overlay?.overlayFile, ambient: config.audio?.ambientLoop, voice: config.audio?.voiceTrack, effect: config.audio?.effectTrack })) {
    if (hasFile(file)) {
      if (key === 'particle' || key === 'bumper' || key === 'cta' || key === 'ambient' || (key === 'overlayAsset' && isVideo(file))) args.push('-stream_loop', '-1');
      if (key === 'overlayAsset' && isImage(file)) args.push('-loop', '1', '-t', String(duration));
      indexes[key] = nextIndex++;
      args.push('-i', file);
    }
  }
  indexes.stems = [];
  for (const stem of (config.audio?.stems || [])) {
    if (hasFile(stem?.file) && stem?.mute !== true) {
      indexes.stems.push({ index: nextIndex++, volume: Number(stem.volume ?? 100), pan: Number(stem.pan ?? 0), name: stem.name || 'stem' });
      args.push('-i', stem.file);
    }
  }

  let lyricRows = [];
  if (hasFile(lyricFile) && config.lyrics?.enabled !== false) lyricRows = await readLyricsFile(lyricFile);
  const assFile = path.join(workspaceDir, 'tmp', `${job.id || Date.now()}.ass`);
  const shouldWriteAss = Boolean((config.spectrum?.nowPlaying && (job.title || config.input.title)) || lyricRows.length || config.overlay?.timestamp || (config.branding?.watermarkEnabled && config.branding?.watermarkText));
  if (shouldWriteAss) {
    await writeFile(assFile, buildAssDocument({
      rows: lyricRows,
      title: config.spectrum?.nowPlaying ? parseNowPlayingText(config, audio, job) : '',
      duration,
      font: config.lyrics?.font || 'Arial',
      fontSize: Number(config.lyrics?.scale || 28),
      lyricColor: config.lyrics?.color || '#ffffff',
      lyricHighlightColor: config.lyrics?.highlightColor || '#22c55e',
      lyricPosition: config.lyrics?.position || 'Bawah',
      lyricAlign: config.lyrics?.align || 'Rata Tengah',
      lyricOutline: Number(config.lyrics?.outline ?? 2),
      lyricShadow: Number(config.lyrics?.shadow ?? 1),
      lyricKaraoke: Boolean(config.lyrics?.karaoke),
      titleEnabled: Boolean(config.spectrum?.nowPlaying),
      titlePosition: config.spectrum?.nowPlayingPosition || 'Atas',
      titleFontSize: Number(config.spectrum?.nowPlayingFontSize || 26),
      titleColor: config.spectrum?.nowPlayingColor || '#ffffff',
      titleX: config.spectrum?.nowPlayingX ? Math.round(width * Number(config.spectrum.nowPlayingX) / 100) : 0,
      titleY: config.spectrum?.nowPlayingY ? Math.round(height * Number(config.spectrum.nowPlayingY) / 100) : 0,
      timestampEnabled: Boolean(config.overlay?.timestamp),
      timestampText: config.overlay?.timestampText || 'Rendered by PidioForge',
      timestampPosition: config.overlay?.timestampPosition || 'Kiri Atas',
      lowerThirdEnabled: Boolean(config.overlay?.lowerThirdEnabled),
      lowerThirdText: config.overlay?.lowerThirdText || '',
      lowerThirdPosition: config.overlay?.lowerThirdPosition || 'Bawah',
      lowerThirdAt: Number(config.overlay?.lowerThirdAt || 2),
      lowerThirdDuration: Number(config.overlay?.lowerThirdDuration || 5),
      watermark: config.branding?.watermarkText || '',
      watermarkEnabled: Boolean(config.branding?.watermarkEnabled),
      watermarkPosition: config.branding?.watermarkPosition || 'Kiri Bawah',
      watermarkOpacity: Number(config.branding?.watermarkOpacity ?? 70),
      watermarkMode: config.branding?.watermarkMode || 'always',
      watermarkInterval: Number(config.branding?.watermarkInterval || 12),
      watermarkVisibleDuration: Number(config.branding?.watermarkVisibleDuration || 5),
    }), 'utf8');
  }

  const filters = [];
  filters.push(`[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=rgba[v0]`);
  const introDelay = (config.branding?.bumperEnabled && (config.branding?.bumperPosition === 'Awal' || config.branding?.bumperPosition === 'Keduanya') && config.branding?.bumperAudioMode === 'after-intro') ? Math.round(Number(config.branding?.bumperDuration || 0) * 1000) : 0;
  const audioBase = introDelay > 0 ? `[1:a]adelay=${introDelay}:all=1[auddelayed]` : '';
  if (audioBase) filters.push(audioBase);
  const audioIn = introDelay > 0 ? 'auddelayed' : '1:a';
  filters.push(audioProcessingChain(audioIn, 'amain_processed', config, duration));
  const mixLabels = ['amain_processed'];
  if (indexes.ambient !== undefined && config.audio?.asmMode) {
    const ambientVolume = Number(config.audio?.ambientVolume ?? 15) / 100;
    filters.push(`[${indexes.ambient}:a]volume=${ambientVolume},aloop=loop=-1:size=2e+09,atrim=0:${duration}[ambient]`);
    mixLabels.push('ambient');
  }
  if (indexes.voice !== undefined) {
    filters.push(`[${indexes.voice}:a]volume=${Number(config.audio?.voiceVolume ?? 100) / 100},atrim=0:${duration}[voice]`);
    mixLabels.push('voice');
  }
  if (indexes.effect !== undefined) {
    filters.push(`[${indexes.effect}:a]volume=${Number(config.audio?.effectVolume ?? 80) / 100},atrim=0:${duration}[effect]`);
    mixLabels.push('effect');
  }
  for (let si = 0; si < (indexes.stems || []).length; si++) {
    const stem = indexes.stems[si];
    let chain = `volume=${stem.volume / 100}`;
    if (stem.pan !== 0) {
      const pan = Math.max(-100, Math.min(100, stem.pan)) / 100;
      const left = pan > 0 ? 1 - pan : 1;
      const right = pan < 0 ? 1 + pan : 1;
      chain += `,pan=stereo|c0=${left}*c0|c1=${right}*c1`;
    }
    filters.push(`[${stem.index}:a]${chain},atrim=0:${duration}[stem${si}]`);
    mixLabels.push(`stem${si}`);
  }
  if (mixLabels.length > 1) filters.push(`${mixLabels.map(x => `[${x}]`).join('')}amix=inputs=${mixLabels.length}:duration=first:dropout_transition=2[a_mixed]`);
  else filters.push('[amain_processed]anull[a_mixed]');
  if (config.spectrum?.enabled !== false) {
    filters.push('[a_mixed]asplit=2[aout][awave]');
  } else {
    filters.push('[a_mixed]anull[aout]');
  }
  const detectedBeatEnable = config.audio?.beatDetection !== false ? beatEnableExpression(await waveformPeaks(audio, Math.min(duration, 90), 240), Math.min(duration, 90), config.spectrum?.beatSensitivity ?? config.audio?.reactiveStrength ?? 55) : '';
  let v = 'v0';
  let n = 1;

  if (indexes.bumper !== undefined && config.branding?.bumperEnabled) {
    const windows = bumperWindows(config.branding.bumperPosition, config.branding.bumperDuration, duration);
    const labels = windows.map((_, i) => `bumper${i}`);
    if (windows.length > 1) {
      filters.push(`[${indexes.bumper}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,format=rgba${config.branding?.bumperTransition === 'fade' ? `,fade=t=in:st=0:d=${Number(config.branding?.bumperFadeDuration || 0.45)}:alpha=1,fade=t=out:st=${Math.max(0.1, Number(config.branding?.bumperDuration || 3)-Number(config.branding?.bumperFadeDuration || 0.45))}:d=${Number(config.branding?.bumperFadeDuration || 0.45)}:alpha=1` : ''},split=${windows.length}${labels.map(x => `[${x}]`).join('')}`);
    } else {
      filters.push(`[${indexes.bumper}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,format=rgba${config.branding?.bumperTransition === 'fade' ? `,fade=t=in:st=0:d=${Number(config.branding?.bumperFadeDuration || 0.45)}:alpha=1,fade=t=out:st=${Math.max(0.1, Number(config.branding?.bumperDuration || 3)-Number(config.branding?.bumperFadeDuration || 0.45))}:d=${Number(config.branding?.bumperFadeDuration || 0.45)}:alpha=1` : ''}[bumper0]`);
    }
    windows.forEach((expr, i) => {
      filters.push(`[${v}][${labels[i]}]overlay=0:0:enable='${expr}':shortest=0[v${n}]`); v = `v${n++}`;
    });
  }


  if (indexes.particle !== undefined && config.overlay.videoParticle !== false) {
    const opacity = Number(config.overlay.particleOpacity ?? 70) / 100;
    filters.push(`[${indexes.particle}:v]scale=${width}:${height},format=rgba,colorchannelmixer=aa=${opacity}[particle]`);
    filters.push(`[${v}][particle]overlay=0:0:shortest=1[v${n}]`); v = `v${n++}`;
  }

  if (indexes.overlayAsset !== undefined && config.overlay?.overlayEnabled) {
    const scale = Number(config.overlay.overlayScale || 100) / 100;
    const opacity = Number(config.overlay.overlayOpacity ?? 80) / 100;
    const xy = overlayPosition(config.overlay.overlayPosition || 'Tengah', 28, 28, config);
    const enable = enableExpr(config.overlay.overlayStart || 0, config.overlay.overlayEnd || 0, duration);
    filters.push(`[${indexes.overlayAsset}:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[overlayAsset]`);
    filters.push(`[${v}][overlayAsset]overlay=${xy}:enable='${enable}'[v${n}]`); v = `v${n++}`;
  }

  if (config.audio?.reactiveFx && config.audio.reactiveFx !== 'Off') {
    const reactive = audioReactiveSpec(config);
    if (reactive) {
      const color = config.audio?.beatFlashColor || 'white';
      const enable = detectedBeatEnable || reactive.enable;
      filters.push(`[${v}]drawbox=x=0:y=0:w=iw:h=ih:color=${color}@${reactive.opacity}:t=fill:enable='${enable}'[v${n}]`); v = `v${n++}`;
    }
  }

  if (indexes.logo !== undefined && config.branding?.logoEnabled !== false) {
    const scale = Number(config.branding.logoScale || 18) / 100;
    const opacity = Number(config.branding.logoOpacity ?? 100) / 100;
    const startLogo = Number(config.branding.logoStart || 0);
    const endLogo = Number(config.branding.logoEnd || 0) > 0 ? Number(config.branding.logoEnd) : duration;
    const fade = Number(config.branding.logoFadeDuration || 0.6);
    const [lx, ly] = overlayPositionAnimated(config.branding.logoPosition || 'Kanan Atas', Number(config.branding.logoMarginX || 20), Number(config.branding.logoMarginY || 20), config, config.branding.logoAnimation || 'none', startLogo, endLogo, duration);
    const enable = enableExpr(startLogo, endLogo, duration);
    const fadeChain = config.branding.logoAnimation === 'fade' ? `,fade=t=in:st=${startLogo}:d=${fade}:alpha=1,fade=t=out:st=${Math.max(startLogo, endLogo - fade)}:d=${fade}:alpha=1` : '';
    filters.push(`[${indexes.logo}:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}${fadeChain}[logo]`);
    filters.push(`[${v}][logo]overlay=x='${lx}':y='${ly}':enable='${enable}'[v${n}]`); v = `v${n++}`;
  }



  if (indexes.cta !== undefined && config.branding?.ctaEnabled) {
    const preset = config.branding.ctaPreset || 'subscribe-lower-right';
    const ctaScale = Number(config.branding.ctaScale || (preset === 'center-cta' ? 42 : 26)) / 100;
    const pos = preset === 'center-cta' ? 'Tengah' : preset === 'like-subscribe-bottom' ? 'Kanan Bawah' : config.branding.ctaPosition || 'Kanan Bawah';
    const xy = overlayPosition(pos, 28, 28, config);
    const startAt = Number(config.branding.ctaAt || 2);
    const endAt = Math.min(duration, startAt + Number(config.branding.ctaDuration || 8));
    const chroma = config.branding.ctaChromaPreset === 'blue' ? '0x0000ff' : (config.branding.ctaChromaColor || '0x00ff00');
    const similarity = Number(config.branding.ctaSimilarity ?? (config.branding.ctaChromaPreset === 'auto' ? 0.28 : 0.35));
    const blend = Number(config.branding.ctaBlend ?? 0.08);
    filters.push(`[${indexes.cta}:v]scale=iw*${ctaScale}:-1,colorkey=${chroma}:${similarity}:${blend},format=rgba[cta]`);
    filters.push(`[${v}][cta]overlay=${xy}:enable='between(t,${startAt},${endAt})'[v${n}]`); v = `v${n++}`;
  }



  if (config.spectrum?.enabled !== false) {
    const sp = config.spectrum || {};
    const colors = (sp.colors?.length ? sp.colors : [sp.color1 || 'white', sp.color2].filter(Boolean)).map(normalizeColor).join('|');
    const opacity = Number(sp.transparency ?? 80) / 100;
    const specH = Math.max(32, Number(sp.height || 128));
    const specW = sp.widthMode === 'center' ? Math.round(width * Number(sp.zoom || 100) / 100) : width - (Number(sp.marginX || 0) * 2);
    const mode = sp.model === 'Bar' ? 'cline' : sp.model === 'Line' ? 'line' : 'cline';
    const mirror = sp.mirror === 'On' || sp.mirror === 'Mirror';
    if (sp.analyzerMode === 'frequency' || sp.model === 'Bar') {
      filters.push(`[awave]showfreqs=s=${specW}x${specH}:mode=bar:ascale=log:fscale=log:colors=${colors},format=rgba,colorchannelmixer=aa=${opacity}[waves0]`);
    } else {
      filters.push(`[awave]showwaves=s=${specW}x${specH}:mode=${mode}:colors=${colors},format=rgba,colorchannelmixer=aa=${opacity}[waves0]`);
    }
    if (mirror) filters.push('[waves0]split=2[wtop][wbot];[wbot]vflip[wmirror];[wtop][wmirror]vstack=inputs=2[waves1]');
    const waveLabel = mirror ? 'waves1' : 'waves0';
    const xy = spectrumOverlayPosition(config, width, height, mirror ? specH * 2 : specH);
    filters.push(`[${v}][${waveLabel}]overlay=${xy}[v${n}]`); v = `v${n++}`;
    if (sp.glow) {
      const glowOpacity = Math.max(0.03, Math.min(0.35, Number(sp.glowStrength || 35) / 100));
      filters.push(`[${v}]drawbox=x=0:y=0:w=iw:h=ih:color=${normalizeColor(sp.color2 || sp.color1 || 'white')}@${glowOpacity}:t=fill:enable='${detectedBeatEnable || 'gt(sin(t*10),0.82)'}'[v${n}]`); v = `v${n++}`;
    }
  }

  if (config.spectrum?.progressBar !== false) {
    const pc = normalizeColor(config.spectrum?.progressColor || config.spectrum?.color1 || 'white');
    const ph = config.spectrum?.progressStyle === 'thin' ? 3 : 6;
    filters.push(`[${v}]drawbox=x=80:y=ih-24:w=(iw-160)*t/${duration}:h=${ph}:color=${pc}@0.9:t=fill[v${n}]`); v = `v${n++}`;
  }

  if (config.overlay?.darken) {
    filters.push(`[${v}]drawbox=x=0:y=0:w=iw:h=ih:color=black@${Number(config.overlay.darkenOpacity || 15)/100}:t=fill[v${n}]`); v = `v${n++}`;
  }
  if (config.overlay?.vignette) {
    filters.push(`[${v}]vignette=angle=PI/4:mode=backward[v${n}]`); v = `v${n++}`;
  }
  if (config.overlay?.filmGrain) {
    filters.push(`[${v}]noise=alls=${Math.max(0, Number(config.overlay.grainStrength || 12))}:allf=t+u[v${n}]`); v = `v${n++}`;
  }
  if (config.overlay?.scanlines) {
    filters.push(`[${v}]drawgrid=width=iw:height=4:thickness=1:color=black@${Number(config.overlay.scanlineOpacity || 6)/100}[v${n}]`); v = `v${n++}`;
  }
  if (config.overlay?.letterbox) {
    const lb = Math.max(0, Number(config.overlay.letterboxSize || 80));
    filters.push(`[${v}]drawbox=x=0:y=0:w=iw:h=${lb}:color=black@1:t=fill,drawbox=x=0:y=ih-${lb}:w=iw:h=${lb}:color=black@1:t=fill[v${n}]`); v = `v${n++}`;
  }
  if (config.overlay?.frameBorder) {
    const bc = normalizeColor(config.overlay.borderColor || 'white'); const bt = Math.max(1, Number(config.overlay.borderThickness || 6));
    filters.push(`[${v}]drawbox=x=0:y=0:w=iw:h=ih:color=${bc}@0.95:t=${bt}[v${n}]`); v = `v${n++}`;
  }

  if (shouldWriteAss) {
    filters.push(`[${v}]ass='${escapeFilter(assFile)}'[v${n}]`); v = `v${n++}`;
  }


  args.push('-filter_complex', filters.join(';'));
  args.push('-map', `[${v}]`, '-map', '[aout]');
  const venc = await encoderArgs(config);
  args.push('-t', String(duration), '-r', String(config.target.fps || 30), ...venc);
  if (venc.includes('libx264')) args.push('-preset', preset, '-crf', crf);
  if (Number(config.performance?.ffmpegThreads || 0) > 0) args.push('-threads', String(Math.max(1, Math.min(32, Number(config.performance.ffmpegThreads)))));
  args.push('-b:v', config.target.bitrate || '4500k', '-pix_fmt', config.target.pixelFormat || 'yuv420p', '-c:a', 'aac', '-b:a', config.audio.audioBitrate || '192k', '-shortest');
  if (config.target.faststart !== false) args.push('-movflags', '+faststart');
  args.push('-progress', 'pipe:1', '-nostats', output);
  return { args, duration, output };
}

export async function renderJob(job, config, workspaceDir, callbacks = {}) {
  const { args, duration, output } = await buildFfmpegArgs(job, config, workspaceDir);
  callbacks.onLog?.(`Render nyata dimulai: ${job.title}`);
  callbacks.onLog?.(`Output: ${output}`);
  callbacks.onCommand?.(`${FFMPEG} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    callbacks.onProcess?.(child);
    const progressState = {};
    child.stdout.on('data', (buf) => {
      for (const line of buf.toString().split(/\r?\n/)) {
        const [key, raw] = line.split('=');
        if (!key || raw === undefined) continue;
        progressState[key] = raw;
        if (key === 'out_time_ms') {
          const micros = Number(raw);
          if (Number.isFinite(micros) && duration > 0) callbacks.onProgress?.(Math.min(99, Math.max(1, Math.round((micros / 1_000_000 / duration) * 100))));
        }
        if (['out_time_ms', 'total_size', 'speed'].includes(key)) callbacks.onMetrics?.({ ...progressState, duration });
      }
    });
    child.stderr.on('data', (buf) => {
      const line = buf.toString().trim();
      if (line) callbacks.onLog?.(line.slice(0, 1200));
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) { callbacks.onProgress?.(100); callbacks.onLog?.(`Render selesai: ${output}`); resolve({ ok: true, output }); }
      else reject(new Error(`FFmpeg gagal dengan kode ${code}`));
    });
  });
}
