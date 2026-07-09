import path from 'node:path';

export const PORT = Number(process.env.PIDIOFORGE_API_PORT || 8787);
export const MAX_BODY_BYTES = Number(process.env.PIDIOFORGE_MAX_BODY_BYTES || 2_000_000);
export const ALLOWED_ORIGIN = process.env.PIDIOFORGE_ALLOWED_ORIGIN || 'http://127.0.0.1:1420';
export const workspaceDir = path.resolve(process.env.PIDIOFORGE_DATA_DIR || path.join(process.cwd(), 'backend/.data'));
export const dbPath = path.join(workspaceDir, 'state.json');

export function deepMerge(a, b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return b;
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(a?.[k] || {}, v) : v;
  return out;
}

export const defaultConfig = {
  target: {
    engine: 'Auto GPU', modeVideo: 'Video/Gambar Fixed', modeRender: 'FFmpeg', bitrate: '4500k', fps: 30,
    quality: 'balanced', duration: 0, totalBatch: 1, resolution: '1280x720', width: 1280, height: 720,
    aspect: '16:9', maxZoom: 110, speed: 100, hardwareAccel: 'auto', overwrite: false,
    outputPattern: '{title}-{date}-{num}', crf: 22, pixelFormat: 'yuv420p', faststart: true,
  },
  input: {
    bahanFolder: '', visualFolder: '', audioFolder: '', lyricFolder: '', visual: '', audio: '', title: '', output: 'Hasil',
    autoPairByName: true, pairMode: 'by-name', excludeOutputOnScan: true,
    ignoreWords: 'official,lyrics,lyric,visual,full,hd,video,audio,music',
  },
  branding: { bumperVideo: '', bumperEnabled: false, bumperPosition: 'Akhir', bumperTransition: 'fade', bumperDuration: 3, bumperFadeDuration: 0.45, bumperAudioMode: 'after-intro', logo: '', logoEnabled: true, logoPosition: 'Kanan Atas', logoScale: 18, logoOpacity: 100, logoMarginX: 20, logoMarginY: 20, logoStart: 0, logoEnd: 0, logoAnimation: 'none', logoFadeDuration: 0.6, safeAreaPreset: 'youtube', ctaGreenscreen: '', ctaEnabled: false, ctaPreset: 'subscribe-lower-right', ctaPosition: 'Kanan Bawah', ctaScale: 26, ctaAt: 2, ctaDuration: 8, ctaChromaPreset: 'green', ctaChromaColor: '0x00ff00', ctaSimilarity: 0.35, ctaBlend: 0.08, watermarkText: '', watermarkEnabled: false, watermarkPosition: 'Kiri Bawah', watermarkOpacity: 70, watermarkMode: 'always', watermarkInterval: 12, watermarkVisibleDuration: 5, layerOrder: 'bumper,particle,logo,cta,spectrum,lyrics,watermark', brandPreset: 'custom' },
  audio: { videoVolume: 0, bgmVolume: 100, audioBitrate: '192k', order: 'acak', mixMode: 'single', platformPreset: 'youtube-music', normalize: true, limiter: true, autoGain: true, fadeIn: 0.6, fadeOut: 1.2, masterGain: 100, pan: 0, bassGain: 0, midGain: 0, trebleGain: 0, highPass: 0, lowPass: 0, deHum: false, noiseGate: false, noiseGateThreshold: -45, compressor: false, compressorThreshold: -18, compressorRatio: 3, asmMode: false, ambientLoop: '', ambientVolume: 15, voiceTrack: '', voiceVolume: 100, effectTrack: '', effectVolume: 80, reactiveFx: 'Beat Flash', reactiveStrength: 40, beatFlashColor: 'white', beatDetection: true, songs: [], introSongs: [], endingSong: '', endingVolume: 100, crossfade: 0.8, silenceBetween: 0, autoDuck: false, duckingLevel: 35, stems: [] },
  lyrics: { enabled: true, file: '', srtPath: '', outputFile: '', ai: 'off', autoMode: 'from-text', model: 'Cepat', language: 'Auto', align: 'Rata Tengah', position: 'Bawah', scale: 28, spacing: 110, outline: 1, shadow: 1, color: '#ffffff', highlightColor: '#22c55e', font: 'Arial', glow: false, karaoke: false, wordByWord: false, uppercase: false, maxChars: 42, lineDuration: 3, leadIn: 0.15, offset: 0, safeArea: true, stylePreset: 'modern', exportFormat: 'srt', autoSave: true, smartTiming: true, beatSnap: true, beatSnapWindow: 0.22, minLineDuration: 1.1, maxLineDuration: 5.0, readingSpeedCps: 14, qualityGate: 82 },
  spectrum: { enabled: true, model: 'Bar', analyzerMode: 'frequency', stylePreset: 'clean-wave', mirror: 'Off', position: 'Bawah', zoom: 100, crop: 0, y: 24, previewY: 74, height: 128, widthMode: 'full', marginX: 0, marginY: 34, transparency: 80, colors: ['white'], color1: 'white', color2: '#22c55e', glow: false, glowStrength: 35, progressBar: true, progressStyle: 'line', progressColor: 'white', nowPlaying: true, nowPlayingTemplate: '{title}', nowPlayingPosition: 'Atas', nowPlayingX: 50, nowPlayingY: 14, nowPlayingArtist: '', nowPlayingAlbum: '', nowPlayingAutoFromFile: true, beatReactive: true, beatSensitivity: 55, autoTune: true, smoothing: 45, gain: 1.0, analyzerQuality: 'balanced' },
  overlay: { enabled: true, timestamp: false, timestampText: 'Rendered by PidioForge', timestampPosition: 'Kiri Atas', songTransition: 'fade', particleFile: '', videoParticle: true, particleSpeed: 100, particleOpacity: 70, particleBlend: 'normal', overlayFile: '', overlayEnabled: false, overlayOpacity: 80, overlayScale: 100, overlayPosition: 'Tengah', overlayStart: 0, overlayEnd: 0, lowerThirdEnabled: false, lowerThirdText: '', lowerThirdPosition: 'Bawah', lowerThirdAt: 2, lowerThirdDuration: 5, playlist: true, playlistPosition: 'Kanan Bawah', glow: false, glowColor: '#22c55e', glowOpacity: 18, vignette: false, vignetteStrength: 0.35, filmGrain: false, grainStrength: 12, scanlines: false, scanlineOpacity: 6, frameBorder: false, borderColor: 'white', borderThickness: 6, letterbox: false, letterboxSize: 80, darken: false, darkenOpacity: 15, stylePreset: 'clean' },
  performance: { mode: 'balanced', liveMonitor: true, refreshMs: 1500, queueConcurrency: 1, ffmpegThreads: 0, x264Preset: 'medium', hardwareAccel: 'auto', thermalGuard: true, maxCpu: 85, maxMemory: 85, autoTune: true, previewQuality: 'normal', logLevel: 'normal', safeMode: false },
  preview: { enabled: true, duration: 4, startAt: 0, region: 'custom', quality: 'draft', width: 640, height: 360, fps: 18, safeAreaPreset: 'youtube', autoRefresh: false, showSafeArea: true, showGrid: false, outputFormat: 'mp4', lastUrl: '', lastOutput: '', lastSnapshotUrl: '', lastSnapshotOutput: '', lastGeneratedAt: '' },
};

