import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { mediaKind, fileUrl, cornerPosition, nowPlayingText, copyText } from '../../utils/media';
import { getDeep } from '../../lib/config-path';
import { api, API_BASE_URL } from '../../lib/api';
import { cleanUiText, formatDuration, formatBytes } from '../../lib/format';
import { queueStatusLabel } from '../../constants/modules';
import type { ModuleKey, Job } from '../../types/app.types';

const API = API_BASE_URL;

export function PreviewPane({ active, jobs, logs, refresh, config, updateConfig }: { active: ModuleKey; jobs: Job[]; logs: string[]; refresh: () => void; config: any; updateConfig: (path: string, value: any) => void }) {
  const job = jobs.find(j => j.status === 'rendering') || jobs[0];
  type LiveTarget = 'logo' | 'cta' | 'watermark' | 'nowPlaying' | 'spectrum' | 'timestamp' | 'lowerThird';
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState('100');
  const [quality, setQuality] = useState(getDeep(config, 'preview.quality', 'draft'));
  const [startAt, setStartAt] = useState(Number(getDeep(config, 'preview.startAt', 0)));
  const [duration, setDuration] = useState(Number(getDeep(config, 'preview.duration', 4)));
  const [safePreset, setSafePreset] = useState(getDeep(config, 'preview.safeAreaPreset', 'youtube'));
  const [dragLive, setDragLive] = useState<LiveTarget | ''>('');
  const [selectedLive, setSelectedLive] = useState<LiveTarget | ''>('');
  const [activityView, setActivityView] = useState<'queue' | 'preview'>('queue');
  const [previewMode, setPreviewMode] = useState<'live' | 'rendered'>('live');
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [panelView, setPanelView] = useState<'preview' | 'activity' | 'status'>('preview');
  async function startNext() { await api('/api/jobs/start-next', { method: 'POST' }).catch(e => alert(e.message)); refresh(); }
  async function startQueue() { await api('/api/queue/start', { method: 'POST' }).catch(e => alert(e.message)); refresh(); }
  async function reset() { if (confirm('Reset semua antrian?')) { await api('/api/jobs/reset', { method: 'POST' }); refresh(); } }
  async function start(id: string) { await api(`/api/jobs/${id}/start`, { method: 'POST' }).catch(e => alert(e.message)); refresh(); }
  async function cancel(id: string) { await api(`/api/jobs/${id}/cancel`, { method: 'POST' }).catch(e => alert(e.message)); refresh(); }
  async function clearLogs() { await api('/api/logs/clear', { method: 'POST' }).catch(e => alert(e.message)); setPreviewLogs([]); refresh(); }
  async function revealOutput(target?: string) {
    if (!target) return;
    const result = await window.pidioforge?.revealPath(target);
    if (!result?.ok) alert(result?.error || 'Buka folder hanya tersedia di aplikasi desktop.');
  }
  async function diagnostics() {
    setBusy(true); setMessage('Memeriksa aset preview...');
    try { const data = await api('/api/preview/diagnostics', { method: 'POST', body: JSON.stringify({ config: { ...config, preview: { ...(config?.preview || {}), startAt, duration, quality, safeAreaPreset: safePreset } } }) }); setPreviewData((p: any) => ({ ...(p || {}), diagnostics: data, safeArea: data.safeArea })); setMessage(data.ok ? 'Preview asset siap.' : `Perhatian: ${(data.warnings || []).join(' ')}`); }
    catch (e: any) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function renderPreview() {
    setBusy(true); setMessage('Merender preview...'); setPreviewLogs([]);
    try {
      const patch = { preview: { quality, startAt, duration, safeAreaPreset: safePreset, width: getDeep(config, 'preview.width', 640), height: getDeep(config, 'preview.height', 360), fps: getDeep(config, 'preview.fps', 18), showSafeArea: getDeep(config, 'preview.showSafeArea', true), showGrid: getDeep(config, 'preview.showGrid', false) } };
      const data = await api('/api/preview/render', { method: 'POST', body: JSON.stringify({ config: patch, startAt, title: getDeep(config, 'input.title', 'Preview') }) });
      setPreviewData(data); setPreviewMode('rendered'); setPreviewLogs(data.logs || []); setMessage(`Preview siap / ${data.resolution} / ${(data.size/1024/1024).toFixed(2)} MB / ${Math.round(data.elapsedMs/1000)}s`); refresh();
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function snapshotPreview() {
    setBusy(true); setMessage('Mengambil snapshot...'); setPreviewLogs([]);
    try {
      const patch = { preview: { quality, startAt, duration: 1, safeAreaPreset: safePreset, width: getDeep(config, 'preview.width', 640), height: getDeep(config, 'preview.height', 360), fps: getDeep(config, 'preview.fps', 18) } };
      const data = await api('/api/preview/snapshot', { method: 'POST', body: JSON.stringify({ config: patch, startAt, title: getDeep(config, 'input.title', 'Preview') }) });
      setPreviewData((p: any) => ({ ...(p || {}), snapshot: data, safeArea: data.safeArea })); setPreviewLogs(data.logs || []); setMessage(`Snapshot siap / ${(data.size/1024).toFixed(1)} KB / detik ${data.startAt}`); refresh();
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function sendPreviewToQueue() {
    setBusy(true); setMessage('Mengirim preview ke antrian...');
    try {
      const data = await api('/api/preview/send-to-queue', { method: 'POST', body: JSON.stringify({ config, title: getDeep(config, 'input.title', 'Render dari Preview') }) });
      setMessage(`Masuk antrian: ${data.job?.title || 'job'}${data.warnings?.length ? ' / peringatan: ' + data.warnings.length : ''}`); refresh();
    } catch (e: any) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  const previewPath = previewData?.url || getDeep(config, 'preview.lastUrl', '');
  const previewUrl = previewPath && previewPath.startsWith('/api/') ? `${API}${previewPath}` : previewPath;
  const snapshotPath = previewData?.snapshot?.url || getDeep(config, 'preview.lastSnapshotUrl', '');
  const snapshotUrl = snapshotPath && snapshotPath.startsWith('/api/') ? `${API}${snapshotPath}` : snapshotPath;
  const diag = previewData?.diagnostics;
  const safe = previewData?.safeArea || diag?.safeArea;
  const visual = getDeep(config, 'input.visual', '');
  const visualType = mediaKind(visual);
  const livePreview = Boolean(visual && (visualType === 'video' || visualType === 'image'));
  const liveMediaUrl = livePreview ? fileUrl(visual) : '';
  const showRenderedPreview = Boolean(previewUrl && (!livePreview || previewMode === 'rendered'));
  useEffect(() => { setPreviewMode('live'); }, [visual]);
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
      if (pos !== 'Tengah') { updateConfig('branding.logoMarginX', Math.max(4, marginX)); updateConfig('branding.logoMarginY', Math.max(4, marginY)); }
    }
    if (target === 'cta') updateConfig('branding.ctaPosition', pos);
    if (target === 'watermark') updateConfig('branding.watermarkPosition', pos);
  }
  function dragLiveItem(e: React.MouseEvent<HTMLElement>, target = dragLive) {
    if (!target) return;
    if (target === 'logo' || target === 'cta' || target === 'watermark') { dragBranding(e, target); return; }
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
    if (target === 'lowerThird') updateConfig('overlay.lowerThirdPosition', yPct < 34 ? 'Atas' : yPct > 66 ? 'Bawah' : 'Tengah');
  }
  function selectLive(e: React.MouseEvent<HTMLElement>, target: LiveTarget) {
    setSelectedLive(target);
    setDragLive(target);
    e.currentTarget.focus();
    dragLiveItem(e, target);
  }
  function nextCornerByNudge(position: string, dx: number, dy: number) {
    const x = position.includes('Kiri') ? 25 : position.includes('Kanan') ? 75 : 50;
    const y = position.includes('Atas') ? 25 : position.includes('Bawah') ? 75 : 50;
    return cornerPosition(Math.max(4, Math.min(96, x + dx)), Math.max(6, Math.min(94, y + dy)));
  }
  function handleLiveKey(e: React.KeyboardEvent<HTMLElement>, target: LiveTarget = selectedLive as LiveTarget) {
    if (!target || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
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
      updateConfig('branding.logoMarginX', Math.max(4, Number(getDeep(config, 'branding.logoMarginX', 20)) + (getDeep(config, 'branding.logoPosition', 'Kanan Atas').includes('Kiri') ? dx : -dx)));
      updateConfig('branding.logoMarginY', Math.max(4, Number(getDeep(config, 'branding.logoMarginY', 20)) + (getDeep(config, 'branding.logoPosition', 'Kanan Atas').includes('Atas') ? dy : -dy)));
    }
    if (target === 'cta') updateConfig('branding.ctaPosition', nextCornerByNudge(getDeep(config, 'branding.ctaPosition', 'Kanan Bawah'), dx * 8, dy * 8));
    if (target === 'watermark') updateConfig('branding.watermarkPosition', nextCornerByNudge(getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah'), dx * 8, dy * 8));
    if (target === 'timestamp') updateConfig('overlay.timestampPosition', nextCornerByNudge(getDeep(config, 'overlay.timestampPosition', 'Kiri Atas'), dx * 8, dy * 8));
    if (target === 'lowerThird') {
      const cur = getDeep(config, 'overlay.lowerThirdPosition', 'Bawah');
      if (dy < 0) updateConfig('overlay.lowerThirdPosition', cur === 'Bawah' ? 'Tengah' : 'Atas');
      if (dy > 0) updateConfig('overlay.lowerThirdPosition', cur === 'Atas' ? 'Tengah' : 'Bawah');
    }
  }
  const liveBranding = livePreview;
  const logoStyle = {
    ...positionPoint(getDeep(config, 'branding.logoPosition', 'Kanan Atas'), Number(getDeep(config, 'branding.logoMarginX', 28)), Number(getDeep(config, 'branding.logoMarginY', 28))),
    opacity: Number(getDeep(config, 'branding.logoOpacity', 100)) / 100,
    width: `${Math.max(42, Number(getDeep(config, 'branding.logoScale', 18)) * 3)}px`,
  };
  const ctaStyle = {
    ...positionPoint(getDeep(config, 'branding.ctaPosition', 'Kanan Bawah'), 28, 28),
    width: `${Math.max(76, Number(getDeep(config, 'branding.ctaScale', 26)) * 4)}px`,
  };
  const watermarkStyle = {
    ...positionPoint(getDeep(config, 'branding.watermarkPosition', 'Kiri Bawah'), 28, 28),
    opacity: Number(getDeep(config, 'branding.watermarkOpacity', 70)) / 100,
  };
  const liveNowPlayingStyle = {
    left: `${Number(getDeep(config, 'spectrum.nowPlayingX', 50))}%`,
    top: `${Number(getDeep(config, 'spectrum.nowPlayingY', 14))}%`,
    color: getDeep(config, 'spectrum.nowPlayingColor', '#ffffff'),
    fontSize: `${Math.max(14, Math.min(32, Number(getDeep(config, 'spectrum.nowPlayingFontSize', 26))))}px`,
  };
  const liveSpectrumStyle = {
    top: `${Number(getDeep(config, 'spectrum.previewY', 74))}%`,
    height: `${Math.max(42, Math.min(130, Math.round(Number(getDeep(config, 'spectrum.height', 128)) * 0.42)))}px`,
    opacity: Number(getDeep(config, 'spectrum.transparency', 80)) / 100,
  };
  const liveLayers: Array<{ id: LiveTarget; label: string; enabled: boolean; primary?: boolean }> = [
    { id: 'nowPlaying', label: 'Now Playing', enabled: Boolean(getDeep(config, 'spectrum.nowPlaying', true)), primary: true },
    { id: 'spectrum', label: 'Spectrum', enabled: Boolean(getDeep(config, 'spectrum.enabled', true)), primary: true },
    { id: 'logo', label: 'Logo', enabled: Boolean(getDeep(config, 'branding.logoEnabled', true) && getDeep(config, 'branding.logo')) },
    { id: 'cta', label: 'CTA', enabled: Boolean(getDeep(config, 'branding.ctaEnabled', false)) },
    { id: 'watermark', label: 'Watermark', enabled: Boolean(getDeep(config, 'branding.watermarkEnabled', false)) },
    { id: 'timestamp', label: 'Timestamp', enabled: Boolean(getDeep(config, 'overlay.timestamp', false)) },
    { id: 'lowerThird', label: 'Lower Third', enabled: Boolean(getDeep(config, 'overlay.lowerThirdEnabled', false)) },
  ];
  const queueCounts = jobs.reduce<Record<string, number>>((acc, item) => {
    acc[item.status || 'standby'] = (acc[item.status || 'standby'] || 0) + 1;
    return acc;
  }, {});
  const currentJob = jobs.find(j => j.status === 'rendering') || null;
  const nextJob = jobs.find(j => j.status === 'standby') || null;
  const recentJob = currentJob || nextJob || [...jobs].reverse().find(j => ['failed', 'cancelled', 'done'].includes(j.status)) || null;
  const totalProgress = jobs.length ? Math.round(jobs.reduce((sum, item) => sum + Number(item.progress || 0), 0) / jobs.length) : 0;
  const renderStateLabel = currentJob ? 'Rendering' : nextJob ? 'Menunggu' : jobs.length ? 'Selesai / Tidak aktif' : 'Belum ada job';
  const activityLines = activityView === 'preview' ? previewLogs : logs.slice(-24);
  const visibleJobs = jobs
    .filter(j => ['rendering', 'standby', 'failed', 'cancelled'].includes(j.status))
    .concat(jobs.filter(j => j.status === 'done').slice(-3))
    .slice(0, 8);
  function centerLiveLayer(target: LiveTarget) {
    setSelectedLive(target);
    if (target === 'nowPlaying') { updateConfig('spectrum.nowPlayingX', 50); updateConfig('spectrum.nowPlayingY', 14); updateConfig('spectrum.nowPlayingPosition', 'Atas'); }
    if (target === 'spectrum') { updateConfig('spectrum.previewY', 74); updateConfig('spectrum.y', 24); updateConfig('spectrum.position', 'Bawah'); }
    if (target === 'logo') { updateConfig('branding.logoPosition', 'Kanan Atas'); updateConfig('branding.logoMarginX', 28); updateConfig('branding.logoMarginY', 28); }
    if (target === 'cta') updateConfig('branding.ctaPosition', 'Kanan Bawah');
    if (target === 'watermark') updateConfig('branding.watermarkPosition', 'Kiri Bawah');
    if (target === 'timestamp') updateConfig('overlay.timestampPosition', 'Kiri Atas');
    if (target === 'lowerThird') updateConfig('overlay.lowerThirdPosition', 'Bawah');
  }
  function toggleGrid() { updateConfig('preview.showGrid', !Boolean(getDeep(config, 'preview.showGrid', false))); }
  function toggleSafeArea() { updateConfig('preview.showSafeArea', !Boolean(getDeep(config, 'preview.showSafeArea', true))); }
  return <aside className="flex flex-col h-full bg-[var(--primary-bg)] overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Pratinjau & Monitor</h2>
        <p className="text-[12px] text-[var(--text-muted)] mt-1">Live preview dan render queue</p>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
    <div 
      className={cn(
        "relative w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-medium)] shadow-[var(--shadow-lg)]",
        livePreview || active === 'spectrum' || active === 'overlay' || active === 'branding' ? 'bg-black' : 'bg-[var(--tertiary-bg)]'
      )}
      style={{ 
        height: '480px',
        transform: `scale(${Number(zoom)/100})`, 
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease'
      }}
      onMouseMove={e => dragLive && dragLiveItem(e)} 
      onMouseUp={() => setDragLive('')} 
      onMouseLeave={() => setDragLive('')}
    >
      {showRenderedPreview ? (
        <video className="absolute inset-0 w-full h-full object-contain" src={previewUrl} controls autoPlay muted loop />
      ) : liveBranding ? (
        <>
          {visual && visualType === 'video' && <video key={visual} className="absolute inset-0 w-full h-full object-cover" src={liveMediaUrl} muted loop autoPlay playsInline controls />}
          {visual && visualType === 'image' && <img key={visual} className="absolute inset-0 w-full h-full object-cover" src={liveMediaUrl} alt="Preview" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 pointer-events-none" />
          {getDeep(config, 'spectrum.nowPlaying', true) && (
            <span 
              tabIndex={0} 
              className={cn(
                "absolute cursor-move outline-none px-3 py-2 rounded-lg bg-black/30 border border-white/20",
                selectedLive === 'nowPlaying' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]'
              )}
              onMouseDown={e => selectLive(e, 'nowPlaying')} 
              onKeyDown={e => handleLiveKey(e, 'nowPlaying')} 
              style={liveNowPlayingStyle}
            >
              {nowPlayingText(config)}
            </span>
          )}
          {getDeep(config, 'spectrum.enabled', true) && (
            <div 
              tabIndex={0} 
              className={cn(
                "absolute left-6 right-6 flex items-end justify-center gap-1 cursor-move outline-none rounded-lg",
                selectedLive === 'spectrum' && 'ring-2 ring-[var(--accent-success)] bg-black/20'
              )}
              onMouseDown={e => selectLive(e, 'spectrum')} 
              onKeyDown={e => handleLiveKey(e, 'spectrum')} 
              style={liveSpectrumStyle}
            >
              {Array.from({ length: 48 }).map((_, i) => (
                <i 
                  key={i} 
                  className="flex-1 rounded-full" 
                  style={{ 
                    height: `${12 + (i * 19) % 72}%`, 
                    background: i % 2 ? getDeep(config, 'spectrum.color2', '#38bdf8') : getDeep(config, 'spectrum.color1', 'white'),
                    boxShadow: '0 0 8px currentColor'
                  }} 
                />
              ))}
            </div>
          )}
          {getDeep(config, 'branding.logoEnabled', true) && getDeep(config, 'branding.logo') && (
            <span 
              tabIndex={0} 
              className={cn(
                "absolute cursor-move outline-none p-2 rounded-lg border border-white/20",
                selectedLive === 'logo' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]'
              )}
              onMouseDown={e => selectLive(e, 'logo')} 
              onKeyDown={e => handleLiveKey(e, 'logo')} 
              style={logoStyle}
            >
              <img src={fileUrl(getDeep(config, 'branding.logo'))} className="w-full h-full object-contain" alt="Logo" />
            </span>
          )}
          {getDeep(config, 'branding.ctaEnabled', false) && (
            <span 
              tabIndex={0} 
              className={cn(
                "absolute cursor-move outline-none px-4 py-2 rounded-lg bg-red-600/80 text-white font-bold border border-white/30",
                selectedLive === 'cta' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]'
              )}
              onMouseDown={e => selectLive(e, 'cta')} 
              onKeyDown={e => handleLiveKey(e, 'cta')} 
              style={ctaStyle}
            >
              {getDeep(config, 'branding.ctaGreenscreen') && mediaKind(getDeep(config, 'branding.ctaGreenscreen')) === 'video' ? (
                <video src={fileUrl(getDeep(config, 'branding.ctaGreenscreen'))} muted loop autoPlay playsInline className="w-full h-full object-contain" />
              ) : 'SUBSCRIBE'}
            </span>
          )}
          {getDeep(config, 'branding.watermarkEnabled', false) && (
            <span 
              tabIndex={0} 
              className={cn(
                "absolute cursor-move outline-none px-3 py-2 rounded-lg bg-black/30 text-white border border-white/20",
                selectedLive === 'watermark' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]'
              )}
              contentEditable 
              suppressContentEditableWarning 
              onBlur={e => updateConfig('branding.watermarkText', e.currentTarget.textContent || '')} 
              onMouseDown={e => selectLive(e, 'watermark')} 
              onKeyDown={e => handleLiveKey(e, 'watermark')} 
              style={watermarkStyle}
            >
              {getDeep(config, 'branding.watermarkText', 'WATERMARK') || 'WATERMARK'}
            </span>
          )}
          {getDeep(config, 'overlay.timestamp', false) && (
            <span 
              tabIndex={0} 
              className={cn(
                "absolute cursor-move outline-none px-3 py-1.5 rounded-full bg-black/50 text-white text-sm border border-white/20",
                selectedLive === 'timestamp' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]',
                getDeep(config, 'overlay.timestampPosition', 'Kiri Atas').replaceAll(' ', '-')
              )}
              onMouseDown={e => selectLive(e, 'timestamp')} 
              onKeyDown={e => handleLiveKey(e, 'timestamp')}
            >
              {getDeep(config, 'overlay.timestampText', 'Dirender oleh PidioForge')}
            </span>
          )}
          {getDeep(config, 'overlay.lowerThirdEnabled', false) && (
            <span 
              tabIndex={0} 
              className={cn(
                "absolute left-1/2 -translate-x-1/2 cursor-move outline-none px-6 py-3 rounded-lg bg-slate-900/80 text-white font-bold border-l-4 border-green-500",
                selectedLive === 'lowerThird' && 'ring-2 ring-[var(--accent-primary)]',
                getDeep(config, 'overlay.lowerThirdPosition', 'Bawah') === 'Atas' && 'top-12',
                getDeep(config, 'overlay.lowerThirdPosition', 'Bawah') === 'Tengah' && 'top-1/2 -translate-y-1/2',
                getDeep(config, 'overlay.lowerThirdPosition', 'Bawah') === 'Bawah' && 'bottom-12'
              )}
              onMouseDown={e => selectLive(e, 'lowerThird')} 
              onKeyDown={e => handleLiveKey(e, 'lowerThird')}
            >
              {getDeep(config, 'overlay.lowerThirdText', 'LOWER THIRD') || 'LOWER THIRD'}
            </span>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
          <span className="text-lg">Preview Standby</span>
          <div className="flex items-end gap-1 h-20">
            {Array.from({ length: 42 }).map((_, i) => (
              <div 
                key={i} 
                className="w-2 bg-gradient-to-t from-[var(--accent-success)] to-[var(--accent-primary)] rounded-t"
                style={{ height: `${10 + (i * 17) % 70}px` }}
              />
            ))}
          </div>
          <div className="text-center">
            <b className="text-xl font-bold text-[var(--text-primary)]">PRODUCTION</b>
            <mark className="ml-2 px-2 py-1 bg-[var(--accent-success)] text-white rounded">RENDER</mark>
          </div>
        </div>
      )}
      {getDeep(config, 'preview.showSafeArea', true) && (
        <div 
          className="absolute border-2 border-dashed border-green-500/70 pointer-events-none" 
          style={safe ? { 
            top: `${safe.top*100}%`, 
            right: `${safe.right*100}%`, 
            bottom: `${safe.bottom*100}%`, 
            left: `${safe.left*100}%` 
          } : undefined} 
        />
      )}
      {getDeep(config, 'preview.showGrid', false) && (
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '33.33% 33.33%'
          }}
        />
      )}
    </div>
    <div className="grid grid-cols-4 gap-3">
      <button 
        onClick={renderPreview} 
        disabled={busy}
        className="px-4 py-3 bg-[var(--accent-primary)] border border-[var(--accent-primary-hover)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Render
      </button>
      <button 
        onClick={snapshotPreview} 
        disabled={busy}
        className="px-4 py-3 bg-[var(--accent-primary)] border border-[var(--accent-primary-hover)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Snapshot
      </button>
      <button 
        onClick={sendPreviewToQueue} 
        disabled={busy}
        className="px-4 py-3 bg-[var(--accent-success)] border border-[var(--accent-success-hover)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-success-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Kirim ke Antrian
      </button>
      <button 
        onClick={diagnostics} 
        disabled={busy}
        className="px-4 py-3 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Diagnostik
      </button>
    </div>
    <div className="grid grid-cols-4 gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-[12px] text-[var(--text-secondary)] font-medium">Mutu</span>
        <select 
          value={quality} 
          onChange={e => setQuality(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] min-h-[38px] px-3 py-2"
        >
          <option value="draft">Draf</option>
          <option value="normal">Normal</option>
          <option value="high">Tinggi</option>
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[12px] text-[var(--text-secondary)] font-medium">Area Aman</span>
        <select 
          value={safePreset} 
          onChange={e => setSafePreset(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] min-h-[38px] px-3 py-2"
        >
          <option value="youtube">YouTube</option>
          <option value="shorts">Shorts/Reels</option>
          <option value="square">Square</option>
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[12px] text-[var(--text-secondary)] font-medium">Zoom</span>
        <select 
          value={zoom} 
          onChange={e => setZoom(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] min-h-[38px] px-3 py-2"
        >
          <option>100</option>
          <option>75</option>
          <option>50</option>
        </select>
      </label>
      {previewUrl && livePreview && (
        <button 
          onClick={() => setPreviewMode(previewMode === 'live' ? 'rendered' : 'live')}
          className="mt-auto px-4 py-3 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--surface-hover)] transition-all"
        >
          {previewMode === 'live' ? 'Hasil Render' : 'Live File'}
        </button>
      )}
    </div>
    <div className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Layer Editor</h3>
        <span className="text-[12px] text-[var(--text-muted)]">
          {selectedLive ? liveLayers.find(x => x.id === selectedLive)?.label : 'Pilih layer'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {liveLayers.map(layer => (
          <button 
            key={layer.id} 
            type="button" 
            disabled={!layer.enabled} 
            className={cn(
              "px-3 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold border transition-all",
              selectedLive === layer.id 
                ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' 
                : layer.primary
                  ? 'bg-[var(--accent-success)]/10 border-[var(--accent-success)]/30 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/20'
                  : 'bg-[var(--surface)] border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
              !layer.enabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => setSelectedLive(layer.id)} 
            onDoubleClick={() => centerLiveLayer(layer.id)}
          >
            {layer.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button 
          type="button" 
          onClick={() => selectedLive && centerLiveLayer(selectedLive)} 
          disabled={!selectedLive}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Reset Posisi
        </button>
        <button 
          type="button" 
          onClick={toggleSafeArea}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
        >
          {getDeep(config, 'preview.showSafeArea', true) ? 'Safe Aktif' : 'Safe Mati'}
        </button>
        <button 
          type="button" 
          onClick={toggleGrid}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
        >
          {getDeep(config, 'preview.showGrid', false) ? 'Grid Aktif' : 'Grid Mati'}
        </button>
      </div>
    </div>
    <div className="grid grid-cols-[1fr_60px_1fr_60px] gap-3 items-center bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4">
      <label className="flex flex-col gap-2">
        <span className="text-[11px] text-[var(--text-muted)]">Mulai detik</span>
        <input 
          type="range" 
          min="0" 
          max="180" 
          value={startAt} 
          onChange={e => setStartAt(Number(e.target.value))}
          className="accent-[var(--accent-success)] w-full h-2 rounded-full cursor-pointer"
        />
      </label>
      <input 
        type="number" 
        value={startAt} 
        onChange={e => setStartAt(Number(e.target.value || 0))}
        className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] min-h-[38px] px-2 py-2 text-center"
      />
      <label className="flex flex-col gap-2">
        <span className="text-[11px] text-[var(--text-muted)]">Durasi</span>
        <input 
          type="range" 
          min="1" 
          max="12" 
          value={duration} 
          onChange={e => setDuration(Number(e.target.value))}
          className="accent-[var(--accent-success)] w-full h-2 rounded-full cursor-pointer"
        />
      </label>
      <input 
        type="number" 
        value={duration} 
        onChange={e => setDuration(Number(e.target.value || 1))}
        className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] min-h-[38px] px-2 py-2 text-center"
      />
    </div>
    <div className="grid grid-cols-6 gap-2">
      <button 
        onClick={() => setStartAt(0)}
        className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
      >
        Intro
      </button>
      <button 
        onClick={() => setStartAt(15)}
        className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
      >
        15s
      </button>
      <button 
        onClick={() => setStartAt(30)}
        className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
      >
        30s
      </button>
      <button 
        onClick={() => setStartAt(60)}
        className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
      >
        60s
      </button>
      <button 
        onClick={() => setStartAt(Math.max(0, startAt - 5))}
        className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
      >
        -5s
      </button>
      <button 
        onClick={() => setStartAt(startAt + 5)}
        className="px-3 py-2 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[12px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
      >
        +5s
      </button>
    </div>
    {message && (
      <div className={cn(
        "px-4 py-3 rounded-[var(--radius-lg)] border text-[13px]",
        cleanUiText(message).startsWith('Perlu perhatian') || cleanUiText(message).startsWith('Perhatian')
          ? 'bg-[var(--accent-warning)]/10 border-[var(--accent-warning)]/30 text-[var(--accent-warning)]'
          : 'bg-[var(--accent-success)]/10 border-[var(--accent-success)]/30 text-[var(--accent-success)]'
      )}>
        {cleanUiText(message)}
      </div>
    )}
    {(diag?.warnings?.length || previewData?.warnings?.length) && (
      <div className="bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/30 rounded-[var(--radius-lg)] p-4">
        <h4 className="text-[13px] font-semibold text-[var(--accent-warning)] mb-2">Catatan preview:</h4>
        <div className="space-y-1">
          {[...(diag?.warnings || []), ...(previewData?.warnings || [])].map((w: string, i: number) => (
            <p key={`${w}-${i}`} className="text-[12px] text-[var(--text-secondary)]">{cleanUiText(w)}</p>
          ))}
        </div>
      </div>
    )}
    {snapshotUrl && (
      <div className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4">
        <h4 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Snapshot frame</h4>
        <img src={snapshotUrl} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] mb-2" alt="Snapshot" />
        <p className="text-[11px] text-[var(--text-muted)]">{previewData?.snapshot?.output || getDeep(config, 'preview.lastSnapshotOutput', '')}</p>
      </div>
    )}
    <div className="grid grid-cols-5 gap-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4">
      <div className="text-center">
        <div className="text-[16px] font-bold text-[var(--text-primary)]">{previewData?.resolution || getDeep(config, 'preview.width', 640)+'x'+getDeep(config, 'preview.height', 360)}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">Resolusi</div>
      </div>
      <div className="text-center">
        <div className="text-[16px] font-bold text-[var(--text-primary)]">{previewData?.startAt ?? startAt}s</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">Mulai</div>
      </div>
      <div className="text-center">
        <div className="text-[16px] font-bold text-[var(--text-primary)]">{previewData?.duration || duration}s</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">Durasi</div>
      </div>
      <div className="text-center">
        <div className="text-[16px] font-bold text-[var(--text-primary)]">{safePreset}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">Area Aman</div>
      </div>
      <div className="text-center">
        <div className="text-[16px] font-bold text-[var(--text-primary)]">{quality}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">Kualitas</div>
      </div>
    </div>
    <div className="flex gap-2 border-b border-[var(--border-subtle)]">
      <button 
        className={cn(
          "px-4 py-3 text-[13px] font-semibold border-b-2 transition-all",
          panelView === 'preview' 
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        )}
        onClick={() => setPanelView('preview')}
      >
        Preview
      </button>
      <button 
        className={cn(
          "px-4 py-3 text-[13px] font-semibold border-b-2 transition-all",
          panelView === 'activity' 
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        )}
        onClick={() => setPanelView('activity')}
      >
        Aktivitas
      </button>
      <button 
        className={cn(
          "px-4 py-3 text-[13px] font-semibold border-b-2 transition-all",
          panelView === 'status' 
            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
        )}
        onClick={() => setPanelView('status')}
      >
        Status
      </button>
    </div>
    {panelView === 'preview' ? (
      <>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Aktivitas</h3>
          <div className="flex gap-2">
            <button 
              className={cn(
                "px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] transition-all",
                activityView === 'queue' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
              )}
              onClick={() => setActivityView('queue')}
            >
              Log
            </button>
            <button 
              className={cn(
                "px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] transition-all",
                activityView === 'preview' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
              )}
              onClick={() => setActivityView('preview')}
            >
              Pratinjau
            </button>
            <button 
              className="px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all"
              onClick={() => copyText(activityLines.join('\n'))}
            >
              Salin
            </button>
            <button 
              className="px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all"
              onClick={clearLogs}
            >
              Bersihkan
            </button>
          </div>
        </div>
        {showActivityLog ? (
          <pre className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 text-[11px] text-[var(--text-secondary)] font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
            {cleanUiText(activityLines.join('\n') || (activityView === 'preview' ? 'Belum ada log preview.' : 'Aplikasi siap.'))}
          </pre>
        ) : (
          <p className="text-[12px] text-[var(--text-muted)] text-center py-4">Aktivitas disembunyikan. Buka kalau perlu baca log.</p>
        )}
      </>
    ) : panelView === 'activity' ? (
      <>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Aktivitas</h3>
          <div className="flex gap-2">
            <button 
              className={cn(
                "px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] transition-all",
                activityView === 'queue' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
              )}
              onClick={() => setActivityView('queue')}
            >
              Log
            </button>
            <button 
              className={cn(
                "px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] transition-all",
                activityView === 'preview' 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
              )}
              onClick={() => setActivityView('preview')}
            >
              Pratinjau
            </button>
            <button 
              className="px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all"
              onClick={() => copyText(activityLines.join('\n'))}
            >
              Salin
            </button>
            <button 
              className="px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-all"
              onClick={clearLogs}
            >
              Bersihkan
            </button>
          </div>
        </div>
        <pre className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 text-[11px] text-[var(--text-secondary)] font-mono overflow-x-auto max-h-[400px] overflow-y-auto">
          {cleanUiText(activityLines.join('\n') || (activityView === 'preview' ? 'Belum ada log preview.' : 'Aplikasi siap.'))}
        </pre>
      </>
    ) : (
      <>
        <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-4">Status Render</h3>
        <div className={cn(
          "bg-[var(--tertiary-bg)] border rounded-[var(--radius-lg)] p-4 mb-4",
          currentJob ? 'border-[var(--accent-success)]' : nextJob ? 'border-[var(--accent-warning)]' : 'border-[var(--border-subtle)]'
        )}>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Status</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{renderStateLabel}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Batch</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{jobs.length}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Progress</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{totalProgress}%</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Aktif</div>
              <div className="text-[14px] font-bold text-[var(--accent-success)]">{queueCounts.rendering || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Siaga</div>
              <div className="text-[14px] font-bold text-[var(--accent-warning)]">{queueCounts.standby || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Gagal</div>
              <div className="text-[14px] font-bold text-[var(--accent-danger)]">{(queueCounts.failed || 0) + (queueCounts.cancelled || 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Elapsed</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{formatDuration(recentJob?.elapsedSeconds)}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">ETA</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{recentJob?.etaSeconds ? formatDuration(recentJob.etaSeconds) : '-'}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Speed</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{recentJob?.speed || '-'}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Ukuran</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{formatBytes(recentJob?.outputSize)}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Durasi</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{recentJob?.durationSeconds ? formatDuration(recentJob.durationSeconds) : '-'}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-[var(--text-muted)] mb-1">Rendered</div>
              <div className="text-[14px] font-bold text-[var(--text-primary)]">{recentJob?.renderedSeconds ? `${recentJob.renderedSeconds}s` : '-'}</div>
            </div>
          </div>
          <div className="relative w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden mb-3">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-success)] transition-all duration-300"
              style={{ width: `${currentJob?.progress ?? totalProgress}%` }}
            />
          </div>
          <div className="text-center">
            <div className="text-[14px] font-bold text-[var(--text-primary)] mb-1">{recentJob?.title || 'Tidak ada render aktif'}</div>
            <div className="text-[12px] text-[var(--text-muted)]">
              {recentJob ? `${queueStatusLabel(recentJob.status)} / ${recentJob.progress || 0}%` : 'Tambahkan job atau kirim preview ke antrian.'}
            </div>
          </div>
          {(recentJob?.output || recentJob?.outputDir) && (
            <div className="mt-3 p-2 bg-[var(--surface)] rounded-[var(--radius-sm)] text-[11px] text-[var(--text-secondary)] break-all">
              {recentJob.output || recentJob.outputDir}
            </div>
          )}
          {recentJob?.error && (
            <div className="mt-3 p-3 bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30 rounded-[var(--radius-sm)] text-[12px] text-[var(--accent-danger)]">
              {recentJob.error}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {visibleJobs.map(j => (
            <div 
              key={j.id} 
              className={cn(
                "bg-[var(--tertiary-bg)] border rounded-[var(--radius-lg)] p-4",
                j.status === 'rendering' && 'border-[var(--accent-success)]',
                j.status === 'standby' && 'border-[var(--accent-warning)]',
                j.status === 'failed' && 'border-[var(--accent-danger)]',
                j.status === 'cancelled' && 'border-[var(--accent-danger)]',
                j.status === 'done' && 'border-[var(--border-subtle)]'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-[var(--text-primary)] mb-1">{j.title}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {queueStatusLabel(j.status)} / {j.progress || 0}% / ETA {j.etaSeconds ? formatDuration(j.etaSeconds) : '-'}
                  </div>
                </div>
              </div>
              <div className="relative w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden mb-3">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all duration-300",
                    j.status === 'rendering' && 'bg-[var(--accent-success)]',
                    j.status === 'done' && 'bg-[var(--accent-primary)]',
                    j.status === 'failed' && 'bg-[var(--accent-danger)]',
                    j.status === 'cancelled' && 'bg-[var(--accent-danger)]',
                    j.status === 'standby' && 'bg-[var(--accent-warning)]'
                  )}
                  style={{ width: `${j.progress || 0}%` }}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => start(j.id)} 
                  disabled={j.status === 'rendering' || j.status === 'done'}
                  className="px-3 py-1.5 bg-[var(--accent-success)] border border-[var(--accent-success-hover)] text-white rounded-[var(--radius-sm)] text-[11px] font-semibold hover:bg-[var(--accent-success-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Mulai
                </button>
                {j.status === 'rendering' && (
                  <button 
                    onClick={() => cancel(j.id)}
                    className="px-3 py-1.5 bg-[var(--accent-danger)] border border-[var(--accent-danger)] text-white rounded-[var(--radius-sm)] text-[11px] font-semibold hover:opacity-90 transition-all"
                  >
                    Batal
                  </button>
                )}
                {(j.output || j.outputDir) && (
                  <button 
                    onClick={() => revealOutput(j.output || j.outputDir)}
                    className="px-3 py-1.5 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[11px] font-semibold hover:bg-[var(--surface-hover)] transition-all"
                  >
                    Folder
                  </button>
                )}
              </div>
              {j.error && (
                <div className="mt-3 p-2 bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30 rounded-[var(--radius-sm)] text-[11px] text-[var(--accent-danger)]">
                  {j.error}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button 
            onClick={startQueue}
            className="px-4 py-3 bg-[var(--accent-success)] border border-[var(--accent-success-hover)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-success-hover)] transition-all"
          >
            Mulai Antrian
          </button>
          <button 
            onClick={startNext}
            className="px-4 py-3 bg-[var(--accent-success)] border border-[var(--accent-success-hover)] text-white rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--accent-success-hover)] transition-all"
          >
            Mulai Berikutnya
          </button>
          {(recentJob?.output || recentJob?.outputDir) && (
            <button 
              onClick={() => revealOutput(recentJob.output || recentJob.outputDir)}
              className="px-4 py-3 bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-[var(--radius-sm)] font-semibold hover:bg-[var(--surface-hover)] transition-all"
            >
              Buka Output
            </button>
          )}
          <button 
            onClick={reset}
            className="px-4 py-3 bg-[var(--accent-danger)] border border-[var(--accent-danger)] text-white rounded-[var(--radius-sm)] font-semibold hover:opacity-90 transition-all"
          >
            Reset
          </button>
        </div>
      </>
    )}
    </div>
  </aside>;
}
