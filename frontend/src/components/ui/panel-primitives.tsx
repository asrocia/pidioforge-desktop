import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

/** Panel scroll container — col 2 settings area */
export function PanelWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0 overflow-y-auto overflow-x-hidden h-full scroll-smooth', className)}>
      {children}
    </div>
  );
}

/** Section header row at top of a panel */
export function PanelHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2 bg-ds-bg-elevated border-b border-ds-line backdrop-blur-sm">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ds-title">{title}</h2>
      {children && <div className="flex items-center gap-1.5">{children}</div>}
    </div>
  );
}

/** Card group with h3 heading */
export function Group({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 py-3 border-b border-ds-line', className)}>
      <h3 className="text-[10px] font-semibold tracking-wide text-ds-muted mb-2 uppercase">{title}</h3>
      <div className="flex flex-col gap-2 min-w-0">{children}</div>
    </div>
  );
}

/** 3-column grid */
export function Grid3({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-3 gap-2 my-1 min-w-0', className)}>{children}</div>;
}

/** Action button row */
export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5 px-4 py-2 bg-ds-bg-panel border-b border-ds-line', className)}
    >
      {children}
    </div>
  );
}

/** Inline action button — delegates to shared Button for consistent focus/style */
export function ActionBtn({
  children,
  onClick,
  disabled,
  loading,
  variant = 'default',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'wide' | 'ghost' | 'danger';
}) {
  const variantMap: Record<string, 'default' | 'primary' | 'danger' | 'ghost' | 'wide'> = {
    default: 'default',
    primary: 'primary',
    danger: 'danger',
    ghost: 'ghost',
    wide: 'wide',
  };

  return (
    <Button variant={variantMap[variant] || 'default'} size="sm" onClick={onClick} disabled={disabled || loading}>
      {loading && <span className="spinner" />}
      {children}
    </Button>
  );
}

/** Status/diagnostic info bar */
export function InfoBar({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'ok' | 'error' | 'warn';
}) {
  return (
    <div
      className={cn(
        'px-3 py-2 text-[11px] flex flex-wrap items-center gap-2 rounded-md mx-3 my-1.5',
        variant === 'ok' && 'text-ds-success bg-ds-success-bg border border-ds-success/20',
        variant === 'error' && 'text-ds-danger bg-ds-danger-bg border border-ds-danger/20',
        variant === 'warn' && 'text-ds-warn bg-ds-warn-bg border border-ds-warn/20',
        variant === 'default' && 'text-ds-muted bg-ds-bg-panel border border-ds-line',
      )}
    >
      {children}
    </div>
  );
}

/** Warning box */
export function WarnBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mx-3 my-2 rounded-md bg-ds-warn-bg border border-ds-warn/25 px-3 py-2">
      <b className="text-[11px] font-bold text-ds-warn block mb-1">{title}</b>
      <div className="flex flex-col gap-1">
        {items.map((w, i) => (
          <small key={i} className="text-[11px] text-ds-muted leading-relaxed">
            {w}
          </small>
        ))}
      </div>
    </div>
  );
}

/** Hint / tip text */
export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-ds-subtle italic leading-relaxed px-2 my-1">{children}</p>;
}

/** Stat grid row */
export function StatRow({ items }: { items: Array<{ label: string; value: string | number; accent?: boolean }> }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 py-2">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center text-center bg-ds-bg-panel border border-ds-line rounded-md p-2 min-h-[52px]"
        >
          <b className="text-[16px] font-bold mb-0.5 text-ds-accent">{value}</b>
          <small className="text-[9px] text-ds-muted leading-tight">{label}</small>
        </div>
      ))}
    </div>
  );
}
