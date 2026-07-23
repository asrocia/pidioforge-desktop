import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { mediaKind, fileUrl, cornerPosition } from '../../utils/media';
import { getDeep } from '../../lib/config-path';
import { api, API_BASE_URL } from '../../lib/api';
import { cleanUiText, errorMessage } from '../../lib/format';
import type { ModuleKey, Job, PidioConfig } from '../../types/app.types';
import type { LiveTarget } from '../../types/preview.types';
import { PreviewContextPanel } from '../ui/PreviewContextPanel';
import { LiveOverlayCanvas } from '../ui/LiveOverlayCanvas';
import { PreviewControlsPanel } from '../ui/PreviewControlsPanel';
import { PreviewLayerSourcePanel } from '../ui/PreviewLayerSourcePanel';
import { PreviewActivityStatusPanel } from '../ui/PreviewActivityStatusPanel';
import { PreviewTimelineControls } from '../ui/PreviewTimelineControls';
import { ActionButtonGroup } from '../ui/design-system-components';
import { showToast } from '../ui/Toast';
import { showConfirm } from '../ui/Dialogs';
import { useLyricPreview } from '../../hooks/useLyricPreview';

const API = API_BASE_URL;

type PreviewData = {
  url?: string;
  resolution?: string;
  size?: number;
  elapsedMs?: number;
  startAt?: number;
  duration?: number;
  logs?: string[];
  warnings?: string[];
  diagnostics?: { warnings?: string[]; safeArea?: unknown };
  safeArea?: { top: number; right: number; bottom: number; left: number };
  snapshot?: { url?: string; output?: string; size?: number };
};

