import { useEffect, useRef, useState } from 'react';
import { Field, TextInput, SelectInput } from '../ui/form-controls';
import { PathInput } from '../ui/PathInput';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';
import { getDeep } from '../../lib/config-path';
import { cleanUiText, errorMessage } from '../../lib/format';
import type { Job, PidioConfig } from '../../types/app.types';
import { showToast } from '../ui/Toast';
import {
  ActionButtonGroup,
  Card,
  Chip,
  ChipGroup,
  LogPre,
  PresetButtonGroup,
  ProgressBar,
  StatRow,
  Textarea,
  WarningList,
} from '../ui/design-system-components';

type QueueStatus = 'all' | 'standby' | 'rendering' | 'done' | 'failed' | 'cancelled';
type QueueSummary = {
  total?: number;
  progress?: number;
  counts?: Partial<Record<Exclude<QueueStatus, 'all'>, number>>;
  queue?: { paused?: boolean; running?: boolean; concurrency?: number; stopOnError?: boolean };
};
type PerformanceStatus = {
  encoder?: string;
  metrics?: { cpu?: number; memory?: number; disk?: number };
  performance?: {
    mode?: string;
    ffmpegThreads?: number;
    x264Preset?: string;
    maxCpu?: number;
    maxMemory?: number;
    refreshMs?: number;
  };
  warnings?: string[];
};
type PreflightResult = {
  ok?: boolean;
  errors?: string[];
  warnings?: string[];
  estimate?: { durationPerJob?: number; estimatedSizeMB?: number; resolution?: string };
};
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

