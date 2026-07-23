import { useState, useMemo } from 'react';
import { cn } from '../../../utils/cn';
import { mediaKind, fileUrl } from '../../../utils/media';
import { getDeep } from '../../../lib/config-path';
import { cleanUiText } from '../../../lib/format';
import { PreviewContextPanel } from '../../ui/PreviewContextPanel';
import { LiveOverlayCanvas } from '../../ui/LiveOverlayCanvas';
import { PreviewControlsPanel } from '../../ui/PreviewControlsPanel';
import { PreviewLayerSourcePanel } from '../../ui/PreviewLayerSourcePanel';
import { PreviewActivityStatusPanel } from '../../ui/PreviewActivityStatusPanel';
import { PreviewTimelineControls } from '../../ui/PreviewTimelineControls';
import { ActionButtonGroup } from '../../ui/design-system-components';
import { useLyricPreview } from '../../../hooks/useLyricPreview';
import { useQueueActions } from './useQueueActions';
import { usePreviewActions } from './usePreviewActions';
import { useLiveDrag } from './useLiveDrag';
import type { PreviewPaneProps, PreviewData, LiveTarget } from './types';

export function PreviewPane({ active, jobs, logs, refresh, config, updateConfig }: PreviewPaneProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState('100');
  const [quality, setQuality] = useState(getDeep(config, 'preview.quality', 'draft'));
  const [startAt, setStartAt] = useState(Number(getDeep(config, 'preview.startAt', 0)));
  const [duration, setDuration] = useState(Number(getDeep(config, 'preview.duration', 4)));
  const [safePreset, setSafePreset] = useState(getDeep(config, 'preview.safeAreaPreset', 'youtube'));
  const [activityView, setActivityView] = useState<'queue' | 'preview'>('queue');
  const [previewMode, setPreviewMode] = useState<'live' | 'rendered'>('live');
  const [panelView, setPanelView] = useState<'preview' | 'activity' | 'status' | 'realtime'>('preview');

  const { startNext, startQueue, reset, start, cancel } = useQueueActions(jobs, refresh);

  const { renderPreview, snapshotPreview, sendPreviewToQueue, clearLogs } = usePreviewActions({
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
  });

  const {
    dragLive,
    setDragLive,
    resizeLive,
    setResizeLive,
    selectedLive,
    setSelectedLive,
    lockedLayers,
    layerStackIndex,
    positionPoint,
    dragLiveItem,
    selectLive,
    startResizeLive,
    handleLiveKey,
    centerLiveLayer,
    toggleLayerLock,
  } = useLiveDrag({ config, updateConfig });

  async function revealOutput(target?: string) {
    if (!target) return;
    const result = await window.pidioforge?.revealPath(target);
    if (!result?.ok) alert(result?.error || 'Buka folder hanya tersedia di aplikasi desktop.');
  }

  const previewPath = useMemo(
    () => previewData?.url || getDeep(config, 'preview.lastUrl', ''),
    [previewData?.url, config],
  );
  const previewUrl = useMemo(
    () => (previewPath && previewPath.startsWith('/api/') ? `http://127.0.0.1:8787${previewPath}` : previewPath),
    [previewPath],
  );
  const snapshotPath = useMemo(
    () => previewData?.snapshot?.url || getDeep(config, 'preview.lastSnapshotUrl', ''),
    [previewData?.snapshot?.url, config],
  );
  const snapshotUrl = useMemo(
    () => (snapshotPath && snapshotPath.startsWith('/api/') ? `http://127.0.0.1:8787${snapshotPath}` : snapshotPath),
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

  const liveBranding = livePreview;

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
              if (resizeLive) startResizeLive(e, resizeLive as LiveTarget);
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
