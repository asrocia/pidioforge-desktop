import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { api } from '../../lib/api';

type PerformanceMetrics = {
  cpu: number;
  memory: number;
  activeRenders: number;
  queueSize: number;
  diskUsage?: number;
  networkUsage?: number;
  fps?: number;
  encodingSpeed?: string;
};

type PerformanceHistory = {
  timestamp: number;
  cpu: number;
  memory: number;
};

export function PerformanceMonitor({ className }: { className?: string }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cpu: 0,
    memory: 0,
    activeRenders: 0,
    queueSize: 0,
  });
  const [history, setHistory] = useState<PerformanceHistory[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const fetchMetrics = async () => {
      try {
        const data = await api('/api/performance/status');
        setMetrics(data.metrics || {});
        
        // Add to history (keep last 60 data points = 1 minute at 1s interval)
        setHistory(prev => {
          const newHistory = [
            ...prev,
            {
              timestamp: Date.now(),
              cpu: data.metrics?.cpu || 0,
              memory: data.metrics?.memory || 0,
            }
          ].slice(-60);
          return newHistory;
        });
      } catch (e) {
        console.error('Failed to fetch performance metrics:', e);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const cpuStatus = metrics.cpu > 80 ? 'critical' : metrics.cpu > 60 ? 'warning' : 'normal';
  const memStatus = metrics.memory > 85 ? 'critical' : metrics.memory > 70 ? 'warning' : 'normal';

  return (
    <div className={cn('bg-[var(--secondary-bg)] border border-[var(--border-medium)] rounded-[var(--radius-lg)]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Performance Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'px-2 py-1 text-[10px] font-semibold rounded transition-colors',
              autoRefresh
                ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
                : 'bg-[var(--tertiary-bg)] text-[var(--text-muted)]'
            )}
          >
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Compact View */}
      <div className="grid grid-cols-4 gap-3 p-3">
        <MetricCard
          label="CPU"
          value={metrics.cpu}
          unit="%"
          status={cpuStatus}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        />
        <MetricCard
          label="Memory"
          value={metrics.memory}
          unit="%"
          status={memStatus}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          }
        />
        <MetricCard
          label="Renders"
          value={metrics.activeRenders}
          unit=""
          status="normal"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Queue"
          value={metrics.queueSize}
          unit=""
          status="normal"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        />
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-subtle)] pt-3">
          {/* CPU History Graph */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">CPU Usage (Last 60s)</span>
              <span className="text-[var(--text-primary)] font-semibold">{metrics.cpu}%</span>
            </div>
            <MiniGraph data={history.map(h => h.cpu)} color="var(--accent-primary)" />
          </div>

          {/* Memory History Graph */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">Memory Usage (Last 60s)</span>
              <span className="text-[var(--text-primary)] font-semibold">{metrics.memory}%</span>
            </div>
            <MiniGraph data={history.map(h => h.memory)} color="var(--accent-success)" />
          </div>

          {/* Additional Metrics */}
          {metrics.encodingSpeed && (
            <div className="flex items-center justify-between text-[11px] px-3 py-2 bg-[var(--tertiary-bg)] rounded">
              <span className="text-[var(--text-muted)]">Encoding Speed</span>
              <span className="text-[var(--text-primary)] font-semibold">{metrics.encodingSpeed}</span>
            </div>
          )}
          {metrics.fps && (
            <div className="flex items-center justify-between text-[11px] px-3 py-2 bg-[var(--tertiary-bg)] rounded">
              <span className="text-[var(--text-muted)]">Preview FPS</span>
              <span className="text-[var(--text-primary)] font-semibold">{metrics.fps}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, status, icon }: { label: string; value: number; unit: string; status: 'normal' | 'warning' | 'critical'; icon: React.ReactNode }) {
  const statusColors = {
    normal: 'text-[var(--accent-success)]',
    warning: 'text-[var(--accent-warning)]',
    critical: 'text-[var(--accent-danger)]',
  };

  return (
    <div className="flex flex-col items-center text-center p-2 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
      <div className={cn('mb-1', statusColors[status])}>{icon}</div>
      <div className={cn('text-[16px] font-bold', statusColors[status])}>
        {value}{unit}
      </div>
      <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

function MiniGraph({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) {
    return <div className="h-12 bg-[var(--tertiary-bg)] rounded flex items-center justify-center text-[10px] text-[var(--text-muted)]">No data</div>;
  }

  const max = Math.max(...data, 1);
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (value / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-12 bg-[var(--tertiary-bg)] rounded overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border-subtle)" strokeWidth="0.5" />
        
        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
