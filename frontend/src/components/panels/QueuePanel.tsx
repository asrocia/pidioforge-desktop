import React, { useEffect, useRef, useState } from 'react';
import { Field, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText } from '../../lib/format';
import type { Job } from '../../types/app.types';

type QueueStatus = 'all' | 'standby' | 'rendering' | 'done' | 'failed' | 'cancelled';
const queueStatusLabelMap: Record<Exclude<QueueStatus, 'all'>, string> = {
  standby: 'Siaga',
  rendering: 'Memproses',
  done: 'Selesai',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};
function queueStatusLabel(status: string) {
  return queueStatusLabelMap[status as Exclude<QueueStatus, 'all'>] || status || '-';
}

export function QueuePanel({ config }: { config: any }) {
  const [title, setTitle] = useState(getDeep(config, 'input.title', 'Render Baru'));
  const [visual, setVisual] = useState(getDeep(config, 'input.visual'));
  const [audio, setAudio] = useState(getDeep(config, 'input.audio'));
  const [lyrics, setLyrics] = useState(getDeep(config, 'lyrics.file'));
  const [output, setOutput] = useState('');
  const [batchText, setBatchText] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [perfStatus, setPerfStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [preflight, setPreflight] = useState<any>(null);
  const [filter, setFilter] = useState<QueueStatus>('all');
  const [concurrency, setConcurrency] = useState(1);
  const [busy, setBusy] = useState(false);
  const [_showQueueControls] = useState(true); // setShowQueueControls removed = useState(true);
  const [_showPerf] = useState(false); // setShowPerf removed = useState(true);
  const [_showManual] = useState(false); // setShowManual removed = useState(true);
  const [_showBatch] = useState(false); // setShowBatch removed = useState(false);
  const [_showList] = useState(false); // setShowList removed = useState(true);
  const [_showQueueLog] = useState(false); // setShowQueueLog removed = useState(false);
  async function refreshQueue() {
    const j = await api('/api/jobs').catch(() => ({ jobs: [], logs: [] }));
    const q = await api('/api/queue/summary').catch(() => null);
    const ps = await api('/api/performance/status').catch(() => null);
    setJobs(j.jobs || []); setLogs(j.logs || []); setSummary(q); setPerfStatus(ps);
    if (q?.queue?.concurrency) setConcurrency(q.queue.concurrency);
  }
  useEffect(() => { refreshQueue(); const t = setInterval(refreshQueue, 1500); return () => clearInterval(t); }, []);
  async function addJob() {
    setBusy(true); setMessage('Menambah job ke antrian...');
    try { const job = await api('/api/jobs', { method: 'POST', body: JSON.stringify({ title, input: { visual, audio, lyrics }, output, config }) }); setMessage(`Job dibuat: ${job.title}`); await refreshQueue(); }
    catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function validateManual() {
    setBusy(true); setMessage('Memvalidasi input render...');
    try {
      const data = await api('/api/render/validate', { method: 'POST', body: JSON.stringify({ input: { visual, audio, lyrics }, outputDir: output || getDeep(config, 'input.output'), config }) });
      setPreflight(data); setMessage(`Validasi siap. Estimasi ${data.estimate?.durationPerJob || 0}s / ${data.estimate?.estimatedSizeMB || 0} MB.`);
    } catch (e: any) {
      setPreflight({ ok: false, errors: [e.message] }); setMessage(e.message);
    } finally { setBusy(false); }
  }
  async function addBatch() {
    setBusy(true); setMessage('Menambah batch ke antrian...');
    try {
      const items = batchText.split(/\r?\n/).filter(Boolean).map((line, i) => { const [a, l, t, v] = line.split('|').map(x => x?.trim()); return { title: t || `Batch ${i+1}`, visual: v || visual, audio: a, lyrics: l, config }; });
      const data = await api('/api/jobs/batch', { method: 'POST', body: JSON.stringify({ items }) }); setMessage(`${data.created.length} job batch dibuat`); await refreshQueue();
    } catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function queueAction(path: string, body?: any) {
    setBusy(true);
    try { const data = await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); setMessage(data?.error || 'Aksi antrian berhasil.'); await refreshQueue(); }
    catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function performanceAction(mode: string) {
    setBusy(true);
    try { const data = await api('/api/performance/apply', { method: 'POST', body: JSON.stringify({ mode }) }); setMessage(`Preset performa aktif: ${data.config?.performance?.mode || mode}`); await refreshQueue(); }
    catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function optimizePerformance() {
    setBusy(true);
    try { const opt = await api('/api/performance/optimize', { method: 'POST' }); const data = await api('/api/performance/apply', { method: 'POST', body: JSON.stringify({ mode: opt.recommendedMode }) }); setMessage(`Auto optimize: ${data.config?.performance?.mode || opt.recommendedMode}`); await refreshQueue(); }
    catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function startJob(id: string) { await queueAction(`/api/jobs/${id}/start`); }
  async function cancelJob(id: string) { await queueAction(`/api/jobs/${id}/cancel`); }
  async function duplicateJob(id: string) { await queueAction(`/api/jobs/${id}/duplicate`); }
  async function removeJob(id: string) { if (confirm('Hapus job ini dari antrian?')) await queueAction(`/api/jobs/${id}/remove`); }
  async function moveJob(id: string, to: 'top' | 'bottom') { await queueAction(`/api/jobs/${id}/move`, { to }); }
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) setDragOverId(id);
  }
  function handleDragLeave() { setDragOverId(null); }
  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;
    const ids = shown.map(j => j.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    setDraggedId(null);
    await queueAction('/api/queue/reorder', { order: ids });
  }
  function handleDragEnd() { setDraggedId(null); setDragOverId(null); }

  // Notify on render complete/fail
  const prevJobsRef = useRef<Job[]>([]);
  useEffect(() => {
    const prev = prevJobsRef.current;
    for (const job of jobs) {
      const old = prev.find(p => p.id === job.id);
      if (!old) continue;
      if (old.status === 'rendering' && job.status === 'done') {
        window.pidioforge?.notify?.(`Render selesai: ${job.title}`, 'Output siap digunakan.');
      }
      if (old.status === 'rendering' && (job.status === 'failed' || job.status === 'cancelled')) {
        window.pidioforge?.notify?.(`Render gagal: ${job.title}`, job.error || 'Terjadi kesalahan.');
      }
    }
    prevJobsRef.current = jobs;
  }, [jobs]);

  const shown = jobs.filter(j => filter === 'all' || j.status === filter);
  const counts = summary?.counts || {};
  return (
    <aside className="flex flex-col h-full bg-[var(--primary-bg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Render Queue</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Batch rendering, job management, dan performance tuning</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-6 gap-3 p-3 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          {[
            { label: 'Total Job', value: summary?.total || jobs.length, accent: true },
            { label: 'Siaga', value: counts.standby || 0 },
            { label: 'Memproses', value: counts.rendering || 0, accent: true },
            { label: 'Selesai', value: counts.done || 0 },
            { label: 'Gagal', value: (counts.failed || 0) + (counts.cancelled || 0) },
            { label: 'Progress', value: `${summary?.progress || 0}%` },
          ].map(({ label, value, accent }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <span className="text-[10px] text-[var(--text-muted)] mb-1">{label}</span>
              <span className={cn('text-[14px] font-bold', accent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]')}>{value}</span>
            </div>
          ))}
        </div>

        {/* Kontrol Antrian */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Kontrol Antrian</h3>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Concurrency"><TextInput type="number" value={concurrency} onChange={v => setConcurrency(Number(v || 1))} /></Field>
            <Field label="Status"><TextInput value={summary?.queue?.paused ? 'JEDA' : summary?.queue?.running ? 'JALAN' : 'SIAGA'} onChange={() => {}} /></Field>
            <Field label="Henti saat error"><SelectInput value={summary?.queue?.stopOnError ? 'Aktif' : 'Mati'} onChange={v => queueAction('/api/queue/settings', { stopOnError: v === 'Aktif' })}><option value="Mati">Mati / lanjut job lain</option><option value="Aktif">Aktif</option></SelectInput></Field>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => queueAction('/api/queue/start', { concurrency })} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Mulai Antrian</button>
            <button onClick={() => queueAction('/api/queue/pause')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Jeda</button>
            <button onClick={() => queueAction('/api/queue/resume')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Lanjut</button>
            <button onClick={() => queueAction('/api/queue/stop')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Hentikan</button>
            <button onClick={() => queueAction('/api/queue/retry-failed')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Ulang Gagal</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => queueAction('/api/jobs/start-next')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Mulai Berikutnya</button>
            <button onClick={() => queueAction('/api/queue/clear-done')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Bersihkan Selesai</button>
            <button onClick={() => queueAction('/api/queue/clear-failed')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Bersihkan Gagal</button>
            <button onClick={() => { if (confirm('Reset semua antrian?')) queueAction('/api/jobs/reset'); }} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Reset Semua</button>
            <button onClick={refreshQueue} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200">Muat Ulang</button>
          </div>
          {message && (
            <div className="px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              {cleanUiText(message)}
            </div>
          )}
        </div>

        {/* Performa Render */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Performa Render</h3>
          <div className="grid grid-cols-4 gap-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
            {[
              { label: 'Beban CPU', value: `${perfStatus?.metrics?.cpu ?? 0}%` },
              { label: 'Memori', value: `${perfStatus?.metrics?.memory ?? 0}%` },
              { label: 'Disk', value: `${perfStatus?.metrics?.disk ?? 0}%` },
              { label: 'Encoder', value: perfStatus?.encoder || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <span className="text-[10px] text-[var(--text-muted)] mb-1">{label}</span>
                <span className="text-[14px] font-bold text-[var(--text-primary)]">{value}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Mode Performa"><SelectInput value={perfStatus?.performance?.mode || 'balanced'} onChange={performanceAction}><option value="balanced">Seimbang</option><option value="turbo">Turbo Render</option><option value="quality">Kualitas Max</option><option value="eco">Hemat / Aman Laptop</option></SelectInput></Field>
            <Field label="Threads FFmpeg"><TextInput type="number" value={perfStatus?.performance?.ffmpegThreads ?? 0} onChange={v => queueAction('/api/performance/settings', { performance: { ffmpegThreads: Number(v || 0) } })} /></Field>
            <Field label="X264 Preset"><SelectInput value={perfStatus?.performance?.x264Preset || 'medium'} onChange={v => queueAction('/api/performance/settings', { performance: { x264Preset: v } })}><option>ultrafast</option><option>veryfast</option><option>medium</option><option>slow</option></SelectInput></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Max CPU %"><TextInput type="number" value={perfStatus?.performance?.maxCpu ?? 85} onChange={v => queueAction('/api/performance/settings', { performance: { maxCpu: Number(v || 85) } })} /></Field>
            <Field label="Max Memori %"><TextInput type="number" value={perfStatus?.performance?.maxMemory ?? 85} onChange={v => queueAction('/api/performance/settings', { performance: { maxMemory: Number(v || 85) } })} /></Field>
            <Field label="Refresh ms"><TextInput type="number" value={perfStatus?.performance?.refreshMs ?? 1500} onChange={v => queueAction('/api/performance/settings', { performance: { refreshMs: Number(v || 1500) } })} /></Field>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={optimizePerformance} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">AUTO OPTIMIZE</button>
            <button onClick={() => performanceAction('turbo')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">TURBO</button>
            <button onClick={() => performanceAction('eco')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">ECO</button>
            <button onClick={() => performanceAction('quality')} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Kualitas</button>
          </div>
          {perfStatus?.warnings?.length ? (
            <div className="p-3 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
              <h4 className="text-[11px] font-bold text-[var(--accent-warning)] mb-2">⚠ Warning performa:</h4>
              <ul className="space-y-1.5">
                {perfStatus.warnings.map((w: string, i: number) => (
                  <li key={i} className="text-[10px] text-[var(--text-primary)] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Tambah Job Manual */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Tambah Job Manual</h3>
          <Field label="Judul"><TextInput value={title} onChange={setTitle} /></Field>
          <Field label="Visual"><PathInput value={visual} onChange={setVisual} filter="visual" /></Field>
          <Field label="Audio"><PathInput value={audio} onChange={setAudio} filter="audio" /></Field>
          <Field label="Lirik"><PathInput value={lyrics} onChange={setLyrics} filter="lyrics" /></Field>
          <Field label="Output File"><PathInput value={output} onChange={setOutput} placeholder="Opsional: D:/Hasil/video.mp4" kind="save" filter="video" /></Field>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={validateManual} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">Cek Sebelum Render</button>
            <button onClick={addJob} disabled={busy} className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">+ Tambah Job Render</button>
          </div>
          {preflight && (
            <div className={cn('px-3 py-2 rounded-[var(--radius-md)] text-[10px]', preflight.ok ? 'bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30' : 'bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30')}>
              <b className="block mb-1 text-[11px]">{preflight.ok ? 'Validasi siap' : 'Validasi gagal'}</b>
              {preflight.estimate && <span className="text-[var(--text-muted)] block">Estimasi: {preflight.estimate.durationPerJob}s / {preflight.estimate.estimatedSizeMB} MB / {preflight.estimate.resolution}</span>}
              {(preflight.errors || []).map((x: string) => <small key={x} className="block text-[var(--accent-danger)]">{x}</small>)}
              {(preflight.warnings || []).map((x: string) => <small key={x} className="block text-[var(--accent-warning)]">{x}</small>)}
            </div>
          )}
        </div>

        {/* Tambah Batch Cepat */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Tambah Batch Cepat</h3>
          <textarea className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[56px] px-3 py-2 resize-y font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50" value={batchText} onChange={e => setBatchText(e.target.value)} placeholder="Satu baris per job. Format: audio.mp3 | lirik.lrc | Judul | visual.mp4" />
          <button onClick={addBatch} disabled={busy} className="w-full px-3 py-2 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200">+ Tambah Batch Dari Daftar</button>
        </div>

        {/* Daftar Antrian */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Daftar Antrian</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'standby', 'rendering', 'done', 'failed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s as any)} className={cn('px-3 py-1.5 text-[11px] font-semibold rounded-[var(--radius-md)] transition-all duration-200', filter === s ? 'text-white bg-[var(--accent-primary)]' : 'text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)]')}>
                {s === 'all' ? 'Semua' : s === 'standby' ? 'Siaga' : s === 'rendering' ? 'Memproses' : s === 'done' ? 'Selesai' : s === 'failed' ? 'Gagal' : 'Dibatalkan'}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {shown.slice(0, 40).map((j, i) => (
              <div key={j.id} draggable onDragStart={e => handleDragStart(e, j.id)} onDragOver={e => handleDragOver(e, j.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, j.id)} onDragEnd={handleDragEnd} className={cn('grid grid-cols-1 gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[10px] border cursor-grab transition-all', dragOverId === j.id ? 'border-[var(--accent-primary)] bg-[var(--tertiary-bg)] scale-[1.01]' : '', j.status === 'rendering' ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/40' : j.status === 'failed' || j.status === 'cancelled' ? 'bg-[var(--accent-danger)]/5 border-[var(--accent-danger)]/30' : j.status === 'done' ? 'bg-[var(--accent-success)]/5 border-[var(--accent-success)]/20' : 'bg-[var(--tertiary-bg)] border-[var(--border-subtle)]')}>
                <div className="flex items-center gap-2">
                  <b className="text-[var(--text-primary)]">{i+1}. {j.title}</b>
                  <small className="text-[var(--text-muted)] ml-auto">{queueStatusLabel(j.status)} / {j.progress || 0}%</small>
                </div>
                <div className="flex items-center gap-2">
                  <em className="text-[var(--text-muted)] text-[9px] truncate flex-1">{j.output || j.outputDir || '-'}</em>
                  {j.error && <strong className="text-[var(--accent-danger)] text-[9px]">{j.error}</strong>}
                </div>
                <progress className="w-full h-1 rounded-full accent-[var(--accent-primary)]" value={j.progress || 0} max={100} />
                <div className="flex items-center gap-1 flex-wrap">
                  <button onClick={() => startJob(j.id)} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-sm)] transition-all duration-200">Mulai</button>
                  <button onClick={() => cancelJob(j.id)} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-sm)] transition-all duration-200">Batal</button>
                  <button onClick={() => duplicateJob(j.id)} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-sm)] transition-all duration-200">Duplikat</button>
                  <button onClick={() => moveJob(j.id, 'top')} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-sm)] transition-all duration-200">Atas</button>
                  <button onClick={() => moveJob(j.id, 'bottom')} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-sm)] transition-all duration-200">Bawah</button>
                  <button onClick={() => removeJob(j.id)} className="px-2 py-1 text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-sm)] transition-all duration-200">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log Antrian */}
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Log Antrian</h3>
          <pre className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[10px] text-[var(--text-muted)] p-3 max-h-[200px] overflow-auto break-all whitespace-pre-wrap font-mono">{logs.slice(-24).join('\n') || 'Belum ada log.'}</pre>
        </div>
      </div>
    </aside>
  );
}
