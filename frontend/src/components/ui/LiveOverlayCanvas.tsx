import React from 'react';
import { cn } from '../../utils/cn';
import { fileUrl, mediaKind, nowPlayingText } from '../../utils/media';
import { getDeep } from '../../lib/config-path';
import type { PidioConfig } from '../../types/app.types';
import type { LiveTarget } from '../../types/preview.types';

interface LiveOverlayCanvasProps {
  config: PidioConfig;
  visual: string;
  liveMediaUrl: string;
  livePreview: boolean;
  showRenderedPreview: boolean;
  previewUrl: string;
  selectedLive: LiveTarget | '';
  liveNowPlayingStyle: React.CSSProperties;
  liveSpectrumStyle: React.CSSProperties;
  logoStyle: React.CSSProperties;
  ctaStyle: React.CSSProperties;
  watermarkStyle: React.CSSProperties;
  liveLyricsStyle: React.CSSProperties;
  layerStackIndex: (id: LiveTarget) => number;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onSelectLive: (e: React.MouseEvent<HTMLElement>, target: LiveTarget) => void;
  onHandleLiveKey: (e: React.KeyboardEvent<HTMLElement>, target: LiveTarget) => void;
  onStartResizeLive: (e: React.MouseEvent<HTMLElement>, target: LiveTarget) => void;
  onTitleBlur: (title: string) => void;
  onWatermarkBlur: (value: string) => void;
  onTimestampBlur: (value: string) => void;
  onLowerThirdBlur: (value: string) => void;
  lyricPreviewLines: string[];
  safeArea?: { top: number; right: number; bottom: number; left: number };
  showSafeArea: boolean;
  showGrid: boolean;
}

