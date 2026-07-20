import React, { useState } from 'react';
import { Field, Check, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { DragDropZone } from '../ui/DragDropZone';
import { cn } from '../../utils/cn';
import { humanSize } from '../../utils/media';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { detectTargetFormat } from '../../utils/format-presets';
import { showToast } from '../ui/Toast';
import { Callout, Card, StatRow } from '../ui/design-system-components';

type MediaFile = { path: string; name: string; size: number; type: string; modifiedAt?: string };
type MediaPair = { title: string; visual: string; audio: string; lyrics?: string; index?: number; outputName?: string; confidence?: number; pairReason?: string; lyricConfidence?: number; lyricReason?: string };

export function TargetPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [scan, setScan] = useState<{ files: MediaFile[]; pairs: MediaPair[]; summary?: any; diagnostics?: any }>({ files: [], pairs: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [advanced, setAdvanced] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const files = scan.files.filter(f => selectedType === 'all' || f.type === selectedType);
  const est = scan.summary?.estimate;
  async function inspectTarget() {
    setBusy(true); setMessage('Memindai folder bahan...');
    try {
      const data = await api('/api/target/inspect', { method: 'POST', body: JSON.stringify({ config, recursive: true, maxDepth: 4, validateMedia: true }) });
      setScan({ files: data.files || [], pairs: data.pairs || [], summary: data.summary, diagnostics: data.diagnostics });
      const encoderWarn = data.diagnostics?.ffmpeg ? '' : ' FFmpeg belum terdeteksi.';
      const msg = data.summary?.ready ? `Target siap render.${encoderWarn}` : `Perlu dilengkapi: ${(data.summary?.errors || []).join(' ')}${encoderWarn}`;
      setMessage(msg);
      
      if (!data.diagnostics?.ffmpeg) {
        showToast('error', 'FFmpeg tidak ditemukan! Install FFmpeg untuk melanjutkan.');
      } else if (data.summary?.ready) {
        showToast('success', 'Target siap untuk render!');
      } else if (data.summary?.errors?.length > 0) {
        showToast('warning', `Perlu dilengkapi: ${data.summary.errors.join(', ')}`);
      }
    } catch (e: any) { 
      setMessage(e.message);
      showToast('error', `Gagal memindai: ${e.message}`);
    }
    finally { setBusy(false); }
  }
  async function createBatch() {
    if (!hasVisual) {
      showToast('error', 'Pilih file visual terlebih dahulu!');
      return;
    }
    if (!hasAudio) {
      showToast('error', 'Pilih file audio terlebih dahulu!');
      return;
    }
    if (scan.pairs.length === 0) {
      showToast('warning', 'Tidak ada pasangan audio/visual. Jalankan Scan & Cek terlebih dahulu.');
      return;
    }
    
    setBusy(true); setMessage('Membuat batch...');
    try {
      const data = await api('/api/target/create-batch', { method: 'POST', body: JSON.stringify({ config, files: scan.files, pairs: scan.pairs }) });
      const count = data.created?.length || 0;
      setMessage(`${count} job berhasil dibuat dari pasangan audio/visual.`);
      showToast('success', `${count} job batch berhasil dibuat!`);
    } catch (e: any) { 
      setMessage(e.message);
      showToast('error', `Gagal membuat batch: ${e.message}`);
    }
    finally { setBusy(false); }
  }
  async function createStructure() {
    setBusy(true); setMessage('Membuat struktur folder...');
    try {
      const data = await api('/api/target/create-structure', { method: 'POST', body: JSON.stringify({ baseDir: getDeep(config, 'input.bahanFolder') }) });
      setMessage(`Struktur folder dibuat: ${data.dirs?.length || 0} folder.`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function autoTuneTarget() {
    setBusy(true); setMessage('Menyesuaikan target otomatis...');
    try {
      const data = await api('/api/target/auto-tune', { method: 'POST', body: JSON.stringify({ config, files: scan.files, pairs: scan.pairs }) });
      const t = data.patch?.target || {};
      Object.entries(t).forEach(([k, v]) => updateConfig(`target.${k}`, v));
      setMessage(`Auto Target Tune: ${data.reasons?.join(' - ') || 'selesai'}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function checkDiagnosticsOnly() {
    setBusy(true); setMessage('Memeriksa FFmpeg dan encoder...');
    try {
      const data = await api('/api/system/diagnostics');
      setScan(prev => ({ ...prev, diagnostics: data }));
      setMessage(data.ffmpeg ? `FFmpeg OK. Rekomendasi encoder: ${data.recommended}` : 'FFmpeg tidak ditemukan.');
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  const counts = scan.summary?.counts || { videos: 0, images: 0, audios: 0, lyrics: 0, total: 0 };
  const risk = scan.summary?.risk;
  const collisions = scan.summary?.collisions || [];
  const enc = scan.diagnostics?.encoders || {};
  const hasVisual = Boolean(getDeep(config, 'input.visual'));
  const hasAudio = Boolean(getDeep(config, 'input.audio'));
  const targetFormat = detectTargetFormat(config);
  return (
    <div className="space-y-4">
        {/* Workflow Progress */}
        <div className="flex items-center gap-2 text-[11px] font-semibold px-4 py-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-x-auto">
        {[
          { n: 1, label: 'Visual', done: hasVisual },
          { n: 2, label: 'Audio', done: hasAudio },
          { n: 3, label: 'Edit Preview', done: hasVisual },
          { n: 4, label: 'Render Preview', done: false },
          { n: 5, label: 'Queue', done: false },
        ].map(({ n, label, done }, i) => (
          <React.Fragment key={n}>
            {i > 0 && <span className="text-[var(--border-default)] mx-2">›</span>}
            <span className={cn(
              'whitespace-nowrap transition-colors duration-200',
              done ? 'text-[var(--accent-success)]' : 'text-[var(--text-muted)]'
            )}>{n}. {label}</span>
          </React.Fragment>
        ))}
        </div>

        {/* Input Utama */}
        <Card title="Input Utama">
          <Field label="File Visual"><PathInput value={getDeep(config, 'input.visual')} onChange={v => updateConfig('input.visual', v)} filter="visual" /></Field>
          
          {/* Drag & Drop for Visual */}
          <DragDropZone
            onFileDrop={(files) => {
              if (files[0]) {
                // Note: Browser File API doesn't expose full path for security
                // In Electron/Tauri, you'd use their file dialog APIs
                updateConfig('input.visual', files[0].name);
              }
            }}
            accept="video/*,image/*,.mp4,.mov,.avi,.mkv,.webm,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            multiple={false}
            maxSize={2000}
            className="mt-2"
          >
            <div className="flex flex-col items-center justify-center py-4 px-4 text-center">
              <svg className="w-8 h-8 mb-2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-[11px] text-[var(--text-muted)]">Drop video/image here</p>
            </div>
          </DragDropZone>
          
          <Field label="File Audio"><PathInput value={getDeep(config, 'input.audio')} onChange={v => updateConfig('input.audio', v)} filter="audio" /></Field>
          
          {/* Drag & Drop for Audio */}
          <DragDropZone
            onFileDrop={(files) => {
              if (files[0]) {
                // Note: Browser File API doesn't expose full path for security
                // In Electron/Tauri, you'd use their file dialog APIs
                updateConfig('input.audio', files[0].name);
              }
            }}
            accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma"
            multiple={false}
            maxSize={500}
            className="mt-2"
          >
            <div className="flex flex-col items-center justify-center py-4 px-4 text-center">
              <svg className="w-8 h-8 mb-2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p className="text-[11px] text-[var(--text-muted)]">Drop audio file here</p>
            </div>
          </DragDropZone>
          
          <Field label="Judul Default"><TextInput value={getDeep(config, 'input.title')} onChange={v => updateConfig('input.title', v)} placeholder="Judul video" /></Field>
          <Field label="Output Folder"><PathInput value={getDeep(config, 'input.output')} onChange={v => updateConfig('input.output', v)} placeholder="Hasil" kind="directory" /></Field>
        </Card>

        {/* Batch Folder */}
        <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <button
            onClick={() => setBatchOpen(!batchOpen)}
            className="w-full flex items-center justify-between text-[13px] font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors duration-200"
          >
            <span>Batch Folder</span>
            <span className="text-[var(--text-muted)]">{batchOpen ? '▲' : '▼'}</span>
          </button>
          {batchOpen && (
            <div className="mt-4 space-y-3">
              <Field label="Folder Utama"><PathInput value={getDeep(config, 'input.bahanFolder')} onChange={v => updateConfig('input.bahanFolder', v)} placeholder="D:/Bahan Video Musik" kind="directory" /></Field>
              <Field label="Folder Visual"><PathInput value={getDeep(config, 'input.visualFolder')} onChange={v => updateConfig('input.visualFolder', v)} placeholder="Opsional: folder video/gambar" kind="directory" /></Field>
              <Field label="Folder Audio"><PathInput value={getDeep(config, 'input.audioFolder')} onChange={v => updateConfig('input.audioFolder', v)} placeholder="Opsional: folder mp3/wav" kind="directory" /></Field>
              <Field label="Folder Lirik"><PathInput value={getDeep(config, 'input.lyricFolder')} onChange={v => updateConfig('input.lyricFolder', v)} placeholder="Opsional: folder .lrc/.srt" kind="directory" /></Field>
              <Field label="Pair Mode"><SelectInput value={getDeep(config, 'input.pairMode', 'by-name')} onChange={v => updateConfig('input.pairMode', v)}><option value="by-name">Nama/Fuzzy</option><option value="by-order">Urutan</option><option value="random-visual">Visual acak/audio</option><option value="one-audio-all-visual">1 audio semua visual</option></SelectInput></Field>
              <Field label="Ignore Words"><TextInput value={getDeep(config, 'input.ignoreWords', '')} onChange={v => updateConfig('input.ignoreWords', v)} /></Field>
              <Field label="Output Pattern"><TextInput value={getDeep(config, 'target.outputPattern', '{title}-{date}-{num}')} onChange={v => updateConfig('target.outputPattern', v)} /></Field>
              <Check label="Auto-pair berdasarkan nama/fuzzy" checked={Boolean(getDeep(config, 'input.autoPairByName', true))} onChange={v => updateConfig('input.autoPairByName', v)} />
              <Check label="Exclude folder output saat scan" checked={Boolean(getDeep(config, 'input.excludeOutputOnScan', true))} onChange={v => updateConfig('input.excludeOutputOnScan', v)} />
            </div>
          )}
        </div>

        {/* Platform Presets */}
        <Card title="Platform Presets">
          <Field label="Target Platform">
            <SelectInput value={getDeep(config, 'target.platform', 'custom')} onChange={v => {
              updateConfig('target.platform', v);
              if (v === 'youtube') {
                updateConfig('target.resolution', '1920x1080');
                updateConfig('target.fps', 30);
                updateConfig('target.bitrate', '8M');
                updateConfig('target.quality', 'high');
                updateConfig('target.faststart', true);
              }
              if (v === 'youtube-shorts') {
                updateConfig('target.resolution', '1080x1920');
                updateConfig('target.fps', 30);
                updateConfig('target.bitrate', '6M');
                updateConfig('target.quality', 'balanced');
              }
              if (v === 'tiktok') {
                updateConfig('target.resolution', '1080x1920');
                updateConfig('target.fps', 30);
                updateConfig('target.bitrate', '5M');
                updateConfig('target.quality', 'balanced');
              }
              if (v === 'instagram-feed') {
                updateConfig('target.resolution', '1080x1080');
                updateConfig('target.fps', 30);
                updateConfig('target.bitrate', '5M');
                updateConfig('target.quality', 'balanced');
              }
              if (v === 'instagram-reels') {
                updateConfig('target.resolution', '1080x1920');
                updateConfig('target.fps', 30);
                updateConfig('target.bitrate', '5M');
                updateConfig('target.quality', 'balanced');
              }
              if (v === 'facebook') {
                updateConfig('target.resolution', '1280x720');
                updateConfig('target.fps', 30);
                updateConfig('target.bitrate', '4M');
                updateConfig('target.quality', 'balanced');
              }
            }}>
              <option value="custom">Custom</option>
              <option value="youtube">YouTube (1080p Landscape)</option>
              <option value="youtube-shorts">YouTube Shorts (9:16)</option>
              <option value="tiktok">TikTok (9:16)</option>
              <option value="instagram-feed">Instagram Feed (1:1)</option>
              <option value="instagram-reels">Instagram Reels (9:16)</option>
              <option value="facebook">Facebook (720p)</option>
            </SelectInput>
          </Field>
          <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2">Platform Specs:</h4>
            <ul className="space-y-1.5 text-[10px] text-[var(--text-muted)]">
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">YouTube: 1080p, 30fps, 8Mbps, High Quality</li>
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">Shorts/TikTok: 1080x1920, 30fps, 5-6Mbps</li>
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">Instagram: 1080x1080 (Feed) or 1080x1920 (Reels)</li>
              <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">Facebook: 720p, 30fps, 4Mbps</li>
            </ul>
          </div>
          <Check label="Auto-optimize for selected platform" checked={Boolean(getDeep(config, 'target.autoOptimize', true))} onChange={v => updateConfig('target.autoOptimize', v)} />
        </Card>

        {/* Pengaturan Render */}
        <Card title="Pengaturan Render">
          <Field label="Resolusi"><SelectInput value={getDeep(config, 'target.resolution', '1280x720')} onChange={v => { const [w, h] = v.split('x').map(Number); updateConfig('target.resolution', v); updateConfig('target.width', w); updateConfig('target.height', h); }}><option>1280x720</option><option>1920x1080</option><option>1080x1920</option><option>1080x1080</option></SelectInput></Field>
          <Field label="FPS"><TextInput type="number" value={getDeep(config, 'target.fps', 30)} onChange={v => updateConfig('target.fps', v)} /></Field>
          <Field label="Bitrate"><TextInput value={getDeep(config, 'target.bitrate')} onChange={v => updateConfig('target.bitrate', v)} /></Field>
          <Field label="Codec"><SelectInput value={getDeep(config, 'target.videoCodec', 'h264')} onChange={v => updateConfig('target.videoCodec', v)}><option value="h264">H.264 (Universal)</option><option value="h265">H.265/HEVC (Smaller)</option><option value="vp9">VP9 (Web)</option><option value="av1">AV1 (Future)</option></SelectInput></Field>
          <div className="flex items-center gap-3 px-3 py-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[11px]">
            <span className="font-semibold text-[var(--text-primary)]">Format:</span>
            <span className="text-[var(--accent-primary)]">{targetFormat === 'vertical' ? '9:16 Vertical' : targetFormat === 'square' ? '1:1 Square' : '16:9 Landscape'}</span>
            <span className="text-[var(--text-muted)]">Preset Spectrum/Overlay mengikuti format ini.</span>
          </div>
          <button
            onClick={() => setAdvanced(!advanced)}
            className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-colors duration-200"
          >
            <span>Advanced Settings</span>
            <span className="text-[var(--text-muted)]">{advanced ? '▲' : '▼'}</span>
          </button>
          {advanced && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-3">
              <Field label="Mode Video"><SelectInput value={getDeep(config, 'target.modeVideo')} onChange={v => updateConfig('target.modeVideo', v)}><option>Video/Gambar tetap</option><option>Visual berulang</option><option>Visual acak</option></SelectInput></Field>
              <Field label="Render"><SelectInput value={getDeep(config, 'target.modeRender')} onChange={v => updateConfig('target.modeRender', v)}><option>FFmpeg</option><option>GPU otomatis</option><option>CPU aman</option></SelectInput></Field>
              <Field label="Hardware"><SelectInput value={getDeep(config, 'target.hardwareAccel', 'auto')} onChange={v => updateConfig('target.hardwareAccel', v)}><option>auto</option><option>cpu</option><option>nvidia</option><option>intel</option><option>amd</option></SelectInput></Field>
              <Field label="Durasi Target"><TextInput type="number" value={getDeep(config, 'target.duration', 0)} onChange={v => updateConfig('target.duration', v)} /></Field>
              <Field label="Max Zoom"><TextInput type="number" value={getDeep(config, 'target.maxZoom', 110)} onChange={v => updateConfig('target.maxZoom', v)} /></Field>
              <Field label="Speed"><TextInput type="number" value={getDeep(config, 'target.speed', 100)} onChange={v => updateConfig('target.speed', v)} /></Field>
              <Field label="Mutu"><SelectInput value={getDeep(config, 'target.quality', 'balanced')} onChange={v => updateConfig('target.quality', v)}><option value="fast">Pratinjau Cepat</option><option value="balanced">Seimbang</option><option value="high">Kualitas Tinggi</option></SelectInput></Field>
              <Check label="Timpa output lama jika nama sama" checked={Boolean(getDeep(config, 'target.overwrite', false))} onChange={v => updateConfig('target.overwrite', v)} />
              <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
                <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Encoding Profiles</h4>
                <Field label="Audio Codec"><SelectInput value={getDeep(config, 'target.audioCodec', 'aac')} onChange={v => updateConfig('target.audioCodec', v)}><option value="aac">AAC (Universal)</option><option value="mp3">MP3 (Compatible)</option><option value="opus">Opus (Efficient)</option><option value="vorbis">Vorbis (Open)</option></SelectInput></Field>
                <Field label="Container"><SelectInput value={getDeep(config, 'target.container', 'mp4')} onChange={v => updateConfig('target.container', v)}><option value="mp4">MP4</option><option value="mkv">MKV</option><option value="webm">WebM</option><option value="mov">MOV</option></SelectInput></Field>
                <Field label="Encoding Preset"><SelectInput value={getDeep(config, 'target.encodingPreset', 'medium')} onChange={v => updateConfig('target.encodingPreset', v)}><option value="ultrafast">Ultrafast (Low Quality)</option><option value="superfast">Superfast</option><option value="veryfast">Very Fast</option><option value="faster">Faster</option><option value="fast">Fast</option><option value="medium">Medium (Balanced)</option><option value="slow">Slow (Better)</option><option value="slower">Slower</option><option value="veryslow">Very Slow (Best)</option></SelectInput></Field>
                <Field label="Tune"><SelectInput value={getDeep(config, 'target.tune', 'none')} onChange={v => updateConfig('target.tune', v)}><option value="none">None</option><option value="film">Film</option><option value="animation">Animation</option><option value="grain">Grain</option><option value="stillimage">Still Image</option><option value="fastdecode">Fast Decode</option></SelectInput></Field>
              </div>
              <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
                <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Quality Presets</h4>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { updateConfig('target.quality', 'fast'); updateConfig('target.crf', 28); updateConfig('target.encodingPreset', 'veryfast'); updateConfig('target.bitrate', '2M'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">🚀 Draft (Fast)</button>
                  <button onClick={() => { updateConfig('target.quality', 'balanced'); updateConfig('target.crf', 23); updateConfig('target.encodingPreset', 'medium'); updateConfig('target.bitrate', '5M'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">⚖️ Balanced</button>
                  <button onClick={() => { updateConfig('target.quality', 'high'); updateConfig('target.crf', 18); updateConfig('target.encodingPreset', 'slow'); updateConfig('target.bitrate', '8M'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">💎 High Quality</button>
                  <button onClick={() => { updateConfig('target.quality', 'archive'); updateConfig('target.crf', 15); updateConfig('target.encodingPreset', 'veryslow'); updateConfig('target.bitrate', '12M'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">📦 Archive</button>
                </div>
              </div>
              <Field label="CRF"><TextInput type="number" value={getDeep(config, 'target.crf', 22)} onChange={v => updateConfig('target.crf', v)} /></Field>
              <Field label="Pixel Format"><SelectInput value={getDeep(config, 'target.pixelFormat', 'yuv420p')} onChange={v => updateConfig('target.pixelFormat', v)}><option>yuv420p</option><option>yuv444p</option></SelectInput></Field>
              <Field label="Audio Bitrate"><TextInput value={getDeep(config, 'audio.audioBitrate', '192k')} onChange={v => updateConfig('audio.audioBitrate', v)} /></Field>
              <Check label="Faststart MP4 untuk upload web" checked={Boolean(getDeep(config, 'target.faststart', true))} onChange={v => updateConfig('target.faststart', v)} />
            </div>
          )}
        </Card>

        {advanced && (
          <>
            {/* Smart Optimization */}
            <Card title="Smart Optimization">
              <Check label="Enable Smart Optimization" checked={Boolean(getDeep(config, 'target.smartOptimization.enabled', false))} onChange={v => updateConfig('target.smartOptimization.enabled', v)} />
              <Field label="Optimization Level"><SelectInput value={getDeep(config, 'target.smartOptimization.level', 'balanced')} onChange={v => updateConfig('target.smartOptimization.level', v)}><option value="minimal">Minimal</option><option value="balanced">Balanced</option><option value="aggressive">Aggressive</option></SelectInput></Field>
              <Field label="Target File Size"><TextInput type="number" value={getDeep(config, 'target.smartOptimization.targetSizeMB', 0)} onChange={v => updateConfig('target.smartOptimization.targetSizeMB', v)} placeholder="0 = auto" /></Field>
              <Field label="Max Duration"><TextInput type="number" value={getDeep(config, 'target.smartOptimization.maxDuration', 0)} onChange={v => updateConfig('target.smartOptimization.maxDuration', v)} placeholder="0 = no limit" /></Field>
              <Check label="Auto-adjust bitrate for file size" checked={Boolean(getDeep(config, 'target.smartOptimization.autoBitrate', true))} onChange={v => updateConfig('target.smartOptimization.autoBitrate', v)} />
              <Check label="Two-pass encoding for better quality" checked={Boolean(getDeep(config, 'target.smartOptimization.twoPass', false))} onChange={v => updateConfig('target.smartOptimization.twoPass', v)} />
              <Check label="Auto-detect scene changes" checked={Boolean(getDeep(config, 'target.smartOptimization.sceneDetect', true))} onChange={v => updateConfig('target.smartOptimization.sceneDetect', v)} />
              <Callout type="tip">
                Smart Optimization otomatis menyesuaikan encoding settings berdasarkan konten video untuk hasil optimal.
              </Callout>
            </Card>

            {/* Batch Processing Options */}
            <Card title="Batch Processing Options">
              <Field label="Parallel Jobs"><TextInput type="number" value={getDeep(config, 'target.batch.parallelJobs', 1)} onChange={v => updateConfig('target.batch.parallelJobs', v)} placeholder="1-8" /></Field>
              <Field label="Priority"><SelectInput value={getDeep(config, 'target.batch.priority', 'normal')} onChange={v => updateConfig('target.batch.priority', v)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></SelectInput></Field>
              <Field label="On Error"><SelectInput value={getDeep(config, 'target.batch.onError', 'continue')} onChange={v => updateConfig('target.batch.onError', v)}><option value="continue">Continue</option><option value="pause">Pause</option><option value="stop">Stop All</option></SelectInput></Field>
              <Check label="Auto-retry failed jobs" checked={Boolean(getDeep(config, 'target.batch.autoRetry', true))} onChange={v => updateConfig('target.batch.autoRetry', v)} />
              <Check label="Send notification on completion" checked={Boolean(getDeep(config, 'target.batch.notify', false))} onChange={v => updateConfig('target.batch.notify', v)} />
              <Check label="Auto-organize output by date" checked={Boolean(getDeep(config, 'target.batch.organizeByDate', false))} onChange={v => updateConfig('target.batch.organizeByDate', v)} />
            </Card>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <button
            onClick={inspectTarget}
            disabled={busy}
            className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
          >
            Scan & Cek
          </button>
          <button
            onClick={createBatch}
            disabled={busy || !scan.pairs.length}
            className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-success)] hover:bg-[var(--accent-success)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
          >
            Buat Batch
          </button>
          <button
            onClick={autoTuneTarget}
            disabled={busy || !scan.files.length}
            className="px-4 py-2 text-[12px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
          >
            Auto Tune
          </button>
          <button
            onClick={checkDiagnosticsOnly}
            disabled={busy}
            className="px-4 py-2 text-[12px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
          >
            Cek FFmpeg
          </button>
          <button
            onClick={createStructure}
            disabled={busy}
            className="px-4 py-2 text-[12px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
          >
            Buat Folder
          </button>
          {message && (
            <span className={cn('text-[11px] ml-auto font-medium', scan.summary?.ready ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]')}>{message}</span>
          )}
        </div>

        {/* Diagnostics */}
        {scan.diagnostics && (
          <StatRow
            stats={[
              { label: 'FFmpeg', value: scan.diagnostics.ffmpeg ? 'OK' : 'Tidak ada', accent: scan.diagnostics.ffmpeg },
              { label: 'Rekomendasi', value: scan.diagnostics.recommended || '-', accent: true },
              { label: 'CPU/libx264', value: enc.libx264 ? 'OK' : '-' },
              { label: 'NVIDIA', value: enc.h264_nvenc ? 'OK' : '-' },
              { label: 'Intel', value: enc.h264_qsv ? 'OK' : '-' },
              { label: 'AMD', value: enc.h264_amf ? 'OK' : '-' },
            ]}
          />
        )}

        {/* Summary stats */}
        {!!scan.summary && (
          <StatRow
            stats={[
              { label: 'Total file', value: counts.total },
              { label: 'Video', value: counts.videos },
              { label: 'Gambar', value: counts.images },
              { label: 'Audio', value: counts.audios },
              { label: 'Lirik', value: counts.lyrics },
              { label: 'Target', value: scan.summary.resolution || '-' },
            ]}
          />
        )}

        {/* Risk cards */}
        {risk && (
          <StatRow
            stats={[
              { label: 'Risk Score', value: risk.score, accent: true },
              { label: 'Pair rendah', value: risk.lowConfidencePairs },
              { label: 'Collision', value: risk.collisionCount },
              { label: 'File risk', value: risk.invalidFiles },
              { label: 'Tanpa lirik', value: risk.noLyrics },
            ]}
          />
        )}

        {/* Estimate */}
        {est && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-[11px]">
            <span className="font-semibold text-[var(--text-primary)]">Estimasi:</span>
            <span className="text-[var(--accent-primary)]">{est.jobs} job</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-primary)]">±{est.estimatedSizeMB} MB</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-primary)]">±{est.estimatedTotalDuration}s</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-primary)]">{est.resolution}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-primary)]">{est.bitrate}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-primary)]">encoder {est.encoder}</span>
          </div>
        )}

        {/* Warnings */}
        {!!scan.summary?.warnings?.length && (
          <div className="p-4 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
            <h4 className="text-[12px] font-bold text-[var(--accent-warning)] mb-3">⚠ Catatan pemeriksaan:</h4>
            <ul className="space-y-2">
              {scan.summary.warnings.slice(0, 12).map((warning: string, i: number) => (
                <li key={i} className="text-[11px] text-[var(--text-primary)] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Collision box */}
        {!!collisions.filter((c: any) => c.status !== 'safe').length && (
          <div className="p-4 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-danger)] rounded-[var(--radius-lg)]">
            <h4 className="text-[12px] font-bold text-[var(--accent-danger)] mb-3">⚠ Output collision:</h4>
            <ul className="space-y-2">
              {collisions.filter((c: any) => c.status !== 'safe').slice(0, 8).map((c: any, i: number) => (
                <li key={i} className="text-[11px] text-[var(--text-primary)] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-danger)]">
                  <span className="font-semibold text-[var(--accent-danger)]">{c.status}:</span> {c.requested} → {c.finalPath}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pairs list */}
        {!!scan.pairs.length && (
          <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <h3 className="text-[13px] font-bold text-[var(--text-primary)]">Pasangan Batch Otomatis</h3>
            <div className="space-y-2">
              {scan.pairs.slice(0, 12).map((p, i) => (
                <div key={`${p.audio}-${i}`} className={cn(
                  'rounded-[var(--radius-md)] px-3 py-2.5 border text-[11px] leading-relaxed space-y-1.5 transition-all duration-200 hover:border-[var(--accent-primary)]/50',
                  Number(p.confidence || 0) < 60
                    ? 'bg-[var(--tertiary-bg)] border-[var(--accent-warning)]/30'
                    : 'bg-[var(--tertiary-bg)] border-[var(--border-subtle)]'
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">{p.title}</span>
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      Number(p.confidence || 0) >= 80 ? 'bg-[var(--accent-success)]/20 text-[var(--accent-success)]' :
                      Number(p.confidence || 0) >= 60 ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
                      'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]'
                    )}>
                      {p.confidence ?? '-'}%
                    </span>
                  </div>
                  <div className="text-[var(--text-muted)]">
                    <span className="font-semibold">Alasan:</span> {p.pairReason || '-'}
                  </div>
                  <div className="text-[var(--text-muted)]">
                    <span className="font-semibold">Visual:</span> {p.visual || '-'}
                  </div>
                  <div className="text-[var(--text-muted)]">
                    <span className="font-semibold">Audio:</span> {p.audio}
                  </div>
                  <div className="text-[var(--text-muted)]">
                    <span className="font-semibold">Lirik:</span> {p.lyrics || '-'}{p.lyricReason ? ` (${p.lyricReason})` : ''}
                  </div>
                  <div className="text-[var(--text-muted)]">
                    <span className="font-semibold">Output:</span> {p.outputName || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File list */}
        {!!scan.files.length && (
          <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <h3 className="text-[13px] font-bold text-[var(--text-primary)]">File Terdeteksi</h3>
            <div className="flex gap-2 flex-wrap">
              {['all', 'video', 'image', 'audio', 'lyrics'].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    'px-3 py-1.5 text-[11px] font-semibold rounded-[var(--radius-md)] transition-all duration-200',
                    selectedType === t
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--tertiary-bg)] text-[var(--text-primary)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)]'
                  )}
                >
                  {t === 'all' ? 'Semua' : t === 'image' ? 'Gambar' : t === 'lyrics' ? 'Lirik' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              {files.slice(0, 80).map(f => (
                <div key={f.path} className={cn(
                  'grid grid-cols-[48px_minmax(0,1fr)_64px_minmax(0,96px)] gap-3 items-center px-3 py-2 rounded-[var(--radius-md)] text-[11px] transition-all duration-200 hover:bg-[var(--tertiary-bg)]',
                  (f as any).health?.level === 'risk' ? 'bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30' : 
                  (f as any).health?.level === 'warn' ? 'bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/30' : 
                  'bg-[var(--tertiary-bg)] border border-[var(--border-subtle)]'
                )}>
                  <span className="text-[var(--text-muted)] truncate uppercase text-[10px] font-semibold">{f.type}</span>
                  <span className="text-[var(--text-primary)] truncate font-medium" title={f.path}>{f.name}</span>
                  <span className="text-[var(--text-muted)] text-right">{humanSize(f.size)}</span>
                  <span className="text-[var(--text-muted)] truncate text-right">
                    {(f as any).duration ? `${Math.round((f as any).duration)}s` : ((f as any).warnings || []).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
