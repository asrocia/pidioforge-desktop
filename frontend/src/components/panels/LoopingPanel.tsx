import React, { useEffect, useState } from 'react';
import { Field, Check, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { fileUrl, copyText } from '../../utils/media';
import { API_BASE_URL, api } from '../../lib/api';
import { getDeep, setDeep } from '../../lib/config-path';
import { cleanUiText, formatBytes, formatDuration } from '../../lib/format';

const API = API_BASE_URL;

export function LoopingPanel({ config, updateConfig }: { config: any; updateConfig: (path: string, value: any) => void }) {
  const [input, setInput] = useState(getDeep(config, 'input.visual', ''));
  const [duration, setDuration] = useState(Number(getDeep(config, 'target.duration', 60)) || 60);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('copy');
  const [loopStyle, setLoopStyle] = useState('normal');
  const [crossfade, setCrossfade] = useState(0.5);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [muteAudio, setMuteAudio] = useState(false);
  const [audioFade, setAudioFade] = useState(false);
  const [preset, setPreset] = useState('source');
  const [batchText, setBatchText] = useState('');
  const [batchOutput, setBatchOutput] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [seamPreview, setSeamPreview] = useState<any>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [loopJob, setLoopJob] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const resultUrl = result?.url ? `${API}${result.url}` : '';
  const seamUrl = seamPreview?.url ? `${API}${seamPreview.url}` : '';
  const loopPayload = { input, duration, output, mode, loopStyle, crossfade, trimStart, trimEnd, muteAudio, audioFade, preset };
  
  useEffect(() => {
    if (!loopJob?.id || !['running'].includes(loopJob.status)) return;
    const timer = setInterval(async () => {
      const data = await api(`/api/loop/status?id=${encodeURIComponent(loopJob.id)}`).catch(() => null);
      if (data) {
        setLoopJob(data);
        if (data.status === 'done') {
          setResult(data);
          setMessage(`Loop selesai: ${data.duration}s / ${formatBytes(data.size)}.`);
        }
        if (data.status === 'failed' || data.status === 'cancelled') setMessage(data.error || data.status);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [loopJob?.id, loopJob?.status]);
  async function renderLoop() {
    setBusy(true); setMessage('Memulai looping video...'); setResult(null);
    try {
      const data = await api('/api/loop/start', { method: 'POST', body: JSON.stringify(loopPayload) });
      setLoopJob(data);
      setMessage('Loop berjalan...');
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function validateLoop() {
    setBusy(true); setMessage('Memvalidasi output loop...');
    try {
      const data = await api('/api/loop/validate', { method: 'POST', body: JSON.stringify(loopPayload) });
      setValidation(data);
      setMessage(`Validasi siap. Perlu ${data.loopsNeeded || 0} loop.`);
    } catch (e: any) {
      setValidation({ ok: false, errors: [e.message] });
      setMessage(e.message);
    } finally { setBusy(false); }
  }
  async function cancelLoop() {
    if (!loopJob?.id) return;
    const data = await api('/api/loop/cancel', { method: 'POST', body: JSON.stringify({ id: loopJob.id }) }).catch((e: any) => ({ status: 'failed', error: e.message }));
    setLoopJob(data);
    setMessage(data.error || 'Loop dibatalkan.');
  }
  async function previewSeam() {
    setBusy(true); setMessage('Membuat preview sambungan...'); setSeamPreview(null);
    try {
      const data = await api('/api/loop/seam-preview', { method: 'POST', body: JSON.stringify(loopPayload) });
      setSeamPreview(data);
      setMessage('Preview sambungan siap.');
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function autoDetect() {
    setBusy(true); setMessage('Menganalisis titik loop...');
    try {
      const data = await api('/api/loop/analyze', { method: 'POST', body: JSON.stringify(loopPayload) });
      setAnalysis(data);
      if (data.best) { setTrimStart(data.best.trimStart); setTrimEnd(data.best.trimEnd); }
      setMessage(`Loop score ${data.best?.score || 0}/100 (${data.best?.label || '-'})`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function renderBatch() {
    setBusy(true); setMessage('Memproses batch looping...'); setBatchResult(null);
    try {
      const items = batchText.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      setBatchProgress({ done: 0, total: items.length });
      const created: any[] = []; const skipped: any[] = [];
      for (const item of items) {
        try {
          const name = item.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') || 'loop';
          const out = batchOutput ? `${batchOutput.replace(/[\\/]+$/, '')}\\${name}-loop-${Math.round(duration)}s.mp4` : '';
          const data = await api('/api/loop/render', { method: 'POST', body: JSON.stringify({ ...loopPayload, input: item, output: out }) });
          created.push(data);
        } catch (e: any) { skipped.push({ input: item, error: e.message }); }
        setBatchProgress({ done: created.length + skipped.length, total: items.length });
      }
      setBatchResult({ created, skipped, outputDir: batchOutput || 'otomatis' });
      setMessage(`Batch selesai: ${created.length} dibuat, ${skipped.length} dilewati.`);
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function sendLoopToQueue() {
    if (!result?.output) return;
    const nextConfig = setDeep(config, 'input.visual', result.output);
    const job = await api('/api/jobs', { method: 'POST', body: JSON.stringify({ title: `Loop ${result.duration}s`, input: { visual: result.output, audio: getDeep(config, 'input.audio'), lyrics: getDeep(config, 'lyrics.file') }, config: nextConfig }) }).catch((e: any) => alert(e.message));
    if (job) setMessage(`Masuk antrian: ${job.title}`);
  }
  async function revealLoop() {
    if (!result?.output) return;
    const opened = await window.pidioforge?.revealPath(result.output);
    if (!opened?.ok) alert(opened?.error || 'Buka output hanya tersedia di aplikasi desktop.');
  }
  
  return (
    <aside className="flex flex-col h-full bg-[var(--primary-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Video Looping</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Seamless video loops dengan auto-detect dan batch processing</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Video Loop */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Video Loop</h3>
          <Field label="Video Pendek"><PathInput value={input} onChange={setInput} filter="video" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Durasi Manual Detik"><TextInput type="number" value={duration} onChange={v => setDuration(Number(v || 1))} placeholder="Isi manual, contoh 3600 untuk 1 jam" /></Field>
            <Field label="Mode Render"><SelectInput value={mode} onChange={setMode}><option value="copy">Cepat / copy stream</option><option value="encode">Encode ulang stabil</option></SelectInput></Field>
            <Field label="Output MP4"><PathInput value={output} onChange={setOutput} kind="save" filter="video" placeholder="Kosongkan untuk output otomatis" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tipe Loop"><SelectInput value={loopStyle} onChange={setLoopStyle}><option value="normal">Normal repeat</option><option value="crossfade">Crossfade halus</option><option value="pingpong">Ping-pong maju mundur</option><option value="morph">Morph blend</option><option value="optical-flow">Optical Flow</option></SelectInput></Field>
            <Field label="Crossfade Detik"><TextInput type="number" value={crossfade} onChange={v => setCrossfade(Number(v || 0))} /></Field>
            <Field label="Output Preset"><SelectInput value={preset} onChange={setPreset}><option value="source">Sesuai sumber</option><option value="youtube1080">YouTube 1080p</option><option value="shorts">Shorts/Reels 1080x1920</option><option value="tiktok">TikTok 1080x1920</option><option value="square">Square 1080</option><option value="wallpaper4k">Wallpaper 4K</option></SelectInput></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Trim In Detik"><TextInput type="number" value={trimStart} onChange={v => setTrimStart(Number(v || 0))} /></Field>
            <Field label="Trim Out Detik"><TextInput type="number" value={trimEnd} onChange={v => setTrimEnd(Number(v || 0))} /></Field>
            <div className="flex items-end gap-2 pb-1"><Check label="Mute audio" checked={muteAudio} onChange={setMuteAudio} /><Check label="Fade audio" checked={audioFade} onChange={setAudioFade} /></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setDuration(60)} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">1 menit</button>
            <button onClick={() => setDuration(300)} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">5 menit</button>
            <button onClick={() => setDuration(600)} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">10 menit</button>
            <button onClick={() => setDuration(1800)} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">30 menit</button>
            <button onClick={() => setDuration(3600)} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">1 jam</button>
          </div>
          
          {/* Advanced Loop Detection */}
          <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
            <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Advanced Loop Detection</h4>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Detection Method">
                <SelectInput value={getDeep(config, 'loop.detectionMethod', 'auto')} onChange={v => updateConfig('loop.detectionMethod', v)}>
                  <option value="auto">Auto (All Methods)</option>
                  <option value="motion">Motion Analysis</option>
                  <option value="scene">Scene Detection</option>
                  <option value="optical-flow">Optical Flow</option>
                  <option value="color">Color Histogram</option>
                  <option value="audio">Audio Sync</option>
                </SelectInput>
              </Field>
              <Field label="Sensitivity">
                <SelectInput value={getDeep(config, 'loop.sensitivity', 'medium')} onChange={v => updateConfig('loop.sensitivity', v)}>
                  <option value="low">Low (Loose)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Strict)</option>
                  <option value="extreme">Extreme</option>
                </SelectInput>
              </Field>
              <Field label="Min Loop Duration">
                <TextInput type="number" value={getDeep(config, 'loop.minDuration', 2)} onChange={v => updateConfig('loop.minDuration', v)} placeholder="seconds" />
              </Field>
            </div>
            <Check label="Enable Motion Tracking" checked={Boolean(getDeep(config, 'loop.motionTracking', true))} onChange={v => updateConfig('loop.motionTracking', v)} />
            <Check label="Enable Scene Change Detection" checked={Boolean(getDeep(config, 'loop.sceneDetection', true))} onChange={v => updateConfig('loop.sceneDetection', v)} />
            <Check label="Enable Optical Flow Analysis" checked={Boolean(getDeep(config, 'loop.opticalFlow', false))} onChange={v => updateConfig('loop.opticalFlow', v)} />
            <div className="px-3 py-2 bg-[var(--secondary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
              💡 Advanced detection menganalisis motion, scene cuts, dan optical flow untuk menemukan loop point terbaik secara otomatis.
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={validateLoop} disabled={busy || !input} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Validasi Output</button>
            <button onClick={autoDetect} disabled={busy || !input} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Auto Detect Loop</button>
            <button onClick={previewSeam} disabled={busy || !input} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Preview Sambungan</button>
            <button onClick={renderLoop} disabled={busy || !input || duration < 1 || loopJob?.status === 'running'} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">{busy ? 'Memproses...' : 'Buat Looping'}</button>
            {loopJob?.status === 'running' && <button onClick={cancelLoop} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/90 rounded-[var(--radius-md)] transition-all duration-200">Batal</button>}
          </div>
          {message && (
            <div className={cn('px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium', result?.ok ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]')}>
              {cleanUiText(message)}
            </div>
          )}
          {loopJob?.status === 'running' && (
            <div className="px-3 py-2 flex flex-col gap-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[10px] text-[var(--accent-primary)]">Progress {loopJob.progress || 0}%</b>
              <progress className="w-full h-1.5 rounded-full accent-[var(--accent-primary)]" value={loopJob.progress || 0} max={100} />
              <span className="text-[9px] text-[var(--text-muted)]">Elapsed {formatDuration(loopJob.elapsedSeconds)} / ETA {formatDuration(loopJob.etaSeconds)}</span>
              <span className="text-[9px] text-[var(--text-muted)]">Rendered {loopJob.renderedSeconds || 0}s</span>
            </div>
          )}
          {validation && (
            <div className={cn('px-3 py-2 rounded-[var(--radius-md)] text-[10px]', validation.ok ? 'bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30' : 'bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30')}>
              <b className="block mb-1 text-[11px]">{validation.ok ? 'Validasi siap' : 'Validasi gagal'}</b>
              <span className="text-[var(--text-muted)] block">Input {Number(validation.inputDuration || 0).toFixed(2)}s / loop {validation.loopsNeeded || 0}x</span>
              {validation.disk?.ok && <span className="text-[var(--text-muted)] block">Disk kosong {validation.disk.freeGB} GB</span>}
              {(validation.errors || []).map((x: string) => <small key={x} className="block text-[var(--accent-danger)]">{x}</small>)}
              {(validation.warnings || []).map((x: string) => <small key={x} className="block text-[var(--accent-warning)]">{x}</small>)}
            </div>
          )}
          {analysis?.best && (
            <div className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30">
              <b className="text-[10px] text-[var(--accent-success)] block mb-1">Loop score {analysis.best.score}/100</b>
              <span className="text-[var(--text-muted)] text-[10px] block">{analysis.best.label}</span>
              <span className="text-[var(--text-muted)] text-[10px] block">Trim rekomendasi: {analysis.best.trimStart}s - {analysis.best.trimEnd}s</span>
              {analysis.warnings?.map((w: string) => <small key={w} className="block text-[var(--accent-warning)]">{w}</small>)}
            </div>
          )}
        </div>

        {/* Speed Control & Time Remapping */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Speed Control & Time Remapping</h3>
          <Check label="Enable Speed Ramping" checked={Boolean(getDeep(config, 'loop.speedRamping', false))} onChange={v => updateConfig('loop.speedRamping', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Speed Mode">
              <SelectInput value={getDeep(config, 'loop.speedMode', 'constant')} onChange={v => updateConfig('loop.speedMode', v)}>
                <option value="constant">Constant</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In-Out</option>
                <option value="custom">Custom Curve</option>
              </SelectInput>
            </Field>
            <Field label="Speed Multiplier">
              <TextInput type="number" value={getDeep(config, 'loop.speedMultiplier', 1.0)} onChange={v => updateConfig('loop.speedMultiplier', v)} placeholder="0.5-2.0" step="0.1" />
            </Field>
            <Field label="Transition Duration">
              <TextInput type="number" value={getDeep(config, 'loop.transitionDuration', 0.5)} onChange={v => updateConfig('loop.transitionDuration', v)} placeholder="seconds" step="0.1" />
            </Field>
          </div>
          <Check label="Slow Motion at Loop Point" checked={Boolean(getDeep(config, 'loop.slowMotion', false))} onChange={v => updateConfig('loop.slowMotion', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slow Motion Speed">
              <TextInput type="number" value={getDeep(config, 'loop.slowMotionSpeed', 0.5)} onChange={v => updateConfig('loop.slowMotionSpeed', v)} placeholder="0.1-0.9" step="0.1" />
            </Field>
            <Field label="Slow Motion Duration">
              <TextInput type="number" value={getDeep(config, 'loop.slowMotionDuration', 1.0)} onChange={v => updateConfig('loop.slowMotionDuration', v)} placeholder="seconds" step="0.1" />
            </Field>
          </div>
          <Check label="Frame Blending (Smooth Slow-Mo)" checked={Boolean(getDeep(config, 'loop.frameBlending', true))} onChange={v => updateConfig('loop.frameBlending', v)} />
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Speed ramping membuat transisi loop lebih halus dengan memperlambat atau mempercepat video di titik sambungan.
          </div>
        </div>

        {/* Visual Timeline Editor */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Visual Timeline Editor</h3>
          <div className="relative h-24 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
            {/* Timeline visualization */}
            <div className="absolute inset-0 flex items-center px-2">
              <div className="flex-1 h-12 bg-gradient-to-r from-blue-500/20 via-green-500/20 to-blue-500/20 rounded relative">
                {/* Trim markers */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-yellow-500 cursor-ew-resize"
                  style={{ left: `${(trimStart / 10) * 100}%` }}
                  title="Trim Start"
                />
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-ew-resize"
                  style={{ left: `${100 - (trimEnd / 10) * 100}%` }}
                  title="Trim End"
                />
                {/* Loop indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white drop-shadow-md">
                    Loop: {trimStart}s → {10 - trimEnd}s
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setTrimStart(Math.max(0, trimStart - 0.1))} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded transition-all duration-200">← Start</button>
            <button onClick={() => setTrimStart(Math.min(10, trimStart + 0.1))} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded transition-all duration-200">Start →</button>
            <button onClick={() => setTrimEnd(Math.max(0, trimEnd - 0.1))} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded transition-all duration-200">← End</button>
            <button onClick={() => setTrimEnd(Math.min(10, trimEnd + 0.1))} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded transition-all duration-200">End →</button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            <span>Duration: {(10 - trimStart - trimEnd).toFixed(2)}s</span>
            <span>•</span>
            <span>Loops needed: {Math.ceil(duration / (10 - trimStart - trimEnd))}</span>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Drag markers di timeline atau gunakan tombol untuk fine-tune loop points. Yellow = Start, Red = End.
          </div>
        </div>

        {/* Preview Sambungan */}
        {seamPreview && (
          <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Preview Sambungan</h3>
            <div className="grid grid-cols-2 gap-3">
              {fileUrl(input) && <video className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]" src={fileUrl(input)} controls muted />}
              {seamUrl && <video className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]" src={seamUrl} controls autoPlay loop />}
            </div>
            {seamPreview.quality && (
              <div className="flex items-center gap-2">
                <b className="text-[10px] text-[var(--accent-primary)]">Score {seamPreview.quality.score}/100</b>
                <span className="text-[10px] text-[var(--text-muted)]">{seamPreview.quality.label}</span>
              </div>
            )}
          </div>
        )}

        {/* Loop Quality Scoring */}
        {analysis && (
          <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Loop Quality Scoring</h3>
            
            {/* Overall Score */}
            <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">Overall Quality</span>
                <span className={cn(
                  'text-[16px] font-bold',
                  analysis.best?.score >= 80 ? 'text-[var(--accent-success)]' :
                  analysis.best?.score >= 60 ? 'text-[var(--accent-warning)]' :
                  'text-[var(--accent-danger)]'
                )}>
                  {analysis.best?.score || 0}/100
                </span>
              </div>
              <div className="relative h-2 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'absolute top-0 left-0 h-full transition-all duration-300',
                    analysis.best?.score >= 80 ? 'bg-green-500' :
                    analysis.best?.score >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${analysis.best?.score || 0}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                {analysis.best?.label || 'Analyzing...'}
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1">Motion Continuity</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${analysis.metrics?.motionContinuity || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">{analysis.metrics?.motionContinuity || 0}%</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1">Color Consistency</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: `${analysis.metrics?.colorConsistency || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">{analysis.metrics?.colorConsistency || 0}%</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1">Scene Stability</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${analysis.metrics?.sceneStability || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">{analysis.metrics?.sceneStability || 0}%</span>
                </div>
              </div>
              <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
                <div className="text-[10px] text-[var(--text-muted)] mb-1">Temporal Smoothness</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: `${analysis.metrics?.temporalSmoothness || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-primary)]">{analysis.metrics?.temporalSmoothness || 0}%</span>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {analysis.suggestions?.length > 0 && (
              <div className="p-3 bg-[var(--tertiary-bg)] border-l-4 border-[var(--accent-primary)] rounded-[var(--radius-md)]">
                <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2">💡 Suggestions</h4>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((s: string, i: number) => (
                    <li key={i} className="text-[10px] text-[var(--text-primary)] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-primary)]">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Audio Sync */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Audio Sync & Beat Matching</h3>
          <Check label="Enable Audio Sync" checked={Boolean(getDeep(config, 'loop.audioSync', false))} onChange={v => updateConfig('loop.audioSync', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sync Mode">
              <SelectInput value={getDeep(config, 'loop.audioSyncMode', 'beat')} onChange={v => updateConfig('loop.audioSyncMode', v)}>
                <option value="beat">Beat Detection</option>
                <option value="bar">Bar/Measure</option>
                <option value="phrase">Phrase</option>
                <option value="manual">Manual BPM</option>
              </SelectInput>
            </Field>
            <Field label="BPM (Manual)">
              <TextInput type="number" value={getDeep(config, 'loop.bpm', 120)} onChange={v => updateConfig('loop.bpm', v)} placeholder="60-200" />
            </Field>
            <Field label="Beat Offset">
              <TextInput type="number" value={getDeep(config, 'loop.beatOffset', 0)} onChange={v => updateConfig('loop.beatOffset', v)} placeholder="ms" step="10" />
            </Field>
          </div>
          <Check label="Snap Loop to Beat Grid" checked={Boolean(getDeep(config, 'loop.snapToBeat', true))} onChange={v => updateConfig('loop.snapToBeat', v)} />
          <Check label="Quantize Loop Duration" checked={Boolean(getDeep(config, 'loop.quantizeDuration', false))} onChange={v => updateConfig('loop.quantizeDuration', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Audio Fade In">
              <TextInput type="number" value={getDeep(config, 'loop.audioFadeIn', 0.1)} onChange={v => updateConfig('loop.audioFadeIn', v)} placeholder="seconds" step="0.1" />
            </Field>
            <Field label="Audio Fade Out">
              <TextInput type="number" value={getDeep(config, 'loop.audioFadeOut', 0.1)} onChange={v => updateConfig('loop.audioFadeOut', v)} placeholder="seconds" step="0.1" />
            </Field>
          </div>
          <div className="px-3 py-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)]">
            💡 Audio sync memastikan loop point selaras dengan beat musik untuk hasil yang lebih natural dan musikal.
          </div>
        </div>

        {/* Hasil Loop */}
        {result && (
          <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Hasil Loop</h3>
            <div className="flex flex-col gap-1">
              <b className="text-[10px] text-[var(--text-primary)]">Output: {result.output}</b>
              <span className="text-[9px] text-[var(--text-muted)]">Input {Number(result.inputDuration || 0).toFixed(2)}s jadi {result.duration}s</span>
              <span className="text-[9px] text-[var(--text-muted)]">Ukuran {formatBytes(result.size)}</span>
            </div>
            {resultUrl && <video className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]" src={resultUrl} controls />}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={revealLoop} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Buka Folder Output</button>
              <button onClick={() => copyText(result.output)} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Salin Path</button>
              <button onClick={() => { updateConfig('input.visual', result.output); setMessage('Output loop dipakai sebagai visual utama.'); }} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Pakai Sebagai Visual</button>
              <button onClick={sendLoopToQueue} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 rounded-[var(--radius-md)] transition-all duration-200">Kirim ke Queue</button>
            </div>
          </div>
        )}

        {/* Batch Looping */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Batch Looping</h3>
          <textarea className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[56px] px-3 py-2 resize-y font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50" value={batchText} onChange={e => setBatchText(e.target.value)} placeholder="Satu path file atau folder per baris" />
          <Field label="Folder Output Batch"><PathInput value={batchOutput} onChange={setBatchOutput} kind="directory" placeholder="Kosongkan untuk folder otomatis" /></Field>
          <button onClick={renderBatch} disabled={busy || !batchText.trim()} className="w-full px-3 py-2 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Proses Batch Looping</button>
          {batchProgress.total > 0 && <progress className="w-full h-1.5 rounded-full accent-[var(--accent-primary)]" value={batchProgress.done} max={batchProgress.total} />}
          {batchResult && (
            <div className="px-3 py-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
              <b className="text-[10px] text-[var(--text-primary)] block">Batch: {batchResult.created?.length || 0} dibuat, {batchResult.skipped?.length || 0} dilewati</b>
              <span className="text-[9px] text-[var(--text-muted)] block">{batchResult.outputDir}</span>
              <span className="text-[9px] text-[var(--text-muted)] block">Scan {batchResult.scanned || 0} file{batchResult.limited ? ' / dibatasi' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
