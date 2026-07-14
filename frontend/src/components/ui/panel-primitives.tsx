import React from 'react'
import { cn } from '../../lib/utils'

/** Panel scroll container — col 2 settings area */
export function PanelWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-0 overflow-y-auto overflow-x-hidden h-full scroll-smooth', className)}>
      {children}
    </div>
  )
}

/** Section header row at top of a panel */
export function PanelHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-3 bg-[var(--secondary-bg)] border-b border-[var(--border-subtle)] backdrop-blur-sm">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] letter-spacing-wide">{title}</h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/** Card group with h3 heading */
export function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4 border-b border-[var(--border-subtle)]', className)}>
      <h3 className="text-[12px] font-semibold tracking-wide text-[var(--text-secondary)] mb-3">{title}</h3>
      <div className="flex flex-col gap-3 min-w-0">{children}</div>
    </div>
  )
}

/** 3-column grid */
export function Grid3({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-3 gap-3 my-2 min-w-0', className)}>
      {children}
    </div>
  )
}

/** Action button row */
export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5 px-5 py-3 bg-[var(--tertiary-bg)] border-b border-[var(--border-subtle)]', className)}>
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
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] text-[13px] font-semibold border',
        'min-h-[38px] px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-[var(--transition-fast)]',
        variant === 'primary' && 'bg-[var(--accent-success)] text-white border-[var(--accent-success-hover)] hover:bg-[var(--accent-success-hover)] shadow-[var(--shadow-sm)]',
        variant === 'danger' && 'bg-[var(--accent-danger)] text-white border-[var(--accent-danger-hover)] hover:bg-[var(--accent-danger-hover)] shadow-[var(--shadow-sm)]',
        variant === 'wide' && 'w-full bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-medium)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
        variant === 'ghost' && 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--tertiary-bg)] hover:text-[var(--text-primary)]',
        variant === 'default' && 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-medium)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] hover:transform hover:translateY(-1px)',
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
      'px-4 py-3 text-[12px] flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] mx-4 my-2',
      variant === 'ok' && 'text-[var(--accent-success)] bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]',
      variant === 'error' && 'text-[var(--accent-danger)] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]',
      variant === 'warn' && 'text-[var(--accent-warning)] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]',
      variant === 'default' && 'text-[var(--text-secondary)] bg-[var(--tertiary-bg)] border border-[var(--border-subtle)]',
    )}>
      {children}
    </div>
  )
}

/** Warning box */
export function WarnBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mx-4 my-3 rounded-[var(--radius-lg)] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <b className="text-[12px] font-bold text-[var(--accent-warning)] block mb-2">{title}</b>
      <div className="flex flex-col gap-1.5">
        {items.map((w, i) => (
          <small key={i} className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{w}</small>
        ))}
      </div>
    </div>
  )
}

/** Hint / tip text */
export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-[var(--text-muted)] italic leading-relaxed px-2 my-2">{children}</p>
  )
}

/** Stat grid row */
export function StatRow({ items }: { items: Array<{ label: string; value: string | number; accent?: boolean }> }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-3">
      {items.map(({ label, value, accent }) => (
        <div key={label} className="flex flex-col items-center justify-center text-center bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-md)] p-3 min-h-[70px]">
          <b className={cn('text-[20px] font-bold mb-1', accent ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-success)]')}>{value}</b>
          <small className="text-[11px] text-[var(--text-muted)] leading-tight">{label}</small>
        </div>
      ))}
    </div>
  )
}