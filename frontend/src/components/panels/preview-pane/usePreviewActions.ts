import { useCallback } from 'react';
import { api } from '../../../lib/api';
import { getDeep } from '../../../lib/config-path';
import { errorMessage } from '../../../lib/format';
import { showToast } from '../../ui/Toast';
import type { PidioConfig } from '../../../types/app.types';
import type { PreviewData } from './types';

interface PreviewActionsConfig {
  config: PidioConfig;
  quality: string;
  startAt: number;
  duration: number;
  safePreset: string;
  setBusy: (v: boolean) => void;
  setMessage: (v: string) => void;
  setPreviewData: React.Dispatch<React.SetStateAction<PreviewData | null>>;
  setPreviewMode: (v: 'live' | 'rendered') => void;
  setPreviewLogs: (v: string[]) => void;
  refresh: () => void;
}

function validateInputs(config: PidioConfig): boolean {
  const hasVisual = Boolean(getDeep(config, 'input.visual'));
  const hasAudio = Boolean(getDeep(config, 'input.audio'));
  const galleryActive =
    Boolean(getDeep(config, 'spectrum.gallery.enabled', false)) &&
    (getDeep(config, 'spectrum.gallery.images', []) as string[]).length > 0;

  if (!hasVisual && !galleryActive) {
    showToast('error', 'Pilih file visual atau aktifkan gallery terlebih dahulu!');
    return false;
  }
  if (!hasAudio) {
    showToast('error', 'Pilih file audio terlebih dahulu!');
    return false;
  }
  return true;
}

export function usePreviewActions(opts: PreviewActionsConfig) {
  const {
    config,
    quality,
    startAt,
    duration,
    safePreset,
    setBusy,
    setMessage,
    setPreviewData,
    setPreviewMode,
    setPreviewLogs,
    refresh,
  } = opts;

  const renderPreview = useCallback(async () => {
    if (!validateInputs(config)) return;
    setBusy(true);
    setMessage('Merender preview...');
    setPreviewLogs([]);
    try {
      const patch = {
        preview: {
          quality,
          startAt,
          duration,
          safeAreaPreset: safePreset,
          width: getDeep(config, 'preview.width', 640),
          height: getDeep(config, 'preview.height', 360),
          fps: getDeep(config, 'preview.fps', 18),
          showSafeArea: getDeep(config, 'preview.showSafeArea', true),
          showGrid: getDeep(config, 'preview.showGrid', false),
        },
      };
      const data = await api('/api/preview/render', {
        method: 'POST',
        body: JSON.stringify({ config: patch, startAt, title: getDeep(config, 'input.title', 'Preview') }),
      });
      setPreviewData(data);
      setPreviewMode('rendered');
      setPreviewLogs(data.logs || []);
      const msg = `Preview siap / ${data.resolution} / ${(data.size / 1024 / 1024).toFixed(2)} MB / ${Math.round(data.elapsedMs / 1000)}s`;
      setMessage(msg);
      showToast('success', `Preview berhasil dirender! ${data.resolution}, ${(data.size / 1024 / 1024).toFixed(2)} MB`);
      refresh();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal render preview: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [
    config,
    quality,
    startAt,
    duration,
    safePreset,
    setBusy,
    setMessage,
    setPreviewData,
    setPreviewMode,
    setPreviewLogs,
    refresh,
  ]);

  const snapshotPreview = useCallback(async () => {
    if (!validateInputs(config)) return;
    setBusy(true);
    setMessage('Mengambil snapshot...');
    setPreviewLogs([]);
    try {
      const patch = {
        preview: {
          quality,
          startAt,
          duration: 1,
          safeAreaPreset: safePreset,
          width: getDeep(config, 'preview.width', 640),
          height: getDeep(config, 'preview.height', 360),
          fps: getDeep(config, 'preview.fps', 18),
        },
      };
      const data = await api('/api/preview/snapshot', {
        method: 'POST',
        body: JSON.stringify({ config: patch, startAt, title: getDeep(config, 'input.title', 'Preview') }),
      });
      setPreviewData(p => ({ ...(p || {}), snapshot: data, safeArea: data.safeArea }));
      setPreviewLogs(data.logs || []);
      const msg = `Snapshot siap / ${(data.size / 1024).toFixed(1)} KB / detik ${data.startAt}`;
      setMessage(msg);
      showToast('success', `Snapshot berhasil! ${(data.size / 1024).toFixed(1)} KB`);
      refresh();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal snapshot: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [config, quality, startAt, safePreset, setBusy, setMessage, setPreviewData, setPreviewLogs, refresh]);

  const sendPreviewToQueue = useCallback(async () => {
    if (!validateInputs(config)) return;
    setBusy(true);
    setMessage('Mengirim preview ke antrian...');
    try {
      const data = await api('/api/preview/send-to-queue', {
        method: 'POST',
        body: JSON.stringify({ config, title: getDeep(config, 'input.title', 'Render dari Preview') }),
      });
      const msg = `Masuk antrian: ${data.job?.title || 'job'}${data.warnings?.length ? ' / peringatan: ' + data.warnings.length : ''}`;
      setMessage(msg);
      showToast('success', `Job ditambahkan ke antrian: ${data.job?.title || 'job'}`);
      if (data.warnings?.length > 0) showToast('warning', `Peringatan: ${data.warnings.join(', ')}`);
      refresh();
    } catch (e: unknown) {
      const msg = errorMessage(e);
      setMessage(msg);
      showToast('error', `Gagal mengirim ke antrian: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, [config, setBusy, setMessage, refresh]);

  const clearLogs = useCallback(async () => {
    try {
      await api('/api/logs/clear', { method: 'POST' });
      setPreviewLogs([]);
      showToast('success', 'Log dibersihkan!');
      refresh();
    } catch (e: unknown) {
      showToast('error', `Gagal membersihkan log: ${errorMessage(e)}`);
    }
  }, [setPreviewLogs, refresh]);

  return { renderPreview, snapshotPreview, sendPreviewToQueue, clearLogs };
}
