import React from 'react';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 items-center my-3 min-w-0">
      <span className="text-[13px] text-[var(--text-secondary)] text-right leading-tight font-medium">{label}</span>
      <div className="min-w-0">{children}</div>
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 my-3 text-[13px] text-[var(--text-primary)] cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors group">
      <input 
        type="checkbox" 
        className="accent-[var(--accent-success)] w-4 h-4 shrink-0 rounded cursor-pointer" 
        checked={checked} 
        onChange={e => onChange(e.target.checked)} 
      />
      <span className="group-hover:text-[var(--text-primary)]">{label}</span>
    </label>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text', step }: { value: any; onChange: (v: any) => void; placeholder?: string; type?: string; step?: string }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      step={step}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] min-h-[38px] px-3 py-2 w-full outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[rgba(59,130,246,0.1)] transition-all placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)]"
    />
  );
}

export function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[13px] min-h-[38px] px-3 py-2 w-full outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[rgba(59,130,246,0.1)] transition-all cursor-pointer hover:border-[var(--border-strong)]"
    >
      {children}
    </select>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 150 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)_50px] gap-3 items-center my-3 min-w-0">
      <span className="text-[13px] text-[var(--text-secondary)] text-right leading-tight font-medium">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={e => onChange(Number(e.target.value))}
        className="accent-[var(--accent-success)] w-full h-2 rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent-success) 0%, var(--accent-success) ${((value - min) / (max - min)) * 100}%, var(--surface) ${((value - min) / (max - min)) * 100}%, var(--surface) 100%)`
        }}
      />
      <b className="text-[13px] text-[var(--text-primary)] text-right font-semibold tabular-nums">{value ?? 0}%</b>
    </div>
  );
}