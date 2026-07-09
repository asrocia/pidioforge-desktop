import React, { useEffect, useState } from 'react';
import { PanelWrap, Group, Grid3, ActionBar, ActionBtn, InfoBar } from '../ui/panel-primitives';
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
  return <PanelWrap>
    <Group title="Video Loop">
      <Field label="Video Pendek"><PathInput value={input} onChange={setInput} filter="video" /></Field>
      <Grid3>
        <Field label="Durasi Manual Detik"><TextInput type="number" value={duration} onChange={v => setDuration(Number(v || 1))} placeholder="Isi manual, contoh 3600 untuk 1 jam" /></Field>
        <Field label="Mode Render"><SelectInput value={mode} onChange={setMode}><option value="copy">Cepat / copy stream</option><option value="encode">Encode ulang stabil</option></SelectInput></Field>
        <Field label="Output MP4"><PathInput value={output} onChange={setOutput} kind="save" filter="video" placeholder="Kosongkan untuk output otomatis" /></Field>
      </Grid3>
      <Grid3>
        <Field label="Tipe Loop"><SelectInput value={loopStyle} onChange={setLoopStyle}><option value="normal">Normal repeat</option><option value="crossfade">Crossfade halus</option><option value="pingpong">Ping-pong maju mundur</option></SelectInput></Field>
        <Field label="Crossfade Detik"><TextInput type="number" value={crossfade} onChange={v => setCrossfade(Number(v || 0))} /></Field>
        <Field label="Output Preset"><SelectInput value={preset} onChange={setPreset}><option value="source">Sesuai sumber</option><option value="youtube1080">YouTube 1080p</option><option value="shorts">Shorts/Reels 1080x1920</option><option value="tiktok">TikTok 1080x1920</option><option value="square">Square 1080</option><option value="wallpaper4k">Wallpaper 4K</option></SelectInput></Field>
      </Grid3>
      <Grid3>
        <Field label="Trim In Detik"><TextInput type="number" value={trimStart} onChange={v => setTrimStart(Number(v || 0))} /></Field>
        <Field label="Trim Out Detik"><TextInput type="number" value={trimEnd} onChange={v => setTrimEnd(Number(v || 0))} /></Field>
        <div className="flex items-end gap-2 pb-1"><Check label="Mute audio" checked={muteAudio} onChange={setMuteAudio} /><Check label="Fade audio" checked={audioFade} onChange={setAudioFade} /></div>
      </Grid3>
      <ActionBar>
        <ActionBtn variant="ghost" onClick={() => setDuration(60)}>1 menit</ActionBtn>
        <ActionBtn variant="ghost" onClick={() => setDuration(300)}>5 menit</ActionBtn>
        <ActionBtn variant="ghost" onClick={() => setDuration(600)}>10 menit</ActionBtn>
        <ActionBtn variant="ghost" onClick={() => setDuration(1800)}>30 menit</ActionBtn>
        <ActionBtn variant="ghost" onClick={() => setDuration(3600)}>1 jam</ActionBtn>
      </ActionBar>
      <ActionBar>
        <ActionBtn onClick={validateLoop} disabled={busy || !input}>Validasi Output</ActionBtn>
        <ActionBtn onClick={autoDetect} disabled={busy || !input}>Auto Detect Loop</ActionBtn>
        <ActionBtn onClick={previewSeam} disabled={busy || !input}>Preview Sambungan</ActionBtn>
        <ActionBtn variant="primary" onClick={renderLoop} disabled={busy || !input || duration < 1 || loopJob?.status === 'running'}>{busy ? 'Memproses...' : 'Buat Looping'}</ActionBtn>
        {loopJob?.status === 'running' && <ActionBtn variant="danger" onClick={cancelLoop}>Batal</ActionBtn>}
      </ActionBar>
      {message && <InfoBar variant={result?.ok ? 'ok' : 'error'}>{cleanUiText(message)}</InfoBar>}
      {loopJob?.status === 'running' && <div className="px-3 py-2 flex flex-col gap-1"><b className="text-[10px] text-[#4f8ef7]">Progress {loopJob.progress || 0}%</b><progress className="w-full h-1.5 rounded-full accent-[#4f8ef7]" value={loopJob.progress || 0} max={100} /><span className="text-[9px] text-[#8da0af]">Elapsed {formatDuration(loopJob.elapsedSeconds)} / ETA {formatDuration(loopJob.etaSeconds)}</span><span className="text-[9px] text-[#8da0af]">Rendered {loopJob.renderedSeconds || 0}s</span></div>}
      {validation && <div className={cn('mx-3 my-1.5 rounded-[6px] px-2.5 py-2 text-[10px]', validation.ok ? 'bg-[#0d1c16] border border-[#2dbb7f]/30' : 'bg-[#1a0f11] border border-[#e76d78]/30')}><b className="block mb-1">{validation.ok ? 'Validasi siap' : 'Validasi gagal'}</b><span className="text-[#8da0af] block">Input {Number(validation.inputDuration || 0).toFixed(2)}s / loop {validation.loopsNeeded || 0}x</span>{validation.disk?.ok && <span className="text-[#8da0af] block">Disk kosong {validation.disk.freeGB} GB</span>}{(validation.errors || []).map((x: string) => <small key={x} className="block text-[#e76d78]">{x}</small>)}{(validation.warnings || []).map((x: string) => <small key={x} className="block text-[#d9a65f]">{x}</small>)}</div>}
      {analysis?.best && <div className="mx-3 my-1.5 rounded-[6px] bg-[#0d1c16] border border-[#2dbb7f]/30 px-2.5 py-2"><b className="text-[10px] text-[#2dbb7f] block mb-1">Loop score {analysis.best.score}/100</b><span className="text-[#8da0af] text-[10px] block">{analysis.best.label}</span><span className="text-[#8da0af] text-[10px] block">Trim rekomendasi: {analysis.best.trimStart}s - {analysis.best.trimEnd}s</span>{analysis.warnings?.map((w: string) => <small key={w} className="block text-[#d9a65f]">{w}</small>)}</div>}
    </Group>

    {seamPreview && <Group title="Preview Sambungan">
      <div className="grid grid-cols-2 gap-2 px-1">{fileUrl(input) && <video className="w-full rounded-[4px] border border-[rgba(142,162,184,0.22)]" src={fileUrl(input)} controls muted />}{seamUrl && <video className="w-full rounded-[4px] border border-[rgba(142,162,184,0.22)]" src={seamUrl} controls autoPlay loop />}</div>
      {seamPreview.quality && <div className="mt-1 px-1"><b className="text-[10px] text-[#4f8ef7]">Score {seamPreview.quality.score}/100</b><span className="text-[10px] text-[#8da0af] ml-2">{seamPreview.quality.label}</span></div>}
    </Group>}

    {result && <Group title="Hasil Loop">
      <div className="px-1 py-1 flex flex-col gap-0.5"><b className="text-[10px] text-[#dce8ef]">Output: {result.output}</b><span className="text-[9px] text-[#8da0af]">Input {Number(result.inputDuration || 0).toFixed(2)}s jadi {result.duration}s</span><span className="text-[9px] text-[#8da0af]">Ukuran {formatBytes(result.size)}</span></div>
      {resultUrl && <video className="w-full rounded-[4px] border border-[rgba(142,162,184,0.22)] my-1" src={resultUrl} controls />}
      <ActionBar>
        <ActionBtn variant="ghost" onClick={revealLoop}>Buka Folder Output</ActionBtn>
        <ActionBtn variant="ghost" onClick={() => copyText(result.output)}>Salin Path</ActionBtn>
        <ActionBtn variant="ghost" onClick={() => { updateConfig('input.visual', result.output); setMessage('Output loop dipakai sebagai visual utama.'); }}>Pakai Sebagai Visual</ActionBtn>
        <ActionBtn variant="primary" onClick={sendLoopToQueue}>Kirim ke Queue</ActionBtn>
      </ActionBar>
    </Group>}

    <Group title="Batch Looping">
      <textarea className="w-full bg-[#070c12] border border-[#2f3b4a] rounded-[6px] text-[#dce8ef] text-[11px] min-h-[56px] px-1.5 py-1 resize-y font-mono" value={batchText} onChange={e => setBatchText(e.target.value)} placeholder="Satu path file atau folder per baris" />
      <Field label="Folder Output Batch"><PathInput value={batchOutput} onChange={setBatchOutput} kind="directory" placeholder="Kosongkan untuk folder otomatis" /></Field>
      <ActionBar><ActionBtn variant="wide" onClick={renderBatch} disabled={busy || !batchText.trim()}>Proses Batch Looping</ActionBtn></ActionBar>
      {batchProgress.total > 0 && <progress className="w-full h-1.5 rounded-full accent-[#4f8ef7] mt-1" value={batchProgress.done} max={batchProgress.total} />}
      {batchResult && <div className="px-3 py-2"><b className="text-[10px] text-[#dce8ef] block">Batch: {batchResult.created?.length || 0} dibuat, {batchResult.skipped?.length || 0} dilewati</b><span className="text-[9px] text-[#8da0af] block">{batchResult.outputDir}</span><span className="text-[9px] text-[#8da0af] block">Scan {batchResult.scanned || 0} file{batchResult.limited ? ' / dibatasi' : ''}</span></div>}
    </Group>
  </PanelWrap>;
}
