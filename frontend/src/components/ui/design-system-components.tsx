/**
 * PidioForge Desktop - Reusable Design System Components
 * FASE 2: Implementation of Design System Components
 *
 * All components follow specs from design-system.ts
 */

import React from 'react';
import { designSystem } from '../../design-system';
import { Button as BaseButton } from './button';

function createFieldId(label: string): string {
  return `ds-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

// ============================================
// FieldRow Component
// ONE field per row - NEVER 2-3 fields in one row
// ============================================
interface FieldRowProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FieldRow({ label, children, required }: FieldRowProps) {
  const spec = designSystem.components.fieldRow;
  const generatedId = createFieldId(label);
  const fieldId = React.isValidElement<{ id?: string }>(children) ? children.props.id || generatedId : generatedId;
  const child = React.isValidElement<{ id?: string }>(children)
    ? React.cloneElement(children, { id: fieldId })
    : children;

  return (
    <div style={{ ...spec.container, minWidth: 0 }}>
      <label htmlFor={fieldId} style={spec.label}>
        {label}
        {required && <span style={{ color: designSystem.colors.status.error }}>*</span>}
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>{child}</div>
    </div>
  );
}

// ============================================
// SliderControl Component
// Green solid fill + percentage label on right
// ============================================
interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '%',
}: SliderControlProps) {
  const spec = designSystem.components.slider;
  const sliderId = createFieldId(label);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ ...spec.container, minWidth: 0 }}>
      <label htmlFor={sliderId} style={spec.label}>
        {label}
      </label>
      <div style={{ ...spec.sliderWrapper, minWidth: 0 }}>
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            ...spec.slider,
            background: `linear-gradient(to right, ${designSystem.colors.status.success} 0%, ${designSystem.colors.status.success} ${percentage}%, ${designSystem.colors.base.tertiary} ${percentage}%, ${designSystem.colors.base.tertiary} 100%)`,
          }}
        />
        <span style={spec.valueLabel}>
          {value}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ============================================
// CheckboxRow Component
// 8px vertical spacing between items
// ============================================
interface CheckboxItem {
  id: string;
  label: string;
  checked: boolean;
}

interface CheckboxRowProps {
  items: CheckboxItem[];
  onChange: (id: string, checked: boolean) => void;
}

export function CheckboxRow({ items, onChange }: CheckboxRowProps) {
  const spec = designSystem.components.checkbox;

  return (
    <div style={spec.container}>
      {items.map(item => (
        <div key={item.id} style={spec.item}>
          <input
            type="checkbox"
            id={item.id}
            checked={item.checked}
            onChange={e => onChange(item.id, e.target.checked)}
            style={spec.checkbox}
          />
          <label htmlFor={item.id} style={spec.label}>
            {item.label}
          </label>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Callout Component
// Blue + lightbulb = tips, Orange + warning = warnings
// ============================================
interface CalloutProps {
  type: 'tip' | 'warning';
  children: React.ReactNode;
}

export function Callout({ type, children }: CalloutProps) {
  const { icon, iconColor, ...containerStyle } = designSystem.components.callout[type];

  return (
    <div style={containerStyle}>
      <span style={{ fontSize: '16px', color: iconColor }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0, ...designSystem.typography.inputText }}>{children}</div>
    </div>
  );
}

// ============================================
// PresetButtonGroup Component
// Uniform grid, icon + label
// ============================================
interface PresetButton {
  id: string;
  icon: string;
  label: string;
}

interface PresetButtonGroupProps {
  presets: PresetButton[];
  activeId: string;
  onChange: (id: string) => void;
}

export function PresetButtonGroup({ presets, activeId, onChange }: PresetButtonGroupProps) {
  const spec = designSystem.components.presetButtonGroup;

  return (
    <div style={spec.container}>
      {presets.map(preset => {
        const isActive = preset.id === activeId;
        const buttonStyle = isActive ? { ...spec.button, ...spec.buttonActive } : spec.button;

        return (
          <button key={preset.id} onClick={() => onChange(preset.id)} style={buttonStyle}>
            <span style={spec.icon}>{preset.icon}</span>
            <span style={spec.label}>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// StatRow Component
// Auto-aligned columns, large bold number + small label
// ============================================
interface Stat {
  label: string;
  value: string | number;
  color?: string;
  accent?: boolean;
}

interface StatRowProps {
  stats: Stat[];
}

export function StatRow({ stats }: StatRowProps) {
  const spec = designSystem.components.statRow;

  return (
    <div style={spec.container}>
      {stats.map((stat, index) => (
        <div key={index} style={spec.item}>
          <span
            style={{
              ...spec.value,
              color: stat.accent ? designSystem.colors.accent.primary : stat.color || spec.value.color,
            }}
          >
            {stat.value}
          </span>
          <span style={spec.label}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Card Component
// 16px padding, 8px radius, title + description
// ============================================
interface CardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export function Card({ title, description, action, children }: CardProps) {
  const spec = designSystem.components.card;

  return (
    <div style={spec.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={spec.title}>{title}</h3>
        {action}
      </div>
      {description && <p style={spec.description}>{description}</p>}
      {children}
    </div>
  );
}

// ============================================
// WorkflowStepper Component
// Compact stepper replacing horizontal breadcrumb overflow
// ============================================
interface WorkflowStep {
  id: string;
  label: string;
  completed?: boolean;
  active?: boolean;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  activeIndex: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function WorkflowStepper({ steps, activeIndex, onPrevious, onNext }: WorkflowStepperProps) {
  const current = steps[activeIndex] || steps[0];
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < steps.length - 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: designSystem.spacing.sm,
        padding: designSystem.spacing.md,
        borderRadius: designSystem.borders.radius.lg,
        backgroundColor: designSystem.colors.base.secondary,
        border: `${designSystem.borders.width} solid ${designSystem.colors.base.borderSubtle}`,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ ...designSystem.typography.caption, textTransform: 'uppercase' }}>
          Langkah {Math.min(activeIndex + 1, steps.length)} dari {steps.length}
        </div>
        <div style={{ ...designSystem.typography.sectionTitle, marginTop: designSystem.spacing.xs }}>
          {current?.label || '-'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: designSystem.spacing.sm, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Button variant="small" disabled={!canPrev} onClick={onPrevious}>
          Previous
        </Button>
        <Button variant="small" disabled={!canNext} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ============================================
// ActionButtonGroup Component
// Compact wrap-safe action groups
// ============================================
interface ActionButtonItem {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'small' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

interface ActionButtonGroupProps {
  actions: ActionButtonItem[];
  columns?: 1 | 2;
}

export function ActionButtonGroup({ actions, columns = 2 }: ActionButtonGroupProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        gap: designSystem.spacing.sm,
      }}
    >
      {actions.map(action => (
        <Button
          key={action.id}
          variant={action.variant || 'secondary'}
          disabled={action.disabled}
          onClick={action.onClick}
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: designSystem.spacing.xs,
          }}
        >
          {action.icon ? <span>{action.icon}</span> : null}
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

// ============================================
// Chip / ChipGroup
// ============================================
interface ChipProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Chip({ active = false, children, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: '30px',
        padding: `${designSystem.spacing.xs} ${designSystem.spacing.md}`,
        borderRadius: designSystem.borders.radius.md,
        border: `${designSystem.borders.width} solid ${active ? designSystem.colors.accent.primary : designSystem.colors.base.borderSubtle}`,
        backgroundColor: active ? designSystem.colors.accent.primary : designSystem.colors.base.tertiary,
        color: active ? designSystem.colors.text.primary : designSystem.colors.text.primary,
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: designSystem.spacing.sm, flexWrap: 'wrap' }}>{children}</div>;
}

// ============================================
// Collapsible
// ============================================
interface CollapsibleProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function Collapsible({ title, open, onToggle, children }: CollapsibleProps) {
  return (
    <div
      style={{
        padding: designSystem.spacing.lg,
        borderRadius: designSystem.borders.radius.lg,
        backgroundColor: designSystem.colors.base.secondary,
        border: `${designSystem.borders.width} solid ${designSystem.colors.base.borderSubtle}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          color: designSystem.colors.text.primary,
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 700,
        }}
      >
        <span>{title}</span>
        <span style={{ color: designSystem.colors.text.muted }}>{open ? '▲' : '▼'}</span>
      </button>
      {open ? <div style={{ marginTop: designSystem.spacing.lg }}>{children}</div> : null}
    </div>
  );
}

