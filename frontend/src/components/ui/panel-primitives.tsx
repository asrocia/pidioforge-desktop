import React from 'react'
import { cn } from '../../lib/utils'

/** Panel scroll container — col 2 settings area */
export function PanelWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0 overflow-y-auto overflow-x-hidden bg-ds-bg-elevated h-full scroll-smooth', className)}>
      {children}
    </div>
  )
}

/** Section header row at top of a panel */
export function PanelHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2.5 bg-ds-bg-elevated border-b border-ds-line backdrop-blur-sm">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-ds-title">{title}</h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/** Card group with h3 heading */
export function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-4 py-3 border-b border-ds-line', className)}>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.06em] text-ds-muted mb-2.5">{title}</h3>
      <div className="flex flex-col gap-1 min-w-0">{children}</div>
    </div>
  )
}

/** 3-column grid */
export function Grid3({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-3 gap-3 my-1.5 min-w-0', className)}>
      {children}
    </div>
  )
}

/** Action button row */
export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 px-4 py-2.5 bg-ds-bg-base/50 border-b border-ds-line', className)}>
      {children}
    </div>
  )
}

/** Inline action button */
export function ActionBtn({
  children,
  onClick,
  disabled,
  loading,
  variant = 'default',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'primary' | 'wide' | 'ghost' | 'danger'
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] text-[11px] font-semibold border',
        'min-h-[30px] px-3 py-1 disabled:opacity-40 disabled:pointer-events-none',
        'transition-[background,border-color,color,box-shadow]',
        variant === 'primary' && 'bg-ds-accent text-white border-ds-accent-hover hover:bg-ds-accent-hover shadow-sm',
        variant === 'danger' && 'bg-ds-danger text-white border-[#c95b65] hover:bg-[#d85f6a] shadow-sm',
        variant === 'wide' && 'w-full bg-ds-bg-panel-2 text-ds-muted border-ds-line-strong hover:bg-ds-bg-active hover:text-ds-text',
        variant === 'ghost' && 'bg-transparent text-ds-muted border-transparent hover:bg-ds-bg-panel hover:text-ds-text',
        variant === 'default' && 'bg-ds-bg-panel-2 text-ds-text border-ds-line-strong hover:bg-ds-bg-active hover:border-ds-line-strong',
      )}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}

/** Status/diagnostic info bar */
export function InfoBar({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'ok' | 'error' | 'warn' }) {
  return (
    <div className={cn(
      'px-4 py-2 text-[11px] flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] mx-3 my-1.5',
      variant === 'ok' && 'text-ds-success bg-ds-success-bg border border-ds-success/20',
      variant === 'error' && 'text-ds-danger bg-ds-danger-bg border border-ds-danger/20',
      variant === 'warn' && 'text-ds-warn bg-ds-warn-bg border border-ds-warn/20',
      variant === 'default' && 'text-ds-muted bg-ds-bg-elevated border border-ds-line',
    )}>
      {children}
    </div>
  )
}

/** Warning box */
export function WarnBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mx-3 my-2 rounded-[var(--radius-lg)] bg-ds-warn-bg border border-ds-warn/25 px-3 py-2.5">
      <b className="text-[11px] font-bold text-ds-warn block mb-1.5">{title}</b>
      <div className="flex flex-col gap-1">
        {items.map((w, i) => (
          <small key={i} className="text-[11px] text-ds-warn/80 leading-snug">{w}</small>
        ))}
      </div>
    </div>
  )
}

/** Hint / tip text */
export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-ds-muted italic leading-snug px-1 my-1.5">{children}</p>
  )
}

/** Stat grid row */
export function StatRow({ items }: { items: Array<{ label: string; value: string | number; accent?: boolean }> }) {
  return (
    <div className="flex flex-wrap gap-3 px-4 py-2.5">
      {items.map(({ label, value, accent }) => (
        <div key={label} className="flex flex-col items-center leading-none min-w-[44px] py-1">
          <b className={cn('text-[14px] font-bold', accent ? 'text-ds-accent' : 'text-ds-title')}>{value}</b>
          <small className="text-[11px] text-ds-muted mt-1">{label}</small>
        </div>
      ))}
    </div>
  )
}