export const socialPresets = [
  { id: 'preset-youtube-720', name: 'YouTube HD Ringan 720p', config: { target: { resolution: '1280x720', width: 1280, height: 720, bitrate: '4500k', quality: 'balanced', fps: 30 } } },
  { id: 'preset-youtube-1080', name: 'YouTube Full HD 1080p', config: { target: { resolution: '1920x1080', width: 1920, height: 1080, bitrate: '8000k', quality: 'high', fps: 30 } } },
  { id: 'preset-shorts', name: 'Shorts / TikTok / Reels', config: { target: { resolution: '1080x1920', width: 1080, height: 1920, bitrate: '7000k', quality: 'balanced', fps: 30 } } },
  { id: 'preset-square', name: 'Square Feed 1080x1080', config: { target: { resolution: '1080x1080', width: 1080, height: 1080, bitrate: '6000k', quality: 'balanced', fps: 30 } } },
  { id: 'preset-fast', name: 'Thumbnail / Preview Cepat', config: { target: { quality: 'fast', bitrate: '2500k', fps: 24 } } },
];

export const defaultState = {
  activeProjectId: 'default',
  projects: [{ id: 'default', name: 'Project Utama', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), config: defaultConfig }],
  presets: socialPresets.map(p => ({ ...p, config: deepMerge(defaultConfig, p.config) })),
  jobs: [],
  queue: { running: false, paused: false, concurrency: 1, autoStart: false, stopOnError: false, startedAt: '', finishedAt: '' },
  logs: ['GUI siap.'],
};