// ============================================
// Textarea
// ============================================
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number };

export function Textarea({ style, minRows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={minRows}
      style={{
        width: '100%',
        minWidth: 0,
        padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
        borderRadius: designSystem.borders.radius.md,
        border: `${designSystem.borders.width} solid ${designSystem.colors.base.borderSubtle}`,
        backgroundColor: designSystem.colors.base.tertiary,
        color: designSystem.colors.text.primary,
        fontSize: '11px',
        lineHeight: '1.5',
        resize: 'vertical',
        ...style,
      }}
      {...props}
    />
  );
}

// ============================================
// LogPre
// ============================================
interface LogPreProps {
  children: React.ReactNode;
  maxHeight?: number;
}

export function LogPre({ children, maxHeight = 300 }: LogPreProps) {
  return (
    <pre
      style={{
        backgroundColor: designSystem.colors.base.tertiary,
        border: `${designSystem.borders.width} solid ${designSystem.colors.base.borderSubtle}`,
        borderRadius: designSystem.borders.radius.lg,
        padding: designSystem.spacing.lg,
        color: designSystem.colors.text.secondary,
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        overflowX: 'auto',
        overflowY: 'auto',
        maxHeight,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </pre>
  );
}

// ============================================
// MetaStrip
// ============================================
interface MetaItem {
  label?: string;
  value: React.ReactNode;
  muted?: boolean;
}

export function MetaStrip({ items }: { items: MetaItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: designSystem.spacing.sm,
        padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
        borderRadius: designSystem.borders.radius.lg,
        backgroundColor: designSystem.colors.base.tertiary,
        border: `${designSystem.borders.width} solid ${designSystem.colors.base.borderSubtle}`,
        fontSize: '11px',
        color: designSystem.colors.text.muted,
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={`${item.label || 'value'}-${index}`}>
          {index > 0 ? <span>•</span> : null}
          {item.label ? (
            <span style={{ color: designSystem.colors.text.primary, fontWeight: 600 }}>{item.label}</span>
          ) : null}
          <span style={{ color: item.muted ? designSystem.colors.text.muted : designSystem.colors.text.secondary }}>
            {item.value}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================
// WarningList
// ============================================
interface WarningListProps {
  tone: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  items: string[];
}

export function WarningList({ tone, title, items }: WarningListProps) {
  const toneColor =
    tone === 'warning'
      ? designSystem.colors.status.warning
      : tone === 'danger'
        ? designSystem.colors.status.error
        : tone === 'success'
          ? designSystem.colors.status.success
          : designSystem.colors.status.info;

  return (
    <div
      style={{
        padding: designSystem.spacing.lg,
        backgroundColor: `${toneColor}15`,
        borderLeft: `4px solid ${toneColor}`,
        borderRadius: designSystem.borders.radius.lg,
      }}
    >
      <h4 style={{ fontSize: '12px', fontWeight: 700, color: toneColor, marginBottom: designSystem.spacing.sm }}>
        {title}
      </h4>
      <ul
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: designSystem.spacing.xs,
          paddingLeft: designSystem.spacing.md,
        }}
      >
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            style={{ color: designSystem.colors.text.primary, fontSize: '11px', lineHeight: '1.5' }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// ProgressBar
// ============================================
interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({ value, max = 100, tone = 'primary' }: ProgressBarProps) {
  const ratio = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const color =
    tone === 'success'
      ? designSystem.colors.status.success
      : tone === 'warning'
        ? designSystem.colors.status.warning
        : tone === 'danger'
          ? designSystem.colors.status.error
          : designSystem.colors.accent.primary;

  return (
    <div
      style={{
        width: '100%',
        height: '6px',
        backgroundColor: designSystem.colors.base.surface,
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: `${ratio}%`, height: '100%', backgroundColor: color, transition: 'width 0.3s ease' }} />
    </div>
  );
}

// ============================================
// Button Components
// Primary (ALL CTAs), Secondary, Small
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'small' | 'danger';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  let baseVariant: 'primary' | 'default' | 'danger' = 'primary';
  let baseSize: 'default' | 'sm' = 'default';

  if (variant === 'secondary') {
    baseVariant = 'default';
  } else if (variant === 'small') {
    baseVariant = 'default';
    baseSize = 'sm';
  } else if (variant === 'danger') {
    baseVariant = 'danger';
  }

  return (
    <BaseButton variant={baseVariant} size={baseSize} className={className} {...props}>
      {children}
    </BaseButton>
  );
}

// ============================================
// Input Component (follows FieldRow spec)
// ============================================
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ style, ...props }: InputProps) {
  const spec = designSystem.components.fieldRow.input;

  return <input style={{ ...spec, ...style }} {...props} />;
}

// ============================================
// Select Component (follows FieldRow spec)
// ============================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ style, children, ...props }: SelectProps) {
  const spec = designSystem.components.fieldRow.input;

  return (
    <select style={{ ...spec, ...style }} {...props}>
      {children}
    </select>
  );
}

// ============================================
// Section Component (for panel sections)
// ============================================
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: designSystem.spacing.xl }}>
      <h2
        style={{
          ...designSystem.typography.sectionTitle,
          marginBottom: designSystem.spacing.md,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
