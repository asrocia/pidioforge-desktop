import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

type TimelineMarker = {
  time: number;
  label: string;
  type: 'beat' | 'lyric' | 'section' | 'custom';
  color?: string;
};

type TimelineViewerProps = {
  duration: number;
  currentTime?: number;
  markers?: TimelineMarker[];
  onSeek?: (time: number) => void;
  height?: number;
  showTimecode?: boolean;
  className?: string;
};

export function TimelineViewer({
  duration,
  currentTime = 0,
  markers = [],
  onSeek,
  height = 60,
  showTimecode = true,
  className,
}: TimelineViewerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  function getTimeFromPosition(clientX: number): number {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return (x / rect.width) * duration;
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!onSeek) return;
    setIsDragging(true);
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  }

  function handleMouseMove(e: React.MouseEvent) {
    const time = getTimeFromPosition(e.clientX);
    setHoverTime(time);
    
    if (isDragging && onSeek) {
      onSeek(time);
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function handleMouseLeave() {
    setHoverTime(null);
    setIsDragging(false);
  }

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverPercent = hoverTime !== null && duration > 0 ? (hoverTime / duration) * 100 : null;

  // Generate time markers (every 10 seconds or appropriate interval)
  const timeInterval = duration > 120 ? 30 : duration > 60 ? 10 : 5;
  const timeMarkers = [];
  for (let t = 0; t <= duration; t += timeInterval) {
    timeMarkers.push(t);
  }

  return (
    <div className={cn('select-none', className)}>
      {/* Timeline Container */}
      <div
        ref={containerRef}
        className={cn(
          'relative bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] overflow-hidden',
          onSeek && 'cursor-pointer'
        )}
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Time Grid */}
        <div className="absolute inset-0 flex">
          {timeMarkers.map((time, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-[var(--border-subtle)]"
              style={{ left: `${(time / duration) * 100}%` }}
            />
          ))}
        </div>

        {/* Markers */}
        {markers.map((marker, i) => {
          const markerPercent = (marker.time / duration) * 100;
          const markerColor = marker.color || {
            beat: 'var(--accent-primary)',
            lyric: 'var(--accent-warning)',
            section: 'var(--accent-success)',
            custom: 'var(--text-muted)',
          }[marker.type];

          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-0.5 group"
              style={{ left: `${markerPercent}%`, backgroundColor: markerColor }}
              title={`${marker.label} (${formatTime(marker.time)})`}
            >
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border-medium)] rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {marker.label}
              </div>
            </div>
          );
        })}

        {/* Progress Bar */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-[var(--accent-primary)]/20 transition-all"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Current Time Indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-primary)] transition-all"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[var(--accent-primary)] rounded-full -mt-1" />
        </div>

        {/* Hover Indicator */}
        {hoverPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/50"
            style={{ left: `${hoverPercent}%` }}
          />
        )}

        {/* Time Labels */}
        {showTimecode && (
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 pb-1 text-[9px] text-[var(--text-muted)] pointer-events-none">
            {timeMarkers.map((time, i) => (
              <span key={i}>{formatTime(time)}</span>
            ))}
          </div>
        )}
      </div>

      {/* Timecode Display */}
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <div className="text-[var(--text-primary)] font-mono">
          {formatTime(currentTime)}
        </div>
        {hoverTime !== null && (
          <div className="text-[var(--text-muted)] font-mono">
            Hover: {formatTime(hoverTime)}
          </div>
        )}
        <div className="text-[var(--text-muted)] font-mono">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

export function TimelineMarkerLegend({ markers }: { markers: TimelineMarker[] }) {
  const markerTypes = Array.from(new Set(markers.map(m => m.type)));
  
  const typeInfo = {
    beat: { label: 'Beats', color: 'var(--accent-primary)', icon: '♪' },
    lyric: { label: 'Lyrics', color: 'var(--accent-warning)', icon: '📝' },
    section: { label: 'Sections', color: 'var(--accent-success)', icon: '📍' },
    custom: { label: 'Custom', color: 'var(--text-muted)', icon: '•' },
  };

  return (
    <div className="flex items-center gap-4 text-[10px]">
      {markerTypes.map(type => {
        const info = typeInfo[type];
        const count = markers.filter(m => m.type === type).length;
        return (
          <div key={type} className="flex items-center gap-1.5">
            <span style={{ color: info.color }}>{info.icon}</span>
            <span className="text-[var(--text-muted)]">
              {info.label} ({count})
            </span>
          </div>
        );
      })}
    </div>
  );
}
