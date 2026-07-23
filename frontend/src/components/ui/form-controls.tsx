import React from 'react';
import {
  FieldRow,
  Input,
  Select,
  SliderControl,
} from './design-system-components';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <FieldRow label={label}>{children}</FieldRow>;
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 my-2 text-[13px] text-[var(--text-primary)] cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors group min-w-0">
      <input
        type="checkbox"
        className="accent-[var(--accent-success)] w-4 h-4 shrink-0 rounded cursor-pointer"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
      />
      <span className="group-hover:text-[var(--text-primary)] min-w-0 leading-tight">{label}</span>
    </label>
  );
}

type TextInputValue = string | number | null | undefined;

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
}: {
  id?: string;
  value: TextInputValue;
  onChange: (value: string | number) => void;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <Input
      id={id}
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      step={step}
      onChange={event => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
    />
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Select id={id} value={value ?? ''} onChange={event => onChange(event.target.value)}>
      {children}
    </Select>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 150,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <SliderControl
      label={label}
      value={value ?? 0}
      onChange={onChange}
      min={min}
      max={max}
    />
  );
}
