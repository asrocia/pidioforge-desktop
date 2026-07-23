import { useEffect, useState } from 'react';
import { API_BASE_URL, api } from '../../../lib/api';
import { getDeep } from '../../../lib/config-path';
import { errorMessage, formatBytes } from '../../../lib/format';
import type {
  LoopingCardProps,
  LoopingEngineState,
  LoopAnalysis,
  BatchResult,
  LoopJob,
  LoopResult,
  LoopValidation,
  SeamPreview,
} from './types';

const API = API_BASE_URL;

/** All local state + payload derivation for the Looping panel. */
export function useLoopingEngine({ config }: LoopingCardProps): LoopingEngineState {
  const [input, setInput] = useState<string>(getDeep(config, 'input.visual', ''));
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
  const [result, setResult] = useState<LoopResult | null>(null);
  const [seamPreview, setSeamPreview] = useState<SeamPreview | null>(null);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [analysis, setAnalysis] = useState<LoopAnalysis | null>(null);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [loopJob, setLoopJob] = useState<LoopJob | null>(null);
  const [validation, setValidation] = useState<LoopValidation | null>(null);

  const resultUrl = result?.url ? `${API}${result.url}` : '';
  const seamUrl = seamPreview?.url ? `${API}${seamPreview.url}` : '';
  const loopPayload = {
    input,
    duration,
    output,
    mode,
    loopStyle,
    crossfade,
    trimStart,
    trimEnd,
    muteAudio,
    audioFade,
    preset,
  };

  useEffect(() => {
    if (!loopJob?.id || !['running'].includes(loopJob.status || '')) return;
    const timer = setInterval(async () => {
      const data = await api(`/api/loop/status?id=${encodeURIComponent(loopJob.id || '')}`).catch(() => null);
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

  return {
    input,
    setInput,
    duration,
    setDuration,
    output,
    setOutput,
    mode,
    setMode,
    loopStyle,
    setLoopStyle,
    crossfade,
    setCrossfade,
    trimStart,
    setTrimStart,
    trimEnd,
    setTrimEnd,
    muteAudio,
    setMuteAudio,
    audioFade,
    setAudioFade,
    preset,
    setPreset,
    batchText,
    setBatchText,
    batchOutput,
    setBatchOutput,
    message,
    setMessage,
    busy,
    setBusy,
    result,
    setResult,
    seamPreview,
    setSeamPreview,
    batchResult,
    setBatchResult,
    analysis,
    setAnalysis,
    batchProgress,
    setBatchProgress,
    loopJob,
    setLoopJob,
    validation,
    setValidation,
    loopPayload,
    resultUrl,
    seamUrl,
  };
}

/** Actions that call the loop API, using the engine state for payload/setters. */
export function useLoopingActions(
  engine: LoopingEngineState,
  config: LoopingCardProps['config'],
  updateConfigOrSetMessage: LoopingCardProps['updateConfig'],
) {
  const {
    loopPayload,
    setBusy,
    setMessage,
    setResult,
    setLoopJob,
    setValidation,
    setSeamPreview,
    setAnalysis,
    setTrimStart,
    setTrimEnd,
    batchText,
    batchOutput,
    duration,
    setBatchProgress,
    setBatchResult,
    loopJob,
    result,
  } = engine;

  async function renderLoop() {
    setBusy(true);
    setMessage('Memulai looping video...');
    setResult(null);
    try {
      const data = await api('/api/loop/start', { method: 'POST', body: JSON.stringify(loopPayload) });
      setLoopJob(data);
      setMessage('Loop berjalan...');
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function validateLoop() {
    setBusy(true);
    setMessage('Memvalidasi output loop...');
    try {
      const data = await api('/api/loop/validate', { method: 'POST', body: JSON.stringify(loopPayload) });
      setValidation(data);
      setMessage(`Validasi siap. Perlu ${data.loopsNeeded || 0} loop.`);
    } catch (e: unknown) {
      setValidation({ ok: false, errors: [errorMessage(e)] });
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function cancelLoop() {
    if (!loopJob?.id) return;
    const data = await api('/api/loop/cancel', { method: 'POST', body: JSON.stringify({ id: loopJob.id }) }).catch(
      (e: unknown) => ({ status: 'failed', error: errorMessage(e) }),
    );
    setLoopJob(data);
    setMessage(data.error || 'Loop dibatalkan.');
  }

  async function previewSeam() {
    setBusy(true);
    setMessage('Membuat preview sambungan...');
    setSeamPreview(null);
    try {
      const data = await api('/api/loop/seam-preview', { method: 'POST', body: JSON.stringify(loopPayload) });
      setSeamPreview(data);
      setMessage('Preview sambungan siap.');
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function autoDetect() {
    setBusy(true);
    setMessage('Menganalisis titik loop...');
    try {
      const data = await api('/api/loop/analyze', { method: 'POST', body: JSON.stringify(loopPayload) });
      setAnalysis(data);
      if (data.best) {
        setTrimStart(data.best.trimStart);
        setTrimEnd(data.best.trimEnd);
      }
      setMessage(`Loop score ${data.best?.score || 0}/100 (${data.best?.label || '-'})`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function renderBatch() {
    setBusy(true);
    setMessage('Memproses batch looping...');
    setBatchResult(null);
    try {
      const items = batchText
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(Boolean);
      setBatchProgress({ done: 0, total: items.length });
      const created: unknown[] = [];
      const skipped: Array<{ input: string; error: string }> = [];
      for (const item of items) {
        try {
          const name =
            item
              .split(/[\\/]/)
              .pop()
              ?.replace(/\.[^.]+$/, '') || 'loop';
          const out = batchOutput
            ? `${batchOutput.replace(/[\\/]+$/, '')}\\${name}-loop-${Math.round(duration)}s.mp4`
            : '';
          const data = await api('/api/loop/render', {
            method: 'POST',
            body: JSON.stringify({ ...loopPayload, input: item, output: out }),
          });
          created.push(data);
        } catch (e: unknown) {
          skipped.push({ input: item, error: errorMessage(e) });
        }
        setBatchProgress({ done: created.length + skipped.length, total: items.length });
      }
      setBatchResult({ created, skipped, outputDir: batchOutput || 'otomatis' });
      setMessage(`Batch selesai: ${created.length} dibuat, ${skipped.length} dilewati.`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function sendLoopToQueue() {
    if (!result?.output) return;
    const { setDeep } = await import('../../../lib/config-path');
    const nextConfig = setDeep(config, 'input.visual', result.output);
    const job = await api('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: `Loop ${result.duration}s`,
        input: { visual: result.output, audio: getDeep(config, 'input.audio'), lyrics: getDeep(config, 'lyrics.file') },
        config: nextConfig,
      }),
    }).catch((e: unknown) => alert(errorMessage(e)));
    if (job) setMessage(`Masuk antrian: ${job.title}`);
  }

  async function revealLoop() {
    if (!result?.output) return;
    const opened = await window.pidioforge?.revealPath(result.output);
    if (!opened?.ok) alert(opened?.error || 'Buka output hanya tersedia di aplikasi desktop.');
  }

  function useAsVisual() {
    if (!result?.output) return;
    updateConfigOrSetMessage('input.visual', result.output);
    setMessage('Output loop dipakai sebagai visual utama.');
  }

  return {
    renderLoop,
    validateLoop,
    cancelLoop,
    previewSeam,
    autoDetect,
    renderBatch,
    sendLoopToQueue,
    revealLoop,
    useAsVisual,
  };
}