export function PreviewPane({
  active,
  jobs,
  logs,
  refresh,
  config,
  updateConfig,
}: {
  active: ModuleKey;
  jobs: Job[];
  logs: string[];
  refresh: () => void;
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState('100');
  const [quality, setQuality] = useState(getDeep(config, 'preview.quality', 'draft'));
  const [startAt, setStartAt] = useState(Number(getDeep(config, 'preview.startAt', 0)));
  const [duration, setDuration] = useState(Number(getDeep(config, 'preview.duration', 4)));
  const [safePreset, setSafePreset] = useState(getDeep(config, 'preview.safeAreaPreset', 'youtube'));
  const [dragLive, setDragLive] = useState<LiveTarget | ''>('');
  const [resizeLive, setResizeLive] = useState<LiveTarget | ''>('');
  const [selectedLive, setSelectedLive] = useState<LiveTarget | ''>('');
  const [lockedLayers, setLockedLayers] = useState<Set<LiveTarget>>(new Set());
  const [activityView, setActivityView] = useState<'queue' | 'preview'>('queue');
  const [previewMode, setPreviewMode] = useState<'live' | 'rendered'>('live');
  const [panelView, setPanelView] = useState<'preview' | 'activity' | 'status' | 'realtime'>('preview');

  const startNext = useCallback(async () => {
    try {
      await api('/api/jobs/start-next', { method: 'POST' });
      showToast('success', 'Job berikutnya dimulai!');
      refresh();
    } catch (e: unknown) {
      showToast('error', `Gagal memulai job: ${errorMessage(e)}`);
    }
  }, [refresh]);

  const startQueue = useCallback(async () => {
    if (jobs.length === 0) {
      showToast('warning', 'Tidak ada job dalam antrian!');
      return;
    }
    try {
      await api('/api/queue/start', { method: 'POST' });
      showToast('success', 'Antrian dimulai!');
      refresh();
    } catch (e: unknown) {
      showToast('error', `Gagal memulai antrian: ${errorMessage(e)}`);
    }
  }, [refresh, jobs.length]);

  const reset = useCallback(async () => {
    if (await showConfirm('Reset semua antrian?')) {
      try {
        await api('/api/jobs/reset', { method: 'POST' });
        showToast('success', 'Antrian direset!');
        refresh();
      } catch (e: unknown) {
        showToast('error', `Gagal reset antrian: ${errorMessage(e)}`);
      }
    }
  }, [refresh]);

  const start = useCallback(
    async (id: string) => {
      try {
        await api(`/api/jobs/${id}/start`, { method: 'POST' });
        showToast('success', 'Job dimulai!');
        refresh();
      } catch (e: unknown) {
        showToast('error', `Gagal memulai job: ${errorMessage(e)}`);
      }
    },
    [refresh],
  );

  const cancel = useCallback(
    async (id: string) => {
      try {
        await api(`/api/jobs/${id}/cancel`, { method: 'POST' });
        showToast('success', 'Job dibatalkan!');
        refresh();
      } catch (e: unknown) {
        showToast('error', `Gagal membatalkan job: ${errorMessage(e)}`);
      }
    },
    [refresh],
  );

  const clearLogs = useCallback(async () => {
    try {
      await api('/api/logs/clear', { method: 'POST' });
      setPreviewLogs([]);
      showToast('success', 'Log dibersihkan!');
      refresh();
    } catch (e: unknown) {
      showToast('error', `Gagal membersihkan log: ${errorMessage(e)}`);
    }
  }, [refresh]);

  async function revealOutput(target?: string) {
    if (!target) return;
    const result = await window.pidioforge?.revealPath(target);
    if (!result?.ok) alert(result?.error || 'Buka folder hanya tersedia di aplikasi desktop.');
  }

  async function renderPreview() {
    const hasVisual = Boolean(getDeep(config, 'input.visual'));
    const hasAudio = Boolean(getDeep(config, 'input.audio'));
    const galleryActive =
      Boolean(getDeep(config, 'spectrum.gallery.enabled', false)) &&
      (getDeep(config, 'spectrum.gallery.images', []) as string[]).length > 0;

    if (!hasVisual && !galleryActive) {
      showToast('error', 'Pilih file visual atau aktifkan gallery terlebih dahulu!');
      return;
    }
    if (!hasAudio) {
      showToast('error', 'Pilih file audio terlebih dahulu!');
      return;
    }

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
  }

  async function snapshotPreview() {
    const hasVisual = Boolean(getDeep(config, 'input.visual'));
    const hasAudio = Boolean(getDeep(config, 'input.audio'));
    const galleryActive =
      Boolean(getDeep(config, 'spectrum.gallery.enabled', false)) &&
      (getDeep(config, 'spectrum.gallery.images', []) as string[]).length > 0;

    if (!hasVisual && !galleryActive) {
      showToast('error', 'Pilih file visual atau aktifkan gallery terlebih dahulu!');
      return;
    }
    if (!hasAudio) {
      showToast('error', 'Pilih file audio terlebih dahulu!');
      return;
    }

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
  }

  async function sendPreviewToQueue() {
    const hasVisual = Boolean(getDeep(config, 'input.visual'));
    const hasAudio = Boolean(getDeep(config, 'input.audio'));
    const galleryActive =
      Boolean(getDeep(config, 'spectrum.gallery.enabled', false)) &&
      (getDeep(config, 'spectrum.gallery.images', []) as string[]).length > 0;

    if (!hasVisual && !galleryActive) {
      showToast('error', 'Pilih file visual atau aktifkan gallery terlebih dahulu!');
      return;
    }
    if (!hasAudio) {
      showToast('error', 'Pilih file audio terlebih dahulu!');
      return;
    }

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
  }

  const previewPath = useMemo(
    () => previewData?.url || getDeep(config, 'preview.lastUrl', ''),
    [previewData?.url, config],
  );
  const previewUrl = useMemo(
    () => (previewPath && previewPath.startsWith('/api/') ? `${API}${previewPath}` : previewPath),
    [previewPath],
  );
  const snapshotPath = useMemo(
    () => previewData?.snapshot?.url || getDeep(config, 'preview.lastSnapshotUrl', ''),
    [previewData?.snapshot?.url, config],
  );
  const snapshotUrl = useMemo(
    () => (snapshotPath && snapshotPath.startsWith('/api/') ? `${API}${snapshotPath}` : snapshotPath),
    [snapshotPath],
  );
  const diag = useMemo(() => previewData?.diagnostics, [previewData?.diagnostics]);
  const safe = useMemo(
    () =>
      (previewData?.safeArea || diag?.safeArea) as
        { top: number; right: number; bottom: number; left: number } | undefined,
    [previewData?.safeArea, diag?.safeArea],
  );
  const visual = useMemo(() => getDeep(config, 'input.visual', ''), [config]);
  const visualType = useMemo(() => mediaKind(visual), [visual]);
  const livePreview = Boolean(visual && (visualType === 'video' || visualType === 'image'));
  const liveMediaUrl = livePreview ? fileUrl(visual) : '';
  const showRenderedPreview = Boolean(previewUrl && (!livePreview || previewMode === 'rendered'));
  const lyricPreviewLines = useLyricPreview(
    getDeep(config, 'lyrics.file', ''),
    Boolean(getDeep(config, 'lyrics.enabled', true)),
  );

  function positionPoint(position: string, marginX = 28, marginY = 28) {
    if (position === 'Tengah') return { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' };
    return {
      left: position.includes('Kiri') ? `${marginX}px` : undefined,
      right: position.includes('Kanan') ? `${marginX}px` : undefined,
      top: position.includes('Atas') ? `${marginY}px` : undefined,
      bottom: position.includes('Bawah') ? `${marginY}px` : undefined,
    };
  }

  function positionFromPoint(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      xPct: Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100)),
      yPct: Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100)),
      rect,
    };
  }

  function dragBranding(e: React.MouseEvent<HTMLElement>, target: LiveTarget | '' = dragLive) {
    if (!target) return;
    const { xPct, yPct, rect } = positionFromPoint(e);
    const pos = cornerPosition(xPct, yPct);
    const marginX = Math.round(pos.includes('Kiri') ? (xPct / 100) * rect.width : ((100 - xPct) / 100) * rect.width);
    const marginY = Math.round(pos.includes('Atas') ? (yPct / 100) * rect.height : ((100 - yPct) / 100) * rect.height);
    if (target === 'logo') {
      updateConfig('branding.logoPosition', pos);
      if (pos !== 'Tengah') {
        updateConfig('branding.logoMarginX', Math.max(4, marginX));
        updateConfig('branding.logoMarginY', Math.max(4, marginY));
      }
    }
    if (target === 'cta') updateConfig('branding.ctaPosition', pos);
    if (target === 'watermark') updateConfig('branding.watermarkPosition', pos);
  }

  function dragLiveItem(e: React.MouseEvent<HTMLElement>, target = dragLive) {
    if (!target) return;
    if (target === 'logo' || target === 'cta' || target === 'watermark') {
      dragBranding(e, target);
      return;
    }
    const { xPct, yPct } = positionFromPoint(e);
    if (target === 'nowPlaying') {
      updateConfig('spectrum.nowPlayingX', Math.round(xPct));
      updateConfig('spectrum.nowPlayingY', Math.round(yPct));
      updateConfig('spectrum.nowPlayingPosition', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'spectrum') {
      updateConfig('spectrum.previewY', Math.round(yPct));
      updateConfig('spectrum.y', Math.round(yPct - 50));
      updateConfig('spectrum.position', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'timestamp') updateConfig('overlay.timestampPosition', cornerPosition(xPct, yPct));
    if (target === 'lowerThird')
      updateConfig('overlay.lowerThirdPosition', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
    if (target === 'lyrics') updateConfig('lyrics.position', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
  }

  function selectLive(e: React.MouseEvent<HTMLElement>, target: LiveTarget) {
    if (lockedLayers.has(target)) return;
    setSelectedLive(target);
    setDragLive(target);
    e.currentTarget.focus();
    dragLiveItem(e, target);
  }

  function resizeLiveItem(e: React.MouseEvent<HTMLElement>, target = resizeLive) {
    if (!target) return;
    const { xPct, yPct } = positionFromPoint(e);
    if (target === 'logo') updateConfig('branding.logoScale', Math.max(5, Math.min(100, Math.round(xPct))));
    if (target === 'cta') updateConfig('branding.ctaScale', Math.max(5, Math.min(100, Math.round(xPct))));
    if (target === 'spectrum')
      updateConfig('spectrum.height', Math.max(32, Math.min(300, Math.round(300 - (yPct / 100) * 220))));
    if (target === 'nowPlaying')
      updateConfig('spectrum.nowPlayingFontSize', Math.max(12, Math.min(60, Math.round(60 - (yPct / 100) * 40))));
  }

  function startResizeLive(e: React.MouseEvent<HTMLElement>, target: LiveTarget) {
    e.preventDefault();
    e.stopPropagation();
    if (lockedLayers.has(target)) return;
    setSelectedLive(target);
    setResizeLive(target);
    resizeLiveItem(e, target);
  }

  function nextCornerByNudge(position: string, dx: number, dy: number) {
    const x = position.includes('Kiri') ? 25 : position.includes('Kanan') ? 75 : 50;
    const y = position.includes('Atas') ? 25 : position.includes('Bawah') ? 75 : 50;
    return cornerPosition(Math.max(4, Math.min(96, x + dx)), Math.max(6, Math.min(94, y + dy)));
  }

  function handleLiveKey(e: React.KeyboardEvent<HTMLElement>, target: LiveTarget = selectedLive as LiveTarget) {
    if (!target || lockedLayers.has(target) || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key))
      return;
    e.preventDefault();
    const step = e.shiftKey ? 5 : 1;
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
    if (target === 'nowPlaying') {
      const x = Math.max(4, Math.min(96, Number(getDeep(config, 'spectrum.nowPlayingX', 50)) + dx));
      const y = Math.max(6, Math.min(94, Number(getDeep(config, 'spectrum.nowPlayingY', 14)) + dy));
      updateConfig('spectrum.nowPlayingX', x);
      updateConfig('spectrum.nowPlayingY', y);
      updateConfig('spectrum.nowPlayingPosition', y < 34 ? 'Atas' : y > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'spectrum') {
      const y = Math.max(6, Math.min(94, Number(getDeep(config, 'spectrum.previewY', 74)) + dy));
      updateConfig('spectrum.previewY', y);
      updateConfig('spectrum.y', y - 50);
      updateConfig('spectrum.position', y < 34 ? 'Atas' : y > 66 ? 'Bawah' : 'Tengah');
    }
    if (target === 'logo') {
      updateConfig(
        'branding.logoMarginX',
        Math.max(
          4,
          Number(getDeep(config, 'branding.logoMarginX', 20)) +
            (getDeep(config, 'branding.logoPosition', 'Kanan Atas').includes('Kiri') ? dx : -dx),
        ),
      );
      updateConfig(
        'branding.logoMarginY',
        Math.max(
          4,
          Number(getDeep(config, 'branding.logoMarginY', 20)) +
            (getDeep(config, 'branding.logoPosition', 'Kanan Atas').includes('Atas') ? dy : -dy),
        ),
      );
    }
    if (target === 'cta')
      updateConfig(
        'branding.ctaPosition',
        nextCornerByNudge(getDeep(config, 'branding.ctaPosition', 'Kanan Bawah'), dx * 8, dy * 8),
      );
    if (target === 'watermark')
      updateConfig(
        'branding.watermarkPosition',
        nextCornerByNudge(getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah'), dx * 8, dy * 8),
      );
    if (target === 'timestamp')
      updateConfig(
        'overlay.timestampPosition',
        nextCornerByNudge(getDeep(config, 'overlay.timestampPosition', 'Kiri Atas'), dx * 8, dy * 8),
      );
    if (target === 'lowerThird') {
      const cur = getDeep(config, 'overlay.lowerThirdPosition', 'Bawah');
      if (dy < 0) updateConfig('overlay.lowerThirdPosition', cur === 'Bawah' ? 'Tengah' : 'Atas');
      if (dy > 0) updateConfig('overlay.lowerThirdPosition', cur === 'Atas' ? 'Tengah' : 'Bawah');
    }
    if (target === 'lyrics') {
      const cur = getDeep(config, 'lyrics.position', 'Bawah');
      if (dy < 0) updateConfig('lyrics.position', cur === 'Bawah' ? 'Tengah' : 'Atas');
      if (dy > 0) updateConfig('lyrics.position', cur === 'Atas' ? 'Tengah' : 'Bawah');
    }
  }

  const liveBranding = livePreview;
  const resolvedLayerOrder = String(
    getDeep(
      config,
      'branding.layerOrder',
      'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird',
    ),
  )
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  function layerStackIndex(id: LiveTarget): number {
    const idx = resolvedLayerOrder.indexOf(id);
    return idx === -1 ? resolvedLayerOrder.length : idx;
  }

  const logoStyle = {
    ...positionPoint(
      getDeep(config, 'branding.logoPosition', 'Kanan Atas'),
      Number(getDeep(config, 'branding.logoMarginX', 28)),
      Number(getDeep(config, 'branding.logoMarginY', 28)),
    ),
    opacity: Number(getDeep(config, 'branding.logoOpacity', 100)) / 100,
    width: `${Math.max(42, Number(getDeep(config, 'branding.logoScale', 18)) * 3)}px`,
    zIndex: layerStackIndex('logo') + 10,
  };
  const ctaStyle = {
    ...positionPoint(getDeep(config, 'branding.ctaPosition', 'Kanan Bawah'), 28, 28),
    width: `${Math.max(76, Number(getDeep(config, 'branding.ctaScale', 26)) * 4)}px`,
    zIndex: layerStackIndex('cta') + 10,
  };
  const watermarkStyle = {
    ...positionPoint(getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah'), 28, 28),
    opacity: Number(getDeep(config, 'branding.watermarkOpacity', 70)) / 100,
    zIndex: layerStackIndex('watermark') + 10,
  };
  const liveNowPlayingStyle = {
    left: `${Number(getDeep(config, 'spectrum.nowPlayingX', 50))}%`,
    top: `${Number(getDeep(config, 'spectrum.nowPlayingY', 14))}%`,
    color: getDeep(config, 'spectrum.nowPlayingColor', '#ffffff'),
    fontSize: `${Math.max(14, Math.min(32, Number(getDeep(config, 'spectrum.nowPlayingFontSize', 26))))}px`,
    zIndex: layerStackIndex('nowPlaying') + 10,
  };
  const liveSpectrumStyle = {
    top: `${Number(getDeep(config, 'spectrum.previewY', 74))}%`,
    height: `${Math.max(42, Math.min(130, Math.round(Number(getDeep(config, 'spectrum.height', 128)) * 0.42)))}px`,
    opacity: Number(getDeep(config, 'spectrum.transparency', 80)) / 100,
    zIndex: layerStackIndex('spectrum') + 10,
  };
  const liveLayers: Array<{ id: LiveTarget; label: string; enabled: boolean; primary?: boolean }> = [
    {
      id: 'nowPlaying',
      label: 'Now Playing',
      enabled: Boolean(getDeep(config, 'spectrum.nowPlaying', true)),
      primary: true,
    },
    { id: 'spectrum', label: 'Spectrum', enabled: Boolean(getDeep(config, 'spectrum.enabled', true)), primary: true },
    {
      id: 'logo',
      label: 'Logo',
      enabled: Boolean(getDeep(config, 'branding.logoEnabled', true) && getDeep(config, 'branding.logo')),
    },
    { id: 'cta', label: 'CTA', enabled: Boolean(getDeep(config, 'branding.ctaEnabled', false)) },
    { id: 'watermark', label: 'Watermark', enabled: Boolean(getDeep(config, 'branding.watermarkEnabled', false)) },
    { id: 'timestamp', label: 'Timestamp', enabled: Boolean(getDeep(config, 'overlay.timestamp', false)) },
    { id: 'lowerThird', label: 'Lower Third', enabled: Boolean(getDeep(config, 'overlay.lowerThirdEnabled', false)) },
    {
      id: 'lyrics',
      label: 'Lirik',
      enabled: Boolean(getDeep(config, 'lyrics.enabled', true) && getDeep(config, 'lyrics.file', '')),
    },
  ];
  const liveLyricsStyle = {
    ...positionPoint(
      getDeep(config, 'lyrics.position', 'Bawah') === 'Atas'
        ? 'Kiri Atas'
        : getDeep(config, 'lyrics.position', 'Bawah') === 'Tengah'
          ? 'Tengah'
          : 'Kiri Bawah',
      28,
      28,
    ),
    left: '50%',
    transform: 'translateX(-50%)',
    color: getDeep(config, 'lyrics.color', '#ffffff'),
    zIndex: layerStackIndex('lyrics') + 10,
  };
  const currentJob = jobs.find(j => j.status === 'rendering') || null;
  const nextJob = jobs.find(j => j.status === 'standby') || null;
  const recentJob =
    currentJob || nextJob || [...jobs].reverse().find(j => ['failed', 'cancelled', 'done'].includes(j.status)) || null;
  const totalProgress = jobs.length
    ? Math.round(jobs.reduce((sum, item) => sum + Number(item.progress || 0), 0) / jobs.length)
    : 0;
  const renderStateLabel = currentJob
    ? 'Rendering'
    : nextJob
      ? 'Menunggu'
      : jobs.length
        ? 'Selesai / Tidak aktif'
        : 'Belum ada job';
  const activityLines = activityView === 'preview' ? previewLogs : logs.slice(-24);
  const visibleJobs = jobs
    .filter(j => ['rendering', 'standby', 'failed', 'cancelled'].includes(j.status))
    .concat(jobs.filter(j => j.status === 'done').slice(-3))
    .slice(0, 8);

  function centerLiveLayer(target: LiveTarget) {
    if (lockedLayers.has(target)) return;
    setSelectedLive(target);
    if (target === 'nowPlaying') {
      updateConfig('spectrum.nowPlayingX', 50);
      updateConfig('spectrum.nowPlayingY', 14);
      updateConfig('spectrum.nowPlayingPosition', 'Atas');
    }
    if (target === 'spectrum') {
      updateConfig('spectrum.previewY', 74);
      updateConfig('spectrum.y', 24);
      updateConfig('spectrum.position', 'Bawah');
    }
    if (target === 'logo') {
      updateConfig('branding.logoPosition', 'Kanan Atas');
      updateConfig('branding.logoMarginX', 28);
      updateConfig('branding.logoMarginY', 28);
    }
    if (target === 'cta') updateConfig('branding.ctaPosition', 'Kanan Bawah');
    if (target === 'watermark') updateConfig('branding.watermarkPosition', 'Kiri Bawah');
    if (target === 'timestamp') updateConfig('overlay.timestampPosition', 'Kiri Atas');
    if (target === 'lowerThird') updateConfig('overlay.lowerThirdPosition', 'Bawah');
    if (target === 'lyrics') updateConfig('lyrics.position', 'Bawah');
  }
  function toggleGrid() {
    updateConfig('preview.showGrid', !getDeep(config, 'preview.showGrid', false));
  }
  function toggleSafeArea() {
    updateConfig('preview.showSafeArea', !getDeep(config, 'preview.showSafeArea', true));
  }
  function toggleLayerVisibility(id: LiveTarget) {
    const pathMap: Record<LiveTarget, string> = {
      nowPlaying: 'spectrum.nowPlaying',
      spectrum: 'spectrum.enabled',
      logo: 'branding.logoEnabled',
      cta: 'branding.ctaEnabled',
      watermark: 'branding.watermarkEnabled',
      timestamp: 'overlay.timestamp',
      lowerThird: 'overlay.lowerThirdEnabled',
      lyrics: 'lyrics.enabled',
    };
    const path = pathMap[id];
    updateConfig(path, !getDeep(config, path, false));
  }
  function toggleLayerLock(id: LiveTarget) {
    setLockedLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="flex flex-col h-full bg-[var(--primary-bg)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--secondary-bg)]">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'preview', label: 'Preview' },
            { key: 'activity', label: 'Aktivitas' },
            { key: 'status', label: 'Status' },
            { key: 'realtime', label: 'Real-Time' },
          ].map(tab => (
            <button
              key={tab.key}
              className={cn(
                'px-4 py-2 min-h-[36px] text-[13px] font-bold rounded-[var(--radius-md)] border transition-all',
                panelView === tab.key
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary-hover)] shadow-[0_2px_8px_rgba(59,130,246,0.35)]'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-medium)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
              )}
              onClick={() => setPanelView(tab.key as typeof panelView)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div
          style={{
            transform: `scale(${Number(zoom) / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          }}
        >
          <LiveOverlayCanvas
            config={config}
            visual={visual}
            liveMediaUrl={liveMediaUrl}
            livePreview={liveBranding || active === 'spectrum' || active === 'overlay' || active === 'branding'}
            showRenderedPreview={showRenderedPreview}
            previewUrl={previewUrl}
            selectedLive={selectedLive}
            liveNowPlayingStyle={liveNowPlayingStyle}
            liveSpectrumStyle={liveSpectrumStyle}
            logoStyle={logoStyle}
            ctaStyle={ctaStyle}
            watermarkStyle={watermarkStyle}
            liveLyricsStyle={liveLyricsStyle}
            layerStackIndex={layerStackIndex}
            onMouseMove={e => {
              if (dragLive) dragLiveItem(e);
              if (resizeLive) resizeLiveItem(e);
            }}
            onMouseUp={() => {
              setDragLive('');
              setResizeLive('');
            }}
            onMouseLeave={() => {
              setDragLive('');
              setResizeLive('');
            }}
            onSelectLive={selectLive}
            onHandleLiveKey={handleLiveKey}
            onStartResizeLive={startResizeLive}
            onTitleBlur={title => updateConfig('input.title', title)}
            onWatermarkBlur={value => updateConfig('branding.watermarkText', value)}
            onTimestampBlur={value => updateConfig('overlay.timestampText', value)}
            onLowerThirdBlur={value => updateConfig('overlay.lowerThirdText', value)}
            lyricPreviewLines={lyricPreviewLines}
            safeArea={safe}
            showSafeArea={getDeep(config, 'preview.showSafeArea', true)}
            showGrid={getDeep(config, 'preview.showGrid', false)}
          />
        </div>

        <ActionButtonGroup
          actions={[
            {
              id: 'render-preview',
              label: 'Render Preview',
              icon: '🎬',
              variant: 'primary',
              disabled: busy,
              onClick: renderPreview,
            },
            {
              id: 'queue-preview',
              label: 'Ke Antrian',
              icon: '➕',
              variant: 'primary',
              disabled: busy,
              onClick: sendPreviewToQueue,
            },
            {
              id: 'snapshot-preview',
              label: 'Snapshot',
              icon: '📸',
              variant: 'secondary',
              disabled: busy,
              onClick: snapshotPreview,
            },
          ]}
        />

        <PreviewControlsPanel
          quality={quality}
          onQualityChange={setQuality}
          safePreset={safePreset}
          onSafePresetChange={setSafePreset}
          zoom={zoom}
          onZoomChange={setZoom}
          showModeToggle={Boolean(previewUrl && livePreview)}
          previewMode={previewMode}
          onToggleMode={() => setPreviewMode(previewMode === 'live' ? 'rendered' : 'live')}
        />

        <PreviewLayerSourcePanel
          liveLayers={liveLayers}
          selectedLive={selectedLive}
          lockedLayers={lockedLayers}
          onToggleLayerVisibility={toggleLayerVisibility}
          onSelectLive={setSelectedLive}
          onCenterLiveLayer={centerLiveLayer}
          onToggleLayerLock={toggleLayerLock}
          onResetSelectedLayer={() => selectedLive && centerLiveLayer(selectedLive)}
          canResetSelectedLayer={Boolean(selectedLive)}
          showSafeArea={getDeep(config, 'preview.showSafeArea', true)}
          showGrid={getDeep(config, 'preview.showGrid', false)}
          onToggleSafeArea={toggleSafeArea}
          onToggleGrid={toggleGrid}
          contextPanel={<PreviewContextPanel target={selectedLive} config={config} updateConfig={updateConfig} />}
        />

        <PreviewTimelineControls
          startAt={startAt}
          duration={duration}
          onStartAtChange={setStartAt}
          onDurationChange={setDuration}
        />

        <PreviewActivityStatusPanel
          panelView={panelView}
          activityView={activityView}
          setActivityView={setActivityView}
          activityLines={activityLines}
          clearLogs={clearLogs}
          quality={quality}
          safePreset={safePreset}
          previewData={previewData}
          startAt={startAt}
          duration={duration}
          config={config}
          snapshotUrl={snapshotUrl}
          currentJob={currentJob}
          nextJob={nextJob}
          recentJob={recentJob}
          totalProgress={totalProgress}
          renderStateLabel={renderStateLabel}
          visibleJobs={visibleJobs}
          totalJobCount={jobs.length}
          startQueue={startQueue}
          startNext={startNext}
          start={start}
          cancel={cancel}
          reset={reset}
          revealOutput={revealOutput}
          cleanUiText={cleanUiText}
          message={message}
          onRealtimeError={setMessage}
        />
      </div>
    </aside>
  );
}