export function QueuePanel({ config }: { config: PidioConfig }) {
  const [title, setTitle] = useState<string>(getDeep(config, 'input.title', 'Render Baru'));
  const [visual, setVisual] = useState<string>(getDeep(config, 'input.visual', ''));
  const [audio, setAudio] = useState<string>(getDeep(config, 'input.audio', ''));
  const [lyrics, setLyrics] = useState<string>(getDeep(config, 'lyrics.file', ''));
  const [output, setOutput] = useState<string>('');
  const [batchText, setBatchText] = useState<string>('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [perfStatus, setPerfStatus] = useState<PerformanceStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [filter, setFilter] = useState<QueueStatus>('all');
  const [concurrency, setConcurrency] = useState(1);
  const [busy, setBusy] = useState(false);
  async function refreshQueue() {
    const j = await api('/api/jobs').catch(() => ({ jobs: [], logs: [] }));
    const q = await api('/api/queue/summary').catch(() => null);
    const ps = await api('/api/performance/status').catch(() => null);
    setJobs(j.jobs || []);
    setLogs(j.logs || []);
    setSummary(q);
    setPerfStatus(ps);
    if (q?.queue?.concurrency) setConcurrency(q.queue.concurrency);
  }
  useEffect(() => {
    const initialRefresh = window.setTimeout(refreshQueue, 0);
    const interval = window.setInterval(refreshQueue, 1500);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, []);
  async function addJob() {
    if (!visual) {
      showToast('error', 'Pilih file visual terlebih dahulu!');
      return;
    }
    if (!audio) {
      showToast('error', 'Pilih file audio terlebih dahulu!');
      return;
    }

    setBusy(true);
    setMessage('Menambah job ke antrian...');
    try {
      const job = await api('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ title, input: { visual, audio, lyrics }, output, config }),
      });
      setMessage(`Job dibuat: ${job.title}`);
      showToast('success', `Job berhasil ditambahkan: ${job.title}`);
      await refreshQueue();
    } catch (e: unknown) {
      const message = errorMessage(e);
      setMessage(message);
      showToast('error', `Gagal menambah job: ${message}`);
    } finally {
      setBusy(false);
    }
  }
  async function validateManual() {
    if (!visual) {
      showToast('error', 'Pilih file visual terlebih dahulu!');
      return;
    }
    if (!audio) {
      showToast('error', 'Pilih file audio terlebih dahulu!');
      return;
    }

    setBusy(true);
    setMessage('Memvalidasi input render...');
    try {
      const data = await api('/api/render/validate', {
        method: 'POST',
        body: JSON.stringify({
          input: { visual, audio, lyrics },
          outputDir: output || getDeep(config, 'input.output'),
          config,
        }),
      });
      setPreflight(data);
      const msg = `Validasi siap. Estimasi ${data.estimate?.durationPerJob || 0}s / ${data.estimate?.estimatedSizeMB || 0} MB.`;
      setMessage(msg);
      showToast('success', 'Validasi berhasil!');
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setPreflight({ ok: false, errors: [msg] });
      setMessage(msg);
      showToast('error', `Validasi gagal: ${msg}`);
    } finally {
      setBusy(false);
    }
  }
  async function addBatch() {
    if (!batchText.trim()) {
      showToast('warning', 'Masukkan data batch terlebih dahulu!');
      return;
    }

    setBusy(true);
    setMessage('Menambah batch ke antrian...');
    try {
      const items = batchText
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line, i) => {
          const [a, l, t, v] = line.split('|').map(x => x?.trim());
          return { title: t || `Batch ${i + 1}`, visual: v || visual, audio: a, lyrics: l, config };
        });
      const data = await api('/api/jobs/batch', { method: 'POST', body: JSON.stringify({ items }) });
      setMessage(`${data.created.length} job batch dibuat`);
      showToast('success', `${data.created.length} job batch berhasil ditambahkan!`);
      await refreshQueue();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal menambah batch: ${msg}`);
    } finally {
      setBusy(false);
    }
  }
  async function queueAction(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    try {
      const data = await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      setMessage(data?.error || 'Aksi antrian berhasil.');
      showToast('success', 'Aksi berhasil!');
      await refreshQueue();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Aksi gagal: ${msg}`);
    } finally {
      setBusy(false);
    }
  }
  async function performanceAction(mode: string) {
    setBusy(true);
    try {
      const data = await api('/api/performance/apply', { method: 'POST', body: JSON.stringify({ mode }) });
      setMessage(`Preset performa aktif: ${data.config?.performance?.mode || mode}`);
      showToast('success', `Performa diatur ke: ${data.config?.performance?.mode || mode}`);
      await refreshQueue();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal mengatur performa: ${msg}`);
    } finally {
      setBusy(false);
    }
  }
  async function optimizePerformance() {
    setBusy(true);
    try {
      const opt = await api('/api/performance/optimize', { method: 'POST' });
      const data = await api('/api/performance/apply', {
        method: 'POST',
        body: JSON.stringify({ mode: opt.recommendedMode }),
      });
      setMessage(`Auto optimize: ${data.config?.performance?.mode || opt.recommendedMode}`);
      showToast('success', `Auto optimize: ${data.config?.performance?.mode || opt.recommendedMode}`);
      await refreshQueue();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal optimize: ${msg}`);
    } finally {
      setBusy(false);
    }
  }
  function handlePerformancePreset(id: string) {
    if (busy) return;
    if (id === 'auto') {
      void optimizePerformance();
      return;
    }
    void performanceAction(id);
  }
  async function startJob(id: string) {
    try {
      await queueAction(`/api/jobs/${id}/start`);
      showToast('success', 'Job dimulai!');
    } catch (e: unknown) {
      showToast('error', `Gagal memulai job: ${errorMessage(e)}`);
    }
  }
  async function cancelJob(id: string) {
    try {
      await queueAction(`/api/jobs/${id}/cancel`);
      showToast('success', 'Job dibatalkan!');
    } catch (e: unknown) {
      showToast('error', `Gagal membatalkan job: ${errorMessage(e)}`);
    }
  }
  async function duplicateJob(id: string) {
    try {
      await queueAction(`/api/jobs/${id}/duplicate`);
      showToast('success', 'Job diduplikasi!');
    } catch (e: unknown) {
      showToast('error', `Gagal menduplikasi job: ${errorMessage(e)}`);
    }
  }
  async function removeJob(id: string) {
    if (confirm('Hapus job ini dari antrian?')) {
      try {
        await queueAction(`/api/jobs/${id}/remove`);
        showToast('success', 'Job dihapus!');
      } catch (e: unknown) {
        showToast('error', `Gagal menghapus job: ${errorMessage(e)}`);
      }
    }
  }
  async function moveJob(id: string, to: 'top' | 'bottom') {
    try {
      await queueAction(`/api/jobs/${id}/move`, { to });
      showToast('success', `Job dipindah ke ${to === 'top' ? 'atas' : 'bawah'}!`);
    } catch (e: unknown) {
      showToast('error', `Gagal memindah job: ${errorMessage(e)}`);
    }
  }
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
  function handleDragLeave() {
    setDragOverId(null);
  }
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
  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  // Notify on render complete/fail
  const prevJobsRef = useRef<Job[]>([]);
  useEffect(() => {
    const prev = prevJobsRef.current;
    for (const job of jobs) {
      const old = prev.find(p => p.id === job.id);
      if (!old) continue;
      if (old.status === 'rendering' && job.status === 'done') {
        window.pidioforge?.notify?.(`Render selesai: ${job.title}`, 'Output siap digunakan.');
        showToast('success', `✅ Render selesai: ${job.title}`);
      }
      if (old.status === 'rendering' && job.status === 'failed') {
        window.pidioforge?.notify?.(`Render gagal: ${job.title}`, 'Periksa log untuk detail.');
        showToast('error', `❌ Render gagal: ${job.title}`);
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
    <div className="space-y-4">
      {/* Stats Overview */}
      <StatRow
        stats={[
          { label: 'Total Job', value: summary?.total || jobs.length, accent: true },
          { label: 'Siaga', value: counts.standby || 0 },
          { label: 'Memproses', value: counts.rendering || 0, accent: true },
          { label: 'Selesai', value: counts.done || 0 },
          { label: 'Gagal', value: (counts.failed || 0) + (counts.cancelled || 0) },
          { label: 'Progress', value: `${summary?.progress || 0}%` },
        ]}
      />

      {/* Kontrol Antrian */}
      <Card title="Kontrol Antrian">
        <Field label="Concurrency">
          <TextInput type="number" value={concurrency} onChange={v => setConcurrency(Number(v || 1))} />
        </Field>
        <Field label="Status">
          <TextInput
            value={summary?.queue?.paused ? 'JEDA' : summary?.queue?.running ? 'JALAN' : 'SIAGA'}
            onChange={() => {}}
          />
        </Field>
        <Field label="Henti saat error">
          <SelectInput
            value={summary?.queue?.stopOnError ? 'Aktif' : 'Mati'}
            onChange={v => queueAction('/api/queue/settings', { stopOnError: v === 'Aktif' })}
          >
            <option value="Mati">Mati / lanjut job lain</option>
            <option value="Aktif">Aktif</option>
          </SelectInput>
        </Field>
        <ActionButtonGroup
          actions={[
            {
              id: 'start',
              label: 'Mulai Antrian',
              icon: '▶️',
              variant: 'primary',
              disabled: busy,
              onClick: () => queueAction('/api/queue/start', { concurrency }),
            },
            {
              id: 'pause',
              label: 'Jeda',
              icon: '⏸️',
              variant: 'secondary',
              disabled: busy,
              onClick: () => queueAction('/api/queue/pause'),
            },
            {
              id: 'resume',
              label: 'Lanjut',
              icon: '⏯️',
              variant: 'secondary',
              disabled: busy,
              onClick: () => queueAction('/api/queue/resume'),
            },
            {
              id: 'stop',
              label: 'Hentikan',
              icon: '⏹️',
              variant: 'danger',
              disabled: busy,
              onClick: () => queueAction('/api/queue/stop'),
            },
            {
              id: 'retry',
              label: 'Ulang Gagal',
              icon: '🔁',
              variant: 'secondary',
              disabled: busy,
              onClick: () => queueAction('/api/queue/retry-failed'),
            },
            {
              id: 'next',
              label: 'Mulai Berikutnya',
              icon: '⏭️',
              variant: 'secondary',
              disabled: busy,
              onClick: () => queueAction('/api/jobs/start-next'),
            },
            {
              id: 'clear-done',
              label: 'Bersihkan Selesai',
              icon: '🧹',
              variant: 'secondary',
              disabled: busy,
              onClick: () => queueAction('/api/queue/clear-done'),
            },
            {
              id: 'clear-failed',
              label: 'Bersihkan Gagal',
              icon: '🗑️',
              variant: 'secondary',
              disabled: busy,
              onClick: () => queueAction('/api/queue/clear-failed'),
            },
            {
              id: 'reset',
              label: 'Reset Semua',
              icon: '♻️',
              variant: 'danger',
              disabled: busy,
              onClick: () => {
                if (confirm('Reset semua antrian?')) queueAction('/api/jobs/reset');
              },
            },
            { id: 'refresh', label: 'Muat Ulang', icon: '🔄', variant: 'secondary', onClick: refreshQueue },
          ]}
        />
        {message && (
          <div className="px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
            {cleanUiText(message)}
          </div>
        )}
      </Card>

      {/* Performa Render */}
      <Card title="Performa Render">
        <StatRow
          stats={[
            { label: 'Beban CPU', value: `${perfStatus?.metrics?.cpu ?? 0}%` },
            { label: 'Memori', value: `${perfStatus?.metrics?.memory ?? 0}%` },
            { label: 'Disk', value: `${perfStatus?.metrics?.disk ?? 0}%` },
            { label: 'Encoder', value: perfStatus?.encoder || '-' },
          ]}
        />
        <Field label="Mode Performa">
          <SelectInput value={perfStatus?.performance?.mode || 'balanced'} onChange={performanceAction}>
            <option value="balanced">Seimbang</option>
            <option value="turbo">Turbo Render</option>
            <option value="quality">Kualitas Max</option>
            <option value="eco">Hemat / Aman Laptop</option>
          </SelectInput>
        </Field>
        <Field label="Threads FFmpeg">
          <TextInput
            type="number"
            value={perfStatus?.performance?.ffmpegThreads ?? 0}
            onChange={v => queueAction('/api/performance/settings', { performance: { ffmpegThreads: Number(v || 0) } })}
          />
        </Field>
        <Field label="X264 Preset">
          <SelectInput
            value={perfStatus?.performance?.x264Preset || 'medium'}
            onChange={v => queueAction('/api/performance/settings', { performance: { x264Preset: v } })}
          >
            <option>ultrafast</option>
            <option>veryfast</option>
            <option>medium</option>
            <option>slow</option>
          </SelectInput>
        </Field>
        <Field label="Max CPU %">
          <TextInput
            type="number"
            value={perfStatus?.performance?.maxCpu ?? 85}
            onChange={v => queueAction('/api/performance/settings', { performance: { maxCpu: Number(v || 85) } })}
          />
        </Field>
        <Field label="Max Memori %">
          <TextInput
            type="number"
            value={perfStatus?.performance?.maxMemory ?? 85}
            onChange={v => queueAction('/api/performance/settings', { performance: { maxMemory: Number(v || 85) } })}
          />
        </Field>
        <Field label="Refresh ms">
          <TextInput
            type="number"
            value={perfStatus?.performance?.refreshMs ?? 1500}
            onChange={v => queueAction('/api/performance/settings', { performance: { refreshMs: Number(v || 1500) } })}
          />
        </Field>
        <PresetButtonGroup
          activeId={perfStatus?.performance?.mode || 'balanced'}
          presets={[
            { id: 'auto', icon: 'A', label: 'AUTO OPTIMIZE' },
            { id: 'turbo', icon: 'T', label: 'TURBO' },
            { id: 'eco', icon: 'E', label: 'ECO' },
            { id: 'quality', icon: 'Q', label: 'Kualitas' },
          ]}
          onChange={handlePerformancePreset}
        />
        {perfStatus?.warnings?.length ? (
          <WarningList tone="warning" title="Warning performa" items={perfStatus.warnings} />
        ) : null}
      </Card>

      {/* Tambah Job Manual */}
      <Card title="Tambah Job Manual">
        <Field label="Judul">
          <TextInput value={title} onChange={v => setTitle(String(v))} />
        </Field>
        <Field label="Visual">
          <PathInput value={visual} onChange={setVisual} filter="visual" />
        </Field>
        <Field label="Audio">
          <PathInput value={audio} onChange={setAudio} filter="audio" />
        </Field>
        <Field label="Lirik">
          <PathInput value={lyrics} onChange={setLyrics} filter="lyrics" />
        </Field>
        <Field label="Output File">
          <PathInput
            value={output}
            onChange={setOutput}
            placeholder="Opsional: D:/Hasil/video.mp4"
            kind="save"
            filter="video"
          />
        </Field>
        <ActionButtonGroup
          actions={[
            {
              id: 'validate',
              label: 'Cek Sebelum Render',
              icon: '🧪',
              variant: 'secondary',
              disabled: busy,
              onClick: validateManual,
            },
            { id: 'add', label: 'Tambah Job Render', icon: '➕', variant: 'primary', disabled: busy, onClick: addJob },
          ]}
        />
        {preflight && (
          <div
            className={cn(
              'px-3 py-2 rounded-[var(--radius-md)] text-[10px]',
              preflight.ok
                ? 'bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30'
                : 'bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30',
            )}
          >
            <b className="block mb-1 text-[11px]">{preflight.ok ? 'Validasi siap' : 'Validasi gagal'}</b>
            {preflight.estimate && (
              <span className="text-[var(--text-muted)] block">
                Estimasi: {preflight.estimate.durationPerJob}s / {preflight.estimate.estimatedSizeMB} MB /{' '}
                {preflight.estimate.resolution}
              </span>
            )}
            {(preflight.errors || []).map((x: string) => (
              <small key={x} className="block text-[var(--accent-danger)]">
                {x}
              </small>
            ))}
            {(preflight.warnings || []).map((x: string) => (
              <small key={x} className="block text-[var(--accent-warning)]">
                {x}
              </small>
            ))}
          </div>
        )}
      </Card>

      {/* Tambah Batch Cepat */}
      <Card title="Tambah Batch Cepat">
        <Textarea
          value={batchText}
          onChange={e => setBatchText(e.target.value)}
          placeholder="Satu baris per job. Format: audio.mp3 | lirik.lrc | Judul | visual.mp4"
          minRows={3}
        />
        <ActionButtonGroup
          columns={1}
          actions={[
            {
              id: 'add-batch',
              label: 'Tambah Batch Dari Daftar',
              icon: '📦',
              variant: 'primary',
              disabled: busy,
              onClick: addBatch,
            },
          ]}
        />
      </Card>

      {/* Daftar Antrian */}
      <Card title="Daftar Antrian">
        <ChipGroup>
          {['all', 'standby', 'rendering', 'done', 'failed', 'cancelled'].map(s => (
            <Chip key={s} active={filter === s} onClick={() => setFilter(s as QueueStatus)}>
              {s === 'all'
                ? 'Semua'
                : s === 'standby'
                  ? 'Siaga'
                  : s === 'rendering'
                    ? 'Memproses'
                    : s === 'done'
                      ? 'Selesai'
                      : s === 'failed'
                        ? 'Gagal'
                        : 'Dibatalkan'}
            </Chip>
          ))}
        </ChipGroup>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {shown.slice(0, 40).map((j, i) => (
            <div
              key={j.id}
              draggable
              onDragStart={e => handleDragStart(e, j.id)}
              onDragOver={e => handleDragOver(e, j.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, j.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'grid grid-cols-1 gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[10px] border cursor-grab transition-all',
                dragOverId === j.id ? 'border-[var(--accent-primary)] bg-[var(--tertiary-bg)] scale-[1.01]' : '',
                j.status === 'rendering'
                  ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/40'
                  : j.status === 'failed' || j.status === 'cancelled'
                    ? 'bg-[var(--accent-danger)]/5 border-[var(--accent-danger)]/30'
                    : j.status === 'done'
                      ? 'bg-[var(--accent-success)]/5 border-[var(--accent-success)]/20'
                      : 'bg-[var(--tertiary-bg)] border-[var(--border-subtle)]',
              )}
            >
              <div className="flex items-center gap-2">
                <b className="text-[var(--text-primary)]">
                  {i + 1}. {j.title}
                </b>
                <small className="text-[var(--text-muted)] ml-auto">
                  {queueStatusLabel(j.status)} / {j.progress || 0}%
                </small>
              </div>
              <div className="flex items-center gap-2">
                <em className="text-[var(--text-muted)] text-[9px] truncate flex-1">
                  {j.output || j.outputDir || '-'}
                </em>
                {j.error && <strong className="text-[var(--accent-danger)] text-[9px]">{j.error}</strong>}
              </div>
              <ProgressBar
                value={j.progress || 0}
                max={100}
                tone={
                  j.status === 'rendering'
                    ? 'primary'
                    : j.status === 'done'
                      ? 'success'
                      : j.status === 'failed' || j.status === 'cancelled'
                        ? 'danger'
                        : 'primary'
                }
              />
              <ActionButtonGroup
                actions={[
                  { id: `start-${j.id}`, label: 'Mulai', icon: '▶️', variant: 'small', onClick: () => startJob(j.id) },
                  {
                    id: `cancel-${j.id}`,
                    label: 'Batal',
                    icon: '⏹️',
                    variant: 'small',
                    onClick: () => cancelJob(j.id),
                  },
                  {
                    id: `duplicate-${j.id}`,
                    label: 'Duplikat',
                    icon: '📄',
                    variant: 'small',
                    onClick: () => duplicateJob(j.id),
                  },
                  {
                    id: `top-${j.id}`,
                    label: 'Atas',
                    icon: '⬆️',
                    variant: 'small',
                    onClick: () => moveJob(j.id, 'top'),
                  },
                  {
                    id: `bottom-${j.id}`,
                    label: 'Bawah',
                    icon: '⬇️',
                    variant: 'small',
                    onClick: () => moveJob(j.id, 'bottom'),
                  },
                  {
                    id: `remove-${j.id}`,
                    label: 'Hapus',
                    icon: '🗑️',
                    variant: 'danger',
                    onClick: () => removeJob(j.id),
                  },
                ]}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Log Antrian */}
      <Card title="Log Antrian">
        <LogPre maxHeight={200}>{logs.slice(-24).join('\n') || 'Belum ada log.'}</LogPre>
      </Card>
    </div>
  );
}
