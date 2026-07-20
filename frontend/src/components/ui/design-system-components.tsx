/**
 * PidioForge Desktop - Reusable Design System Components
 * FASE 2: Implementation of Design System Components
 * 
 * All components follow specs from design-system.ts
 */

import React from 'react';
import { designSystem } from '../../design-system';

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
  const fieldId = React.isValidElement<{ id?: string }>(children)
    ? children.props.id || generatedId
    : generatedId;
  const child = React.isValidElement<{ id?: string }>(children)
    ? React.cloneElement(children, { id: fieldId })
    : children;

  return (
    <div style={{ ...spec.container, minWidth: 0 }}>
      <label htmlFor={fieldId} style={spec.label}>
        {label}
        {required && <span style={{ color: designSystem.colors.status.error }}>*</span>}
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        {child}
      </div>
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
  unit = '%'
}: SliderControlProps) {
  const spec = designSystem.components.slider;
  const sliderId = createFieldId(label);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ ...spec.container, minWidth: 0 }}>
      <label htmlFor={sliderId} style={spec.label}>{label}</label>
      <div style={{ ...spec.sliderWrapper, minWidth: 0 }}>
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            ...spec.slider,
            background: `linear-gradient(to right, ${designSystem.colors.status.success} 0%, ${designSystem.colors.status.success} ${percentage}%, ${designSystem.colors.base.tertiary} ${percentage}%, ${designSystem.colors.base.tertiary} 100%)`,
          }}
        />
        <span style={spec.valueLabel}>
          {value}{unit}
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
      {items.map((item) => (
        <div key={item.id} style={spec.item}>
          <input
            type="checkbox"
            id={item.id}
            checked={item.checked}
            onChange={(e) => onChange(item.id, e.target.checked)}
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
      <span style={{ fontSize: '16px', color: iconColor }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0, ...designSystem.typography.inputText }}>
        {children}
      </div>
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
      {presets.map((preset) => {
        const isActive = preset.id === activeId;
        const buttonStyle = isActive 
          ? { ...spec.button, ...spec.buttonActive }
          : spec.button;
        
        return (
          <button
            key={preset.id}
            onClick={() => onChange(preset.id)}
            style={buttonStyle}
          >
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
          <span style={{ ...spec.value, color: stat.accent ? designSystem.colors.accent.primary : (stat.color || spec.value.color) }}>
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
      {description && (
        <p style={spec.description}>{description}</p>
      )}
      {children}
    </div>
  );
}

// ============================================
// Button Components
// Primary (ALL CTAs), Secondary, Small
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'small';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const spec = designSystem.components.button;
  let buttonStyle: React.CSSProperties = spec.primary;
  
  if (variant === 'secondary') {
    buttonStyle = { ...spec.primary, ...spec.secondary } as React.CSSProperties;
  } else if (variant === 'small') {
    buttonStyle = { ...spec.primary, ...spec.small } as React.CSSProperties;
  }
  
  return (
    <button
      style={{ ...buttonStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================
// Input Component (follows FieldRow spec)
// ============================================
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ style, ...props }: InputProps) {
  const spec = designSystem.components.fieldRow.input;
  
  return (
    <input
      style={{ ...spec, ...style }}
      {...props}
    />
  );
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
    <select
      style={{ ...spec, ...style }}
      {...props}
    >
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
      <h2 style={{
        ...designSystem.typography.sectionTitle,
        marginBottom: designSystem.spacing.md,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
