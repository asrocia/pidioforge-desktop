import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

type WaveformDisplayProps = {
  peaks: number[];
  duration?: number;
  currentTime?: number;
  height?: number;
  color?: string;
  progressColor?: string;
  backgroundColor?: string;
  className?: string;
  onClick?: (time: number) => void;
};

export function WaveformDisplay({
  peaks,
  duration = 0,
  currentTime = 0,
  height = 80,
  color = '#38bdf8',
  progressColor = '#22c55e',
  backgroundColor = 'transparent',
  className,
  onClick,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, rect.width, height);

    // Calculate bar width and spacing
    const barCount = peaks.length;
    const barWidth = Math.max(2, rect.width / barCount - 1);
    const spacing = Math.max(1, rect.width / barCount - barWidth);

    // Calculate progress position
    const progressX = duration > 0 ? (currentTime / duration) * rect.width : 0;

    // Draw waveform bars
    peaks.forEach((peak, i) => {
      const x = i * (barWidth + spacing);
      const normalizedPeak = Math.max(0, Math.min(1, peak));
      const barHeight = normalizedPeak * height * 0.9;
      const y = (height - barHeight) / 2;

      // Use progress color for bars before current time, regular color after
      ctx.fillStyle = x < progressX ? progressColor : color;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Draw progress line
    if (duration > 0 && currentTime > 0) {
      ctx.strokeStyle = progressColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }
  }, [peaks, duration, currentTime, height, color, progressColor, backgroundColor]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onClick || !duration || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;
    onClick(clickTime);
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      style={{ height: `${height}px` }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className={cn('w-full h-full', onClick ? 'cursor-pointer' : '')}
      />
      {peaks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-[12px]">
          No waveform data
        </div>
      )}
    </div>
  );
}

export function WaveformSkeleton({ height = 80, className }: { height?: number; className?: string }) {
  // Pre-generate random heights to avoid impure Math.random() during render
  const barHeights = React.useMemo(() =>
    Array.from({ length: 60 }, (_, i) => 20 + (i * 7 % 60)),
    []
  );

  return (
    <div
      className={cn('relative w-full bg-[var(--surface)] rounded-[var(--radius-sm)] overflow-hidden', className)}
      style={{ height: `${height}px` }}
    >
      <div className="absolute inset-0 flex items-center gap-1 px-2">
        {barHeights.map((barHeight, i) => (
          <div
            key={i}
            className="flex-1 bg-[var(--border-medium)] rounded-full animate-pulse"
            style={{
              height: `${barHeight}%`,
              animationDelay: `${i * 20}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
