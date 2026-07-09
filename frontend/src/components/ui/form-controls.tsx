import React from 'react';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[minmax(92px,120px)_minmax(0,1fr)] gap-3 items-center my-1 min-w-0">
      <span className="text-[11px] text-ds-muted text-right leading-tight break-words">{label}</span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 my-1.5 text-[12px] text-ds-text cursor-pointer select-none hover:text-ds-title transition-colors">
      <input type="checkbox" className="accent-ds-accent w-3.5 h-3.5 shrink-0 rounded" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value: any; onChange: (v: any) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="bg-ds-bg-field border border-ds-line-strong rounded-[var(--radius)] text-ds-text text-[12px] min-h-[30px] px-2.5 py-1 w-full outline-none focus:border-ds-line-focus focus:ring-1 focus:ring-ds-accent/20 transition-all placeholder:text-ds-subtle"
    />
  );
}

export function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="bg-ds-bg-field border border-ds-line-strong rounded-[var(--radius)] text-ds-text text-[12px] min-h-[30px] px-2.5 py-1 w-full outline-none focus:border-ds-line-focus focus:ring-1 focus:ring-ds-accent/20 transition-all"
    >
      {children}
    </select>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 150 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="grid grid-cols-[minmax(92px,120px)_minmax(0,1fr)_44px] gap-3 items-center my-1 min-w-0">
      <span className="text-[11px] text-ds-muted text-right leading-tight break-words">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={e => onChange(Number(e.target.value))}
        className="accent-ds-accent w-full h-1.5 rounded-full"
      />
      <b className="text-[11px] text-ds-text text-right font-semibold tabular-nums">{value ?? 0}%</b>
    </div>
  );
}