export function LiveOverlayCanvas({
  config,
  visual,
  liveMediaUrl,
  livePreview,
  showRenderedPreview,
  previewUrl,
  selectedLive,
  liveNowPlayingStyle,
  liveSpectrumStyle,
  logoStyle,
  ctaStyle,
  watermarkStyle,
  liveLyricsStyle,
  layerStackIndex,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onSelectLive,
  onHandleLiveKey,
  onStartResizeLive,
  onTitleBlur,
  onWatermarkBlur,
  onTimestampBlur,
  onLowerThirdBlur,
  lyricPreviewLines,
  safeArea,
  showSafeArea,
  showGrid,
}: LiveOverlayCanvasProps) {
  const visualType = mediaKind(visual);

  return (
    <div
      className={cn(
        'relative w-full rounded-[var(--radius-lg)] overflow-hidden border-2 border-[var(--border-strong)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.5)]',
        livePreview ? 'bg-black' : 'bg-[var(--tertiary-bg)]',
      )}
      style={{ aspectRatio: '16/9', maxHeight: '65vh', width: '100%' }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      data-testid="live-overlay-canvas"
    >
      {showRenderedPreview ? (
        <video
          className="absolute inset-0 w-full h-full object-contain"
          src={previewUrl}
          controls
          autoPlay
          muted
          loop
        />
      ) : livePreview ? (
        <>
          {visual && visualType === 'video' && (
            <video
              key={visual}
              className="absolute inset-0 w-full h-full object-cover"
              src={liveMediaUrl}
              muted
              loop
              autoPlay
              playsInline
              controls
            />
          )}
          {visual && visualType === 'image' && (
            <img
              key={visual}
              className="absolute inset-0 w-full h-full object-cover"
              src={liveMediaUrl}
              alt="Preview"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 pointer-events-none" />

          {getDeep(config, 'spectrum.nowPlaying', true) && (
            <span
              tabIndex={0}
              data-testid="layer-nowPlaying"
              className={cn(
                'absolute cursor-move outline-none px-3 py-2 rounded-lg bg-black/30 border border-white/20',
                selectedLive === 'nowPlaying' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]',
              )}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => onTitleBlur(e.currentTarget.textContent || 'Now Playing')}
              onMouseDown={e => onSelectLive(e, 'nowPlaying')}
              onKeyDown={e => onHandleLiveKey(e, 'nowPlaying')}
              style={liveNowPlayingStyle}
            >
              {nowPlayingText(config)}
              {selectedLive === 'nowPlaying' && (
                <span
                  onMouseDown={e => onStartResizeLive(e, 'nowPlaying')}
                  className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-[var(--accent-primary)] border border-white cursor-nwse-resize"
                />
              )}
            </span>
          )}

          {getDeep(config, 'spectrum.enabled', true) && (
            <div
              tabIndex={0}
              data-testid="layer-spectrum"
              className={cn(
                'absolute left-6 right-6 flex items-end justify-center gap-1 cursor-move outline-none rounded-lg',
                selectedLive === 'spectrum' && 'ring-2 ring-[var(--accent-success)] bg-black/20',
              )}
              onMouseDown={e => onSelectLive(e, 'spectrum')}
              onKeyDown={e => onHandleLiveKey(e, 'spectrum')}
              style={liveSpectrumStyle}
            >
              {Array.from({ length: 48 }).map((_, i) => (
                <i
                  key={i}
                  className="flex-1 rounded-full"
                  style={{
                    height: `${12 + ((i * 19) % 72)}%`,
                    background:
                      i % 2
                        ? getDeep(config, 'spectrum.color2', '#38bdf8')
                        : getDeep(config, 'spectrum.color1', 'white'),
                    boxShadow: '0 0 8px currentColor',
                  }}
                />
              ))}
              {selectedLive === 'spectrum' && (
                <span
                  onMouseDown={e => onStartResizeLive(e, 'spectrum')}
                  className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-[var(--accent-success)] border border-white cursor-ns-resize"
                />
              )}
            </div>
          )}

          {getDeep(config, 'branding.logoEnabled', true) && getDeep(config, 'branding.logo') && (
            <span
              tabIndex={0}
              data-testid="layer-logo"
              className={cn(
                'absolute cursor-move outline-none p-2 rounded-lg border border-white/20',
                selectedLive === 'logo' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]',
              )}
              onMouseDown={e => onSelectLive(e, 'logo')}
              onKeyDown={e => onHandleLiveKey(e, 'logo')}
              style={logoStyle}
            >
              <img
                src={fileUrl(getDeep(config, 'branding.logo'))}
                className="w-full h-full object-contain"
                alt="Logo"
              />
              {selectedLive === 'logo' && (
                <span
                  onMouseDown={e => onStartResizeLive(e, 'logo')}
                  className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-[var(--accent-primary)] border border-white cursor-nwse-resize"
                />
              )}
            </span>
          )}

          {getDeep(config, 'branding.ctaEnabled', false) && (
            <span
              tabIndex={0}
              data-testid="layer-cta"
              className={cn(
                'absolute cursor-move outline-none px-4 py-2 rounded-lg bg-red-600/80 text-white font-bold border border-white/30',
                selectedLive === 'cta' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]',
              )}
              onMouseDown={e => onSelectLive(e, 'cta')}
              onKeyDown={e => onHandleLiveKey(e, 'cta')}
              style={ctaStyle}
            >
              {getDeep(config, 'branding.ctaGreenscreen') &&
              mediaKind(getDeep(config, 'branding.ctaGreenscreen')) === 'video' ? (
                <video
                  src={fileUrl(getDeep(config, 'branding.ctaGreenscreen'))}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                'SUBSCRIBE'
              )}
              {selectedLive === 'cta' && (
                <span
                  onMouseDown={e => onStartResizeLive(e, 'cta')}
                  className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-[var(--accent-primary)] border border-white cursor-nwse-resize"
                />
              )}
            </span>
          )}

          {getDeep(config, 'branding.watermarkEnabled', false) && (
            <span
              tabIndex={0}
              data-testid="layer-watermark"
              className={cn(
                'absolute cursor-move outline-none px-3 py-2 rounded-lg bg-black/30 text-white border border-white/20',
                selectedLive === 'watermark' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]',
              )}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => onWatermarkBlur(e.currentTarget.textContent || '')}
              onMouseDown={e => onSelectLive(e, 'watermark')}
              onKeyDown={e => onHandleLiveKey(e, 'watermark')}
              style={watermarkStyle}
            >
              {getDeep(config, 'branding.watermarkText', 'WATERMARK') || 'WATERMARK'}
            </span>
          )}

          {getDeep(config, 'overlay.timestamp', false) && (
            <span
              tabIndex={0}
              data-testid="layer-timestamp"
              className={cn(
                'absolute cursor-move outline-none px-3 py-1.5 rounded-full bg-black/50 text-white text-sm border border-white/20',
                selectedLive === 'timestamp' && 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]',
                getDeep(config, 'overlay.timestampPosition', 'Kiri Atas').replaceAll(' ', '-'),
              )}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => onTimestampBlur(e.currentTarget.textContent || 'Timestamp')}
              onMouseDown={e => onSelectLive(e, 'timestamp')}
              onKeyDown={e => onHandleLiveKey(e, 'timestamp')}
              style={{ zIndex: layerStackIndex('timestamp') + 10 }}
            >
              {getDeep(config, 'overlay.timestampText', 'Dirender oleh PidioForge')}
            </span>
          )}

          {getDeep(config, 'overlay.lowerThirdEnabled', false) && (
            <span
              tabIndex={0}
              data-testid="layer-lowerThird"
              className={cn(
                'absolute left-1/2 -translate-x-1/2 cursor-move outline-none px-6 py-3 rounded-lg bg-slate-900/80 text-white font-bold border-l-4 border-green-500',
                selectedLive === 'lowerThird' && 'ring-2 ring-[var(--accent-primary)]',
                getDeep(config, 'overlay.lowerThirdPosition', 'Bawah') === 'Atas' && 'top-12',
                getDeep(config, 'overlay.lowerThirdPosition', 'Bawah') === 'Tengah' && 'top-1/2 -translate-y-1/2',
                getDeep(config, 'overlay.lowerThirdPosition', 'Bawah') === 'Bawah' && 'bottom-12',
              )}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => onLowerThirdBlur(e.currentTarget.textContent || 'LOWER THIRD')}
              onMouseDown={e => onSelectLive(e, 'lowerThird')}
              onKeyDown={e => onHandleLiveKey(e, 'lowerThird')}
              style={{ zIndex: layerStackIndex('lowerThird') + 10 }}
            >
              {getDeep(config, 'overlay.lowerThirdText', 'LOWER THIRD') || 'LOWER THIRD'}
            </span>
          )}

          {Boolean(getDeep(config, 'lyrics.enabled', true) && getDeep(config, 'lyrics.file', '')) && (
            <span
              tabIndex={0}
              data-testid="layer-lyrics"
              className={cn(
                'absolute left-1/2 cursor-pointer outline-none px-4 py-2 text-center font-semibold drop-shadow-lg',
                selectedLive === 'lyrics' && 'ring-2 ring-[var(--accent-primary)] rounded-lg bg-black/20',
                getDeep(config, 'lyrics.position', 'Bawah') === 'Atas'
                  ? 'top-8'
                  : getDeep(config, 'lyrics.position', 'Bawah') === 'Tengah'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-8',
              )}
              onMouseDown={e => onSelectLive(e, 'lyrics')}
              onKeyDown={e => onHandleLiveKey(e, 'lyrics')}
              style={liveLyricsStyle}
            >
              {lyricPreviewLines.length > 0 ? lyricPreviewLines.join(' / ') : '(Contoh lirik sinkron)'}
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
                style={{ height: `${10 + ((i * 17) % 70)}px` }}
              />
            ))}
          </div>
          <div className="text-center">
            <b className="text-xl font-bold text-[var(--text-primary)]">PRODUCTION</b>
            <mark className="ml-2 px-2 py-1 bg-[var(--accent-success)] text-white rounded">RENDER</mark>
          </div>
        </div>
      )}

      {showSafeArea && (
        <div
          className="absolute border-2 border-dashed border-green-500/70 pointer-events-none"
          style={
            safeArea
              ? {
                  top: `${safeArea.top * 100}%`,
                  right: `${safeArea.right * 100}%`,
                  bottom: `${safeArea.bottom * 100}%`,
                  left: `${safeArea.left * 100}%`,
                }
              : undefined
          }
        />
      )}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '33.33% 33.33%',
          }}
        />
      )}
    </div>
  );
}
