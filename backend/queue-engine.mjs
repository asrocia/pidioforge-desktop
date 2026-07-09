import { stat } from 'node:fs/promises';
import { renderJob } from './render-engine.mjs';
import { safeId } from './media-utils.mjs';
import { deepMerge, defaultState, workspaceDir } from './config.mjs';
import { loadState, saveState, updateState, activeConfig, addLog, jlog, sleep } from './state.mjs';
import { validateRenderConfig } from './target-engine.mjs';

export function queueSummary(state) {
  const jobs = state.jobs || [];
  const counts = jobs.reduce((a,j)=>{ a[j.status || 'standby'] = (a[j.status || 'standby'] || 0) + 1; return a; }, {});
  const total = jobs.length;
  const done = counts.done || 0;
  const failed = counts.failed || 0;
  const rendering = counts.rendering || 0;
  const standby = counts.standby || 0;
  const progress = total ? Math.round((jobs.reduce((n,j)=>n+Number(j.progress||0),0) / total)) : 0;
  const current = jobs.find(j => j.status === 'rendering') || null;
  const next = jobs.find(j => j.status === 'standby') || null;
  return { total, counts, done, failed, rendering, standby, progress, current, next, queue: state.queue || defaultState.queue };
}

export function cloneJob(job, configPatch = {}) {
  return { ...job, id: safeId('job'), title: `${job.title || 'Job'} Copy`, status: 'standby', progress: 0, error: '', startedAt: '', finishedAt: '', createdAt: new Date().toISOString(), config: deepMerge(job.config || {}, configPatch) };
}

export async function startJob(id, processes) {
  const state = await loadState(); const job = state.jobs.find(j => j.id === id);
  if (!job) throw new Error('job tidak ditemukan'); if (job.status === 'rendering') return job;
  const config = job.config || activeConfig(state);
  const validation = validateRenderConfig(config, { visual: job.input?.visual, audio: job.input?.audio, outputDir: job.outputDir || config.input?.output });
  if (!validation.ok) {
    job.status = 'failed'; job.error = validation.errors.join(' '); job.progress = 0; job.finishedAt = new Date().toISOString();
    addLog(state, `VALIDASI GAGAL ${job.title}: ${job.error}`);
    await saveState(state);
    return job;
  }
  job.status = 'rendering'; job.progress = 1; job.startedAt = new Date().toISOString(); job.error = ''; job.elapsedSeconds = 0; job.etaSeconds = 0; job.speed = '0.0x'; addLog(state, `${job.title} start render nyata.`); await saveState(state);
  renderJob(job, config, workspaceDir, {
    onProcess: child => processes.set(id, child),
    onProgress: progress => updateState(s => {
      const j = s.jobs.find(x => x.id === id);
      if (j) {
        j.progress = progress; j.status = progress >= 100 ? 'done' : 'rendering'; j.updatedAt = new Date().toISOString();
        const bucket = Math.floor(Number(progress || 0) / 10) * 10;
        if (bucket > 0 && bucket < 100 && bucket !== j.lastLoggedProgress) {
          j.lastLoggedProgress = bucket;
          addLog(s, `${j.title} progress ${bucket}%.`);
        }
      }
    }),
    onMetrics: metrics => updateState(s => {
      const j = s.jobs.find(x => x.id === id);
      if (!j) return;
      const outSeconds = Number(metrics.out_time_ms || 0) / 1_000_000;
      const duration = Number(metrics.duration || 0);
      const progress = Number(j.progress || 0);
      const elapsed = j.startedAt ? Math.max(0, Math.round((Date.now() - Date.parse(j.startedAt)) / 1000)) : 0;
      j.elapsedSeconds = elapsed;
      j.renderedSeconds = Number.isFinite(outSeconds) ? Number(outSeconds.toFixed(1)) : j.renderedSeconds || 0;
      j.etaSeconds = progress > 0 && progress < 100 ? Math.max(0, Math.round((elapsed / progress) * (100 - progress))) : 0;
      j.speed = String(metrics.speed || j.speed || '0.0x');
      j.outputSize = Number(metrics.total_size || j.outputSize || 0);
      j.durationSeconds = duration || j.durationSeconds || 0;
    }),
    onLog: line => updateState(s => addLog(s, line)),
    onCommand: line => updateState(s => jlog(s, line)),
  }).then(async result => {
    const st = await stat(result.output).catch(() => null);
    return updateState(s => { processes.delete(id); const j = s.jobs.find(x => x.id === id); if (j?.status === 'cancelled') { addLog(s, `${job.title} sudah dibatalkan.`); return; } if (j) { j.status = 'done'; j.progress = 100; j.output = result.output; j.finishedAt = new Date().toISOString(); j.outputSize = st?.size || j.outputSize || 0; j.etaSeconds = 0; j.elapsedSeconds = j.startedAt ? Math.max(0, Math.round((Date.parse(j.finishedAt) - Date.parse(j.startedAt)) / 1000)) : j.elapsedSeconds || 0; } addLog(s, `${job.title} selesai.`); });
  })
    .catch(error => updateState(s => { processes.delete(id); const j = s.jobs.find(x => x.id === id); if (j?.status === 'cancelled') { j.finishedAt = new Date().toISOString(); addLog(s, `${job.title} dibatalkan.`); return; } if (j) { j.status = 'failed'; j.error = error.message; j.finishedAt = new Date().toISOString(); } addLog(s, `ERROR ${job.title}: ${error.message}`); }));
  return job;
}

export function createQueueRunner(processes) {
  let queueLoopActive = false;
  let queueStopRequested = false;

  async function runQueueLoop() {
    if (queueLoopActive) return;
    queueLoopActive = true; queueStopRequested = false;
    try {
      await updateState(s => { s.queue.running = true; s.queue.paused = false; s.queue.startedAt = new Date().toISOString(); addLog(s, 'antrian render dimulai.'); });
      while (!queueStopRequested) {
        const state = await loadState();
        const q = state.queue || defaultState.queue;
        if (q.paused) { await sleep(700); continue; }
        const active = state.jobs.filter(j => j.status === 'rendering').length;
        const concurrency = Math.max(1, Math.min(4, Number(q.concurrency || 1)));
        if (active < concurrency) {
          const next = state.jobs.find(j => j.status === 'standby');
          if (next) { await startJob(next.id, processes); await sleep(400); continue; }
        }
        const latest = await loadState();
        const anyRendering = latest.jobs.some(j => j.status === 'rendering');
        const anyStandby = latest.jobs.some(j => j.status === 'standby');
        const anyFailed = latest.jobs.some(j => j.status === 'failed');
        if (!anyRendering && (!anyStandby || (latest.queue?.stopOnError && anyFailed))) break;
        await sleep(1000);
      }
    } finally {
      queueLoopActive = false;
      await updateState(s => { s.queue.running = false; s.queue.finishedAt = new Date().toISOString(); addLog(s, queueStopRequested ? 'antrian dihentikan.' : 'antrian selesai.'); });
    }
  }

  function requestStop() { queueStopRequested = true; }
  function isStopRequested() { return queueStopRequested; }

  return { runQueueLoop, requestStop, isStopRequested };
}
