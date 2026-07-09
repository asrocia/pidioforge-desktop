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
  return <aside className="previewPane"><div className="previewPaneHead"><div><small>Output</small><h2>Pratinjau & Monitor</h2></div></div>
    <div className={`preview ${livePreview || active === 'spectrum' || active === 'overlay' || active === 'branding' ? 'ocean' : 'Siaga'} ${livePreview ? 'brandingLivePreview liveMediaPreview' : ''}`} onMouseMove={e => dragLive && dragLiveItem(e)} onMouseUp={() => setDragLive('')} onMouseLeave={() => setDragLive('')} style={{ transform: `scale(${Number(zoom)/100})`, transformOrigin: 'top center' }}>
      {showRenderedPreview ? <video className="realPreviewVideo" src={previewUrl} controls autoPlay muted loop /> : liveBranding ? <>
        {visual && visualType === 'video' && <video key={visual} className="brandBgMedia" src={liveMediaUrl} muted loop autoPlay playsInline controls />}
        {visual && visualType === 'image' && <img key={visual} className="brandBgMedia" src={liveMediaUrl} />}
        <i className="brandPreviewShade" />
        {getDeep(config, 'spectrum.nowPlaying', true) && <span tabIndex={0} className={`liveNowPlaying liveEditable ${selectedLive === 'nowPlaying' ? 'selected' : ''}`} onMouseDown={e => selectLive(e, 'nowPlaying')} onKeyDown={e => handleLiveKey(e, 'nowPlaying')} style={liveNowPlayingStyle}>{nowPlayingText(config)}</span>}
        {getDeep(config, 'spectrum.enabled', true) && <div tabIndex={0} className={`liveSpectrumBars liveEditable ${selectedLive === 'spectrum' ? 'selected' : ''}`} onMouseDown={e => selectLive(e, 'spectrum')} onKeyDown={e => handleLiveKey(e, 'spectrum')} style={liveSpectrumStyle}>{Array.from({ length: 48 }).map((_, i) => <i key={i} style={{ height: `${12 + (i * 19) % 72}%`, background: i % 2 ? getDeep(config, 'spectrum.color2', '#38bdf8') : getDeep(config, 'spectrum.color1', 'white') }} />)}</div>}
        {getDeep(config, 'branding.logoEnabled', true) && getDeep(config, 'branding.logo') && <span tabIndex={0} className={`brandLiveItem brandLogoLive liveEditable ${selectedLive === 'logo' ? 'selected' : ''}`} onMouseDown={e => selectLive(e, 'logo')} onKeyDown={e => handleLiveKey(e, 'logo')} style={logoStyle}><img src={fileUrl(getDeep(config, 'branding.logo'))} /></span>}
        {getDeep(config, 'branding.ctaEnabled', false) && <span tabIndex={0} className={`brandLiveItem brandCtaLive liveEditable ${selectedLive === 'cta' ? 'selected' : ''}`} onMouseDown={e => selectLive(e, 'cta')} onKeyDown={e => handleLiveKey(e, 'cta')} style={ctaStyle}>{getDeep(config, 'branding.ctaGreenscreen') && mediaKind(getDeep(config, 'branding.ctaGreenscreen')) === 'video' ? <video src={fileUrl(getDeep(config, 'branding.ctaGreenscreen'))} muted loop autoPlay playsInline /> : 'SUBSCRIBE'}</span>}
        {getDeep(config, 'branding.watermarkEnabled', false) && <span tabIndex={0} className={`brandLiveItem brandWatermarkLive liveEditable ${selectedLive === 'watermark' ? 'selected' : ''}`} contentEditable suppressContentEditableWarning onBlur={e => updateConfig('branding.watermarkText', e.currentTarget.textContent || '')} onMouseDown={e => selectLive(e, 'watermark')} onKeyDown={e => handleLiveKey(e, 'watermark')} style={watermarkStyle}>{getDeep(config, 'branding.watermarkText', 'WATERMARK') || 'WATERMARK'}</span>}
        {getDeep(config, 'overlay.timestamp', false) && <span tabIndex={0} className={`liveTimestamp liveEditable ${selectedLive === 'timestamp' ? 'selected' : ''} ${getDeep(config, 'overlay.timestampPosition', 'Kiri Atas').replaceAll(' ', '-')}`} onMouseDown={e => selectLive(e, 'timestamp')} onKeyDown={e => handleLiveKey(e, 'timestamp')}>{getDeep(config, 'overlay.timestampText', 'Dirender oleh PidioForge')}</span>}
        {getDeep(config, 'overlay.lowerThirdEnabled', false) && <span tabIndex={0} className={`liveLowerThird liveEditable ${selectedLive === 'lowerThird' ? 'selected' : ''} ${getDeep(config, 'overlay.lowerThirdPosition', 'Bawah')}`} onMouseDown={e => selectLive(e, 'lowerThird')} onKeyDown={e => handleLiveKey(e, 'lowerThird')}>{getDeep(config, 'overlay.lowerThirdText', 'LOWER THIRD') || 'LOWER THIRD'}</span>}
      </> : <><span>preview standby</span><div className="spectrumBars">{Array.from({ length: 42 }).map((_, i) => <i key={i} style={{ height: `${10 + (i * 17) % 70}px` }} />)}</div><b className="caption">PRODUCTION <mark>RENDER</mark></b></>}
      {getDeep(config, 'preview.showSafeArea', true) && <i className="safeAreaGuide" style={safe ? { top: `${safe.top*100}%`, right: `${safe.right*100}%`, bottom: `${safe.bottom*100}%`, left: `${safe.left*100}%` } : undefined} />}
      {getDeep(config, 'preview.showGrid', false) && <i className="gridGuide" />}
    </div>
    <div className="previewControls"><button onClick={renderPreview} disabled={busy}>Render</button><button onClick={snapshotPreview} disabled={busy}>Snapshot</button><button onClick={sendPreviewToQueue} disabled={busy} className="sendQueueBtn">Kirim ke Antrian</button><button onClick={diagnostics} disabled={busy} className="muted">Diagnostik</button>{previewUrl && livePreview && <button onClick={() => setPreviewMode(previewMode === 'live' ? 'rendered' : 'live')} className="muted">{previewMode === 'live' ? 'Hasil Render' : 'Live File'}</button>}<label>Mutu <select value={quality} onChange={e => setQuality(e.target.value)}><option value="draft">Draf</option><option value="normal">Normal</option><option value="high">Tinggi</option></select></label><label>Area Aman <select value={safePreset} onChange={e => setSafePreset(e.target.value)}><option value="youtube">YouTube</option><option value="shorts">Shorts/Reels</option><option value="square">Square</option></select></label><label>Zoom <select value={zoom} onChange={e => setZoom(e.target.value)}><option>100</option><option>75</option><option>50</option></select></label></div>
    <div className="layerEditor">
      <div className="layerHeader"><b>Layer</b><span>{selectedLive ? liveLayers.find(x => x.id === selectedLive)?.label : 'Pilih layer'}</span></div>
      <div className="layerList">{liveLayers.map(layer => <button key={layer.id} type="button" disabled={!layer.enabled} className={`${selectedLive === layer.id ? 'selected' : ''} ${layer.primary ? 'primaryLayer' : ''}`} onClick={() => setSelectedLive(layer.id)} onDoubleClick={() => centerLiveLayer(layer.id)}>{layer.label}</button>)}</div>
      <div className="layerTools"><button type="button" onClick={() => selectedLive && centerLiveLayer(selectedLive)} disabled={!selectedLive}>Reset Posisi</button><button type="button" onClick={toggleSafeArea}>{getDeep(config, 'preview.showSafeArea', true) ? 'Safe Aktif' : 'Safe Mati'}</button><button type="button" onClick={toggleGrid}>{getDeep(config, 'preview.showGrid', false) ? 'Grid Aktif' : 'Grid Mati'}</button></div>
    </div>
    <div className="previewScrubber"><label>Mulai detik <input type="range" min="0" max="180" value={startAt} onChange={e => setStartAt(Number(e.target.value))} /></label><input type="number" value={startAt} onChange={e => setStartAt(Number(e.target.value || 0))} /><label>Durasi <input type="range" min="1" max="12" value={duration} onChange={e => setDuration(Number(e.target.value))} /></label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value || 1))} /></div>
    <div className="previewRegions"><button onClick={() => setStartAt(0)}>Intro</button><button onClick={() => setStartAt(15)}>15s</button><button onClick={() => setStartAt(30)}>30s</button><button onClick={() => setStartAt(60)}>60s</button><button onClick={() => setStartAt(Math.max(0, startAt - 5))}>-5s</button><button onClick={() => setStartAt(startAt + 5)}>+5s</button></div>
    {message && <p className={cleanUiText(message).startsWith('Perlu perhatian') ? 'error' : 'ok'}>{cleanUiText(message)}</p>}
    {diag?.warnings?.length || previewData?.warnings?.length ? <div className="warningBox previewWarn"><b>Catatan preview:</b>{[...(diag?.warnings || []), ...(previewData?.warnings || [])].map((w: string, i: number) => <small key={`${w}-${i}`}>{cleanUiText(w)}</small>)}</div> : null}
    {snapshotUrl ? <div className="snapshotBox"><b>Snapshot frame</b><img src={snapshotUrl} /><small>{previewData?.snapshot?.output || getDeep(config, 'preview.lastSnapshotOutput', '')}</small></div> : null}
    <div className="previewMeta"><div><b>{previewData?.resolution || getDeep(config, 'preview.width', 640)+'x'+getDeep(config, 'preview.height', 360)}</b><small>Resolusi Pratinjau</small></div><div><b>{previewData?.startAt ?? startAt}s</b><small>Mulai</small></div><div><b>{previewData?.duration || duration}s</b><small>Durasi</small></div><div><b>{safePreset}</b><small>Area Aman</small></div><div><b>{quality}</b><small>Kualitas</small></div></div>
    <div className="paneTabs">
      <button className={panelView === 'preview' ? 'selected' : 'muted'} onClick={() => setPanelView('preview')}>Preview</button>
      <button className={panelView === 'activity' ? 'selected' : 'muted'} onClick={() => setPanelView('activity')}>Aktivitas</button>
      <button className={panelView === 'status' ? 'selected' : 'muted'} onClick={() => setPanelView('status')}>Status</button>
    </div>
    {panelView === 'preview' ? <>
      <div className="sectionHeadRow">
        <div className="logHeader"><h3>Aktivitas</h3><div><button className={activityView === 'queue' ? 'selected' : 'muted'} onClick={() => setActivityView('queue')}>Log</button><button className={activityView === 'preview' ? 'selected' : 'muted'} onClick={() => setActivityView('preview')}>Pratinjau</button><button className="muted" onClick={() => copyText(activityLines.join('\n'))}>Salin</button><button className="muted" onClick={clearLogs}>Bersihkan</button></div></div>
      </div>
      {showActivityLog ? <pre className="logBox">{cleanUiText(activityLines.join('\n') || (activityView === 'preview' ? 'Belum ada log preview.' : 'Aplikasi siap.'))}</pre> : <small className="collapsedHint">Aktivitas disembunyikan. Buka kalau perlu baca log.</small>}
    </> : panelView === 'activity' ? <>
      <div className="sectionHeadRow">
        <div className="logHeader"><h3>Aktivitas</h3><div><button className={activityView === 'queue' ? 'selected' : 'muted'} onClick={() => setActivityView('queue')}>Log</button><button className={activityView === 'preview' ? 'selected' : 'muted'} onClick={() => setActivityView('preview')}>Pratinjau</button><button className="muted" onClick={() => copyText(activityLines.join('\n'))}>Salin</button><button className="muted" onClick={clearLogs}>Bersihkan</button></div></div>
      </div>
      <pre className="logBox">{cleanUiText(activityLines.join('\n') || (activityView === 'preview' ? 'Belum ada log preview.' : 'Aplikasi siap.'))}</pre>
    </> : <>
      <h3 className="monitorTitle">Status Render</h3><div className={`monitor renderMonitor ${currentJob ? 'isRendering' : nextJob ? 'isWaiting' : ''}`}>
        <div><span>Status</span><b>{renderStateLabel}</b></div><div><span>Batch</span><b>{jobs.length}</b></div><div><span>Progress Total</span><b>{totalProgress}%</b></div><div><span>Aktif</span><b>{queueCounts.rendering || 0}</b></div><div><span>Siaga</span><b>{queueCounts.standby || 0}</b></div><div><span>Gagal</span><b>{(queueCounts.failed || 0) + (queueCounts.cancelled || 0)}</b></div><div><span>Elapsed</span><b>{formatDuration(recentJob?.elapsedSeconds)}</b></div><div><span>ETA</span><b>{recentJob?.etaSeconds ? formatDuration(recentJob.etaSeconds) : '-'}</b></div><div><span>Speed</span><b>{recentJob?.speed || '-'}</b></div><div><span>Ukuran</span><b>{formatBytes(recentJob?.outputSize)}</b></div><div><span>Durasi Media</span><b>{recentJob?.durationSeconds ? formatDuration(recentJob.durationSeconds) : '-'}</b></div><div><span>Render Detik</span><b>{recentJob?.renderedSeconds ? `${recentJob.renderedSeconds}s` : '-'}</b></div>
        <progress value={currentJob?.progress ?? totalProgress} max={100} />
        <p><b>{recentJob?.title || 'Tidak ada render aktif'}</b><small>{recentJob ? `${queueStatusLabel(recentJob.status)} / ${recentJob.progress || 0}%` : 'Tambahkan job atau kirim preview ke antrian.'}</small></p>
        {recentJob?.output || recentJob?.outputDir ? <em>{recentJob.output || recentJob.outputDir}</em> : null}
        {recentJob?.error ? <strong>{recentJob.error}</strong> : null}
      </div>
      <div className="jobList">{visibleJobs.map(j => <div className={`miniJob ${j.status}`} key={j.id}><b>{j.title}</b><span>{queueStatusLabel(j.status)} / {j.progress || 0}% / ETA {j.etaSeconds ? formatDuration(j.etaSeconds) : '-'}</span><progress value={j.progress || 0} max={100} /><div><button onClick={() => start(j.id)} disabled={j.status === 'rendering' || j.status === 'done'}>Mulai</button>{j.status === 'rendering' && <button onClick={() => cancel(j.id)}>Batal</button>}{(j.output || j.outputDir) && <button onClick={() => revealOutput(j.output || j.outputDir)}>Folder</button>}</div>{j.error && <em>{j.error}</em>}</div>)}</div><div className="actions"><button className="start" onClick={startQueue}>Mulai Antrian</button><button className="start" onClick={startNext}>Mulai Berikutnya</button>{(recentJob?.output || recentJob?.outputDir) && <button onClick={() => revealOutput(recentJob.output || recentJob.outputDir)}>Buka Output</button>}<button className="reset" onClick={reset}>Reset</button></div>
    </>}
  </aside>;
}
