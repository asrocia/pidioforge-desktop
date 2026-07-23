import { useState } from 'react';
import { api } from '../../../lib/api';
import { getDeep } from '../../../lib/config-path';
import { errorMessage } from '../../../lib/format';
import { detectTargetFormat } from '../../../utils/format-presets';
import { showToast } from '../../ui/Toast';
import type { TargetCardProps, TargetEngineState, TargetScan } from './types';

export function useTargetEngine({ config, updateConfig }: TargetCardProps): TargetEngineState {
  const [scan, setScan] = useState<TargetScan>({ files: [], pairs: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [advanced, setAdvanced] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  const files = scan.files.filter(f => selectedType === 'all' || f.type === selectedType);
  const est = scan.summary?.estimate;
  const counts = scan.summary?.counts || { videos: 0, images: 0, audios: 0, lyrics: 0, total: 0 };
  const risk = scan.summary?.risk;
  const collisions = scan.summary?.collisions || [];
  const enc = scan.diagnostics?.encoders || {};
  const hasVisual = Boolean(getDeep(config, 'input.visual'));
  const hasAudio = Boolean(getDeep(config, 'input.audio'));
  const targetFormat = detectTargetFormat(config);
  const workflowSteps = [
    { id: 'visual', label: 'Visual', completed: hasVisual },
    { id: 'audio', label: 'Audio', completed: hasAudio },
    { id: 'preview', label: 'Edit Preview', completed: hasVisual && hasAudio },
    { id: 'render', label: 'Render Preview' },
    { id: 'queue', label: 'Queue' },
  ];
  const activeWorkflowIndex = !hasVisual ? 0 : !hasAudio ? 1 : 2;

  async function inspectTarget() {
    setBusy(true);
    setMessage('Memindai folder bahan...');
    try {
      const data = await api('/api/target/inspect', {
        method: 'POST',
        body: JSON.stringify({ config, recursive: true, maxDepth: 4, validateMedia: true }),
      });
      setScan({
        files: data.files || [],
        pairs: data.pairs || [],
        summary: data.summary,
        diagnostics: data.diagnostics,
      });
      const encoderWarn = data.diagnostics?.ffmpeg ? '' : ' FFmpeg belum terdeteksi.';
      const msg = data.summary?.ready
        ? `Target siap render.${encoderWarn}`
        : `Perlu dilengkapi: ${(data.summary?.errors || []).join(' ')}${encoderWarn}`;
      setMessage(msg);

      if (!data.diagnostics?.ffmpeg) {
        showToast('error', 'FFmpeg tidak ditemukan! Install FFmpeg untuk melanjutkan.');
      } else if (data.summary?.ready) {
        showToast('success', 'Target siap untuk render!');
      } else if (data.summary?.errors?.length > 0) {
        showToast('warning', `Perlu dilengkapi: ${data.summary.errors.join(', ')}`);
      }
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal memindai: ${msg}`);
    } finally {
      setBusy(false);
    }
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

    setBusy(true);
    setMessage('Membuat batch...');
    try {
      const data = await api('/api/target/create-batch', {
        method: 'POST',
        body: JSON.stringify({ config, files: scan.files, pairs: scan.pairs }),
      });
      const count = data.created?.length || 0;
      setMessage(`${count} job berhasil dibuat dari pasangan audio/visual.`);
      showToast('success', `${count} job batch berhasil dibuat!`);
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal membuat batch: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function createStructure() {
    setBusy(true);
    setMessage('Membuat struktur folder...');
    try {
      const data = await api('/api/target/create-structure', {
        method: 'POST',
        body: JSON.stringify({ baseDir: getDeep(config, 'input.bahanFolder') }),
      });
      setMessage(`Struktur folder dibuat: ${data.dirs?.length || 0} folder.`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function autoTuneTarget() {
    setBusy(true);
    setMessage('Menyesuaikan target otomatis...');
    try {
      const data = await api('/api/target/auto-tune', {
        method: 'POST',
        body: JSON.stringify({ config, files: scan.files, pairs: scan.pairs }),
      });
      const t = data.patch?.target || {};
      Object.entries(t).forEach(([k, v]) => updateConfig(`target.${k}`, v));
      setMessage(`Auto Target Tune: ${data.reasons?.join(' - ') || 'selesai'}`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function checkDiagnosticsOnly() {
    setBusy(true);
    setMessage('Memeriksa FFmpeg dan encoder...');
    try {
      const data = await api('/api/system/diagnostics');
      setScan(prev => ({ ...prev, diagnostics: data }));
      setMessage(data.ffmpeg ? `FFmpeg OK. Rekomendasi encoder: ${data.recommended}` : 'FFmpeg tidak ditemukan.');
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return {
    scan,
    busy,
    message,
    selectedType,
    setSelectedType,
    advanced,
    setAdvanced,
    batchOpen,
    setBatchOpen,
    files,
    est,
    counts,
    risk,
    collisions,
    enc,
    hasVisual,
    hasAudio,
    targetFormat,
    workflowSteps,
    activeWorkflowIndex,
    inspectTarget,
    createBatch,
    createStructure,
    autoTuneTarget,
    checkDiagnosticsOnly,
  };
}
