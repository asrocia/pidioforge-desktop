import React, { useState } from 'react';
import { PanelWrap, Group, Grid3, ActionBar, ActionBtn, InfoBar, WarnBox, StatRow } from '../ui/panel-primitives';
import { Field, Check, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { humanSize } from '../../utils/media';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { detectTargetFormat } from '../../utils/format-presets';

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
      setMessage(data.summary?.ready ? `Target siap render.${encoderWarn}` : `Perlu dilengkapi: ${(data.summary?.errors || []).join(' ')}${encoderWarn}`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function createBatch() {
    setBusy(true); setMessage('Membuat batch...');
    try {
      const data = await api('/api/target/create-batch', { method: 'POST', body: JSON.stringify({ config, files: scan.files, pairs: scan.pairs }) });
      setMessage(`${data.created?.length || 0} job berhasil dibuat dari pasangan audio/visual.`);
    } catch (e: any) { setMessage(e.message); }
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
    <PanelWrap>
      {/* Workflow strip */}
      <div className="flex items-center gap-0 text-[9.5px] font-semibold px-3 py-1.5 bg-[#080d14] border-b border-[rgba(142,162,184,0.18)] overflow-x-auto">
        {[
          { n: 1, label: 'Visual', done: hasVisual },
          { n: 2, label: 'Audio', done: hasAudio },
          { n: 3, label: 'Edit Preview', done: hasVisual },
          { n: 4, label: 'Render Preview', done: false },
          { n: 5, label: 'Queue', done: false },
        ].map(({ n, label, done }, i) => (
          <React.Fragment key={n}>
            {i > 0 && <span className="text-[#2a3545] mx-1">›</span>}
            <span className={cn(
              'whitespace-nowrap',
              done ? 'text-[#2dbb7f]' : 'text-[#8da0af]'
            )}>{n} {label}</span>
          </React.Fragment>
        ))}
      </div>

      {/* Input Utama */}
      <Group title="Input Utama">
        <Field label="File Visual"><PathInput value={getDeep(config, 'input.visual')} onChange={v => updateConfig('input.visual', v)} filter="visual" /></Field>
        <Field label="File Audio"><PathInput value={getDeep(config, 'input.audio')} onChange={v => updateConfig('input.audio', v)} filter="audio" /></Field>
        <Field label="Judul Default"><TextInput value={getDeep(config, 'input.title')} onChange={v => updateConfig('input.title', v)} placeholder="Judul video" /></Field>
        <Field label="Output Folder"><PathInput value={getDeep(config, 'input.output')} onChange={v => updateConfig('input.output', v)} placeholder="Hasil" kind="directory" /></Field>
      </Group>

      {/* Batch Folder */}
      <div className="border-b border-[rgba(142,162,184,0.10)]">
        <ActionBtn variant="wide" onClick={() => setBatchOpen(!batchOpen)}>
          {batchOpen ? '▲ Sembunyikan Batch' : '▼ Tampilkan Batch'}
        </ActionBtn>
        {batchOpen && (
          <div className="px-3 pb-2.5 pt-1 flex flex-col gap-0.5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8da0af] mb-2">Batch Folder</h3>
            <Field label="Folder Utama"><PathInput value={getDeep(config, 'input.bahanFolder')} onChange={v => updateConfig('input.bahanFolder', v)} placeholder="D:/Bahan Video Musik" kind="directory" /></Field>
            <Field label="Folder Visual"><PathInput value={getDeep(config, 'input.visualFolder')} onChange={v => updateConfig('input.visualFolder', v)} placeholder="Opsional: folder video/gambar" kind="directory" /></Field>
            <Field label="Folder Audio"><PathInput value={getDeep(config, 'input.audioFolder')} onChange={v => updateConfig('input.audioFolder', v)} placeholder="Opsional: folder mp3/wav" kind="directory" /></Field>
            <Field label="Folder Lirik"><PathInput value={getDeep(config, 'input.lyricFolder')} onChange={v => updateConfig('input.lyricFolder', v)} placeholder="Opsional: folder .lrc/.srt" kind="directory" /></Field>
            <Grid3>
              <Field label="Pair Mode"><SelectInput value={getDeep(config, 'input.pairMode', 'by-name')} onChange={v => updateConfig('input.pairMode', v)}><option value="by-name">Nama/Fuzzy</option><option value="by-order">Urutan</option><option value="random-visual">Visual acak/audio</option><option value="one-audio-all-visual">1 audio semua visual</option></SelectInput></Field>
              <Field label="Ignore Words"><TextInput value={getDeep(config, 'input.ignoreWords', '')} onChange={v => updateConfig('input.ignoreWords', v)} /></Field>
              <Field label="Output Pattern"><TextInput value={getDeep(config, 'target.outputPattern', '{title}-{date}-{num}')} onChange={v => updateConfig('target.outputPattern', v)} /></Field>
            </Grid3>
            <Check label="Auto-pair berdasarkan nama/fuzzy" checked={Boolean(getDeep(config, 'input.autoPairByName', true))} onChange={v => updateConfig('input.autoPairByName', v)} />
            <Check label="Exclude folder output saat scan" checked={Boolean(getDeep(config, 'input.excludeOutputOnScan', true))} onChange={v => updateConfig('input.excludeOutputOnScan', v)} />
          </div>
        )}
      </div>

      {/* Pengaturan Render */}
      <Group title="Pengaturan Render">
        <Grid3>
          <Field label="Mode Video"><SelectInput value={getDeep(config, 'target.modeVideo')} onChange={v => updateConfig('target.modeVideo', v)}><option>Video/Gambar tetap</option><option>Visual berulang</option><option>Visual acak</option></SelectInput></Field>
          <Field label="Render"><SelectInput value={getDeep(config, 'target.modeRender')} onChange={v => updateConfig('target.modeRender', v)}><option>FFmpeg</option><option>GPU otomatis</option><option>CPU aman</option></SelectInput></Field>
          <Field label="Hardware"><SelectInput value={getDeep(config, 'target.hardwareAccel', 'auto')} onChange={v => updateConfig('target.hardwareAccel', v)}><option>auto</option><option>cpu</option><option>nvidia</option><option>intel</option><option>amd</option></SelectInput></Field>
        </Grid3>
        <Grid3>
          <Field label="Resolusi"><SelectInput value={getDeep(config, 'target.resolution', '1280x720')} onChange={v => { const [w, h] = v.split('x').map(Number); updateConfig('target.resolution', v); updateConfig('target.width', w); updateConfig('target.height', h); }}><option>1280x720</option><option>1920x1080</option><option>1080x1920</option><option>1080x1080</option></SelectInput></Field>
          <Field label="FPS"><TextInput type="number" value={getDeep(config, 'target.fps', 30)} onChange={v => updateConfig('target.fps', v)} /></Field>
          <Field label="Bitrate"><TextInput value={getDeep(config, 'target.bitrate')} onChange={v => updateConfig('target.bitrate', v)} /></Field>
        </Grid3>
        <InfoBar>
          <b>Format:</b> {targetFormat === 'vertical' ? '9:16 Vertical' : targetFormat === 'square' ? '1:1 Square' : '16:9 Landscape'}
          <span className="text-[#8da0af]/60">Preset Spectrum/Overlay mengikuti format ini.</span>
        </InfoBar>
        <Grid3>
          <Field label="Durasi Target"><TextInput type="number" value={getDeep(config, 'target.duration', 0)} onChange={v => updateConfig('target.duration', v)} /></Field>
          <Field label="Max Zoom"><TextInput type="number" value={getDeep(config, 'target.maxZoom', 110)} onChange={v => updateConfig('target.maxZoom', v)} /></Field>
          <Field label="Speed"><TextInput type="number" value={getDeep(config, 'target.speed', 100)} onChange={v => updateConfig('target.speed', v)} /></Field>
        </Grid3>
        <Field label="Mutu"><SelectInput value={getDeep(config, 'target.quality', 'balanced')} onChange={v => updateConfig('target.quality', v)}><option value="fast">Pratinjau Cepat</option><option value="balanced">Seimbang</option><option value="high">Kualitas Tinggi</option></SelectInput></Field>
        <Check label="Timpa output lama jika nama sama" checked={Boolean(getDeep(config, 'target.overwrite', false))} onChange={v => updateConfig('target.overwrite', v)} />
        <ActionBtn variant="wide" onClick={() => setAdvanced(!advanced)}>{advanced ? '▲ Sembunyikan Lanjutan' : '▼ Tampilkan Lanjutan'}</ActionBtn>
        {advanced && (
          <div className="mt-1 pt-1 border-t border-[rgba(142,162,184,0.10)] flex flex-col gap-0.5">
            <Grid3>
              <Field label="CRF"><TextInput type="number" value={getDeep(config, 'target.crf', 22)} onChange={v => updateConfig('target.crf', v)} /></Field>
              <Field label="Pixel Format"><SelectInput value={getDeep(config, 'target.pixelFormat', 'yuv420p')} onChange={v => updateConfig('target.pixelFormat', v)}><option>yuv420p</option><option>yuv444p</option></SelectInput></Field>
              <Field label="Audio Bitrate"><TextInput value={getDeep(config, 'audio.audioBitrate', '192k')} onChange={v => updateConfig('audio.audioBitrate', v)} /></Field>
            </Grid3>
            <Check label="Faststart MP4 untuk upload web" checked={Boolean(getDeep(config, 'target.faststart', true))} onChange={v => updateConfig('target.faststart', v)} />
          </div>
        )}
      </Group>

      {/* Actions */}
      <ActionBar>
        <ActionBtn onClick={inspectTarget} disabled={busy}>Scan & Cek</ActionBtn>
        <ActionBtn onClick={createBatch} disabled={busy || !scan.pairs.length}>Buat Batch</ActionBtn>
        <ActionBtn onClick={autoTuneTarget} disabled={busy || !scan.files.length}>Auto Tune</ActionBtn>
        <ActionBtn onClick={checkDiagnosticsOnly} disabled={busy}>Cek FFmpeg</ActionBtn>
        <ActionBtn onClick={createStructure} disabled={busy}>Buat Folder</ActionBtn>
        {message && (
          <span className={cn('text-[10px] ml-auto', scan.summary?.ready ? 'text-[#2dbb7f]' : 'text-[#e76d78]')}>{message}</span>
        )}
      </ActionBar>

      {/* Diagnostics */}
      {scan.diagnostics && (
        <InfoBar>
          <b>FFmpeg:</b> {scan.diagnostics.ffmpeg ? 'OK' : 'Tidak ada'}
          <b>Rekomendasi:</b> {scan.diagnostics.recommended || '-'}
          <span>CPU/libx264: {enc.libx264 ? 'OK' : '-'}</span>
          <span>NVIDIA: {enc.h264_nvenc ? 'OK' : '-'}</span>
          <span>Intel: {enc.h264_qsv ? 'OK' : '-'}</span>
          <span>AMD: {enc.h264_amf ? 'OK' : '-'}</span>
        </InfoBar>
      )}

      {/* Summary stats */}
      {!!scan.summary && (
        <StatRow items={[
          { label: 'Total file', value: counts.total },
          { label: 'Video', value: counts.videos },
          { label: 'Gambar', value: counts.images },
          { label: 'Audio', value: counts.audios },
          { label: 'Lirik', value: counts.lyrics },
          { label: 'Target', value: scan.summary.resolution || '-' },
        ]} />
      )}

      {/* Risk cards */}
      {risk && (
        <StatRow items={[
          { label: 'Risk Score', value: risk.score, accent: true },
          { label: 'Pair rendah', value: risk.lowConfidencePairs },
          { label: 'Collision', value: risk.collisionCount },
          { label: 'File risk', value: risk.invalidFiles },
          { label: 'Tanpa lirik', value: risk.noLyrics },
        ]} />
      )}

      {/* Estimate */}
      {est && (
        <InfoBar>
          <b>Estimasi:</b> {est.jobs} job • ±{est.estimatedSizeMB} MB • ±{est.estimatedTotalDuration}s • {est.resolution} • {est.bitrate} • encoder {est.encoder}
        </InfoBar>
      )}

      {/* Warnings */}
      {!!scan.summary?.warnings?.length && (
        <WarnBox title="Catatan pemeriksaan:" items={scan.summary.warnings.slice(0, 12)} />
      )}

      {/* Collision box */}
      {!!collisions.filter((c: any) => c.status !== 'safe').length && (
        <WarnBox title="Output collision:" items={collisions.filter((c: any) => c.status !== 'safe').slice(0, 8).map((c: any) => `${c.status}: ${c.requested} -> ${c.finalPath}`)} />
      )}

      {/* Pairs list */}
      {!!scan.pairs.length && (
        <Group title="Pasangan Batch Otomatis">
          <div className="flex flex-col gap-1.5">
            {scan.pairs.slice(0, 12).map((p, i) => (
              <div key={`${p.audio}-${i}`} className={cn(
                'rounded-[6px] px-2 py-1.5 border text-[10px] leading-snug flex flex-col gap-0.5',
                Number(p.confidence || 0) < 60
                  ? 'bg-[#1a1509] border-[#d9a65f]/30'
                  : 'bg-[#0f1820] border-[rgba(142,162,184,0.15)]'
              )}>
                <b className="text-[#dce8ef]">{p.title} <em className="text-[#8da0af] font-normal">{p.confidence ?? '-'}%</em></b>
                <small className="text-[#8da0af]">Alasan: {p.pairReason || '-'}</small>
                <small className="text-[#8da0af]">Visual: {p.visual || '-'}</small>
                <small className="text-[#8da0af]">Audio: {p.audio}</small>
                <small className="text-[#8da0af]">Lirik: {p.lyrics || '-'}{p.lyricReason ? ` (${p.lyricReason})` : ''}</small>
                <small className="text-[#8da0af]">Output: {p.outputName || '-'}</small>
              </div>
            ))}
          </div>
        </Group>
      )}

      {/* File list */}
      {!!scan.files.length && (
        <Group title="File Terdeteksi">
          <div className="flex gap-1 mb-2 flex-wrap">
            {['all', 'video', 'image', 'audio', 'lyrics'].map(t => (
              <ActionBtn key={t} variant={selectedType === t ? 'primary' : 'ghost'} onClick={() => setSelectedType(t)}>
                {t === 'all' ? 'Semua' : t === 'image' ? 'Gambar' : t === 'lyrics' ? 'Lirik' : t.charAt(0).toUpperCase() + t.slice(1)}
              </ActionBtn>
            ))}
          </div>
          <div className="flex flex-col gap-0.5">
            {files.slice(0, 80).map(f => (
              <div key={f.path} className={cn(
                'grid grid-cols-[36px_minmax(0,1fr)_48px_minmax(0,80px)] gap-1.5 items-center px-1.5 py-1 rounded-[4px] text-[10px]',
                (f as any).health?.level === 'risk' ? 'bg-[#1a0f11]' : (f as any).health?.level === 'warn' ? 'bg-[#1a1509]' : 'bg-[#0f1820]'
              )}>
                <span className="text-[#8da0af] truncate">{f.type}</span>
                <b className="text-[#dce8ef] truncate" title={f.path}>{f.name}</b>
                <em className="text-[#8da0af] text-right">{humanSize(f.size)}</em>
                <small className="text-[#8da0af] truncate">{(f as any).duration ? `${Math.round((f as any).duration)}s` : ((f as any).warnings || []).join(', ')}</small>
              </div>
            ))}
          </div>
        </Group>
      )}
    </PanelWrap>
  );
}
