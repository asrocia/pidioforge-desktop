import { memo } from 'react';
import { ModuleIcon } from './ModuleIcon';
import type { ModuleKey } from '../../types/app.types';

/**
 * Memoized ModuleIcon to prevent re-renders when props don't change
 */
export const MemoizedModuleIcon = memo(ModuleIcon, (prev, next) => {
  return prev.kind === next.kind;
});

/**
 * Memoized button component for navigation
 */
interface NavButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: ModuleKey;
  title: string;
  subtitle: string;
  collapsed: boolean;
  tone: string;
}

export const MemoizedNavButton = memo<NavButtonProps>(({
  isActive,
  onClick,
  icon,
  title,
  subtitle,
  collapsed,
  tone
}) => {
  const toneAccent: Record<string, string> = {
    cyan:   'text-[#62dbc1]',
    green:  'text-[#2dbb7f]',
    blue:   'text-[#4f8ef7]',
    amber:  'text-[#d9a65f]',
    violet: 'text-[#a855f7]',
    red:    'text-[#e76d78]',
  };

  return (
    <button
      title={`${title} — ${subtitle}`}
      aria-label={title}
      onClick={onClick}
      className={`flex items-center gap-2 w-full rounded-md transition-colors border border-transparent ${
        collapsed ? 'justify-center py-2.5 px-1' : 'py-2 px-2'
      } ${
        isActive
          ? `bg-[#121821] border-[rgba(142,162,184,0.22)] ${toneAccent[tone] || 'text-[#4f8ef7]'}`
          : 'text-[#8da0af] hover:text-[#dce8ef] hover:bg-[#0f1620]'
      }`}
    >
      <i className={`block w-5 h-5 shrink-0 ${isActive ? '' : 'opacity-70'}`}>
        <ModuleIcon kind={icon} />
      </i>
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <b className="text-[11px] font-semibold leading-tight truncate">
            {title}
          </b>
          <small className="text-[9px] opacity-50 leading-tight truncate">
            {subtitle}
          </small>
        </div>
      )}
    </button>
  );
}, (prev, next) => {
  // Only re-render if these props change
  return (
    prev.isActive === next.isActive &&
    prev.collapsed === next.collapsed &&
    prev.icon === next.icon &&
    prev.title === next.title &&
    prev.subtitle === next.subtitle &&
    prev.tone === next.tone
  );
});

MemoizedNavButton.displayName = 'MemoizedNavButton';

/**
 * Memoized status indicator
 */
interface StatusIndicatorProps {
  isActive: boolean;
  isReady: boolean;
  statusText: string;
}

export const MemoizedStatusIndicator = memo<StatusIndicatorProps>(({
  isActive,
  isReady,
  statusText
}) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border ${
      isActive
        ? 'bg-[#1a1421] border-[#7d52d9] text-[#b99cff]'
        : isReady
          ? 'bg-[#0e1a14] border-[rgba(45,187,127,0.4)] text-[#2dbb7f]'
          : 'bg-[#121821] border-[rgba(142,162,184,0.22)] text-[#8da0af]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        isActive ? 'bg-[#7d52d9] animate-pulse' : isReady ? 'bg-[#2dbb7f]' : 'bg-[#8da0af] animate-pulse'
      }`} />
      <div className="flex flex-col leading-none gap-0.5">
        <b className="font-semibold text-[10px] uppercase tracking-wider opacity-70">
          {isActive ? 'Rendering' : isReady ? 'Status' : 'Koneksi'}
        </b>
        <small className="text-[10px] max-w-[200px] truncate opacity-90">{statusText}</small>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.isActive === next.isActive &&
    prev.isReady === next.isReady &&
    prev.statusText === next.statusText
  );
});

MemoizedStatusIndicator.displayName = 'MemoizedStatusIndicator';

/**
 * Memoized performance meter
 */
interface PerformanceMeterProps {
  label: string;
  value: number;
}

export const MemoizedPerformanceMeter = memo<PerformanceMeterProps>(({
  label,
  value
}) => {
  return (
    <div className="flex flex-col items-center leading-none">
      <b className="text-[12px] font-semibold text-[#eef7f6]">{value}%</b>
      <small className="text-[9px] text-[#8da0af]">{label}</small>
    </div>
  );
}, (prev, next) => {
  return prev.value === next.value && prev.label === next.label;
});

MemoizedPerformanceMeter.displayName = 'MemoizedPerformanceMeter';

/**
 * Memoized stat counter
 */
interface StatCounterProps {
  label: string;
  value: number;
}

export const MemoizedStatCounter = memo<StatCounterProps>(({
  label,
  value
}) => {
  return (
    <div className="flex flex-col items-center leading-none">
      <b className="text-[12px] font-semibold text-[#eef7f6]">{value}</b>
      <small className="text-[9px] text-[#8da0af]">{label}</small>
    </div>
  );
}, (prev, next) => {
  return prev.value === next.value && prev.label === next.label;
});

MemoizedStatCounter.displayName = 'MemoizedStatCounter';
