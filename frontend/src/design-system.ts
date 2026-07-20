/**
 * PidioForge Desktop - Design System
 * FASE 0: Design Tokens & Component Specifications
 * 
 * This file defines all design tokens and component patterns
 * to be used consistently across the entire application.
 */

// ============================================
// COLOR PALETTE
// ============================================
export const colors = {
  // Base Panel Colors
  base: {
    primary: '#1a1a1a',      // Main background
    secondary: '#242424',    // Card/panel background
    tertiary: '#2d2d2d',     // Elevated elements
    border: '#3a3a3a',       // Border color
  },
  
  // Single Accent Color for ALL CTAs
  accent: {
    primary: '#3b82f6',      // Blue - ALL action buttons
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
  },
  
  // Status Colors (consistent across app)
  status: {
    success: '#22c55e',      // Green - normal/success
    warning: '#f59e0b',      // Orange - warning
    error: '#ef4444',        // Red - error/recording
    info: '#3b82f6',         // Blue - info
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: '#a3a3a3',
    muted: '#737373',
    disabled: '#525252',
  },
} as const;

// ============================================
// SPACING SCALE (4/8/12/16/24px)
// ============================================
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
} as const;

// ============================================
// TYPOGRAPHY SCALE
// ============================================
export const typography = {
  // Section Titles
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    lineHeight: '1.4',
    color: colors.text.primary,
  },
  
  // Field Labels
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '1.4',
    color: colors.text.secondary,
  },
  
  // Input/Value Text
  inputText: {
    fontSize: '11px',
    fontWeight: '400',
    lineHeight: '1.4',
    color: colors.text.primary,
  },
  
  // Caption/Helper Text
  caption: {
    fontSize: '9px',
    fontWeight: '400',
    lineHeight: '1.4',
    color: colors.text.muted,
  },
} as const;

// ============================================
// BORDER & RADIUS
// ============================================
export const borders = {
  width: '1px',
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },
} as const;

// ============================================
// COMPONENT SPECIFICATIONS
// ============================================

/**
 * FieldRow Component Spec
 * ONE field per row - NEVER 2-3 fields in one row
 * 
 * Structure:
 * [Label (fixed-width)] [Input (flex-1)]
 */
export const fieldRowSpec = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  label: {
    width: '120px',
    flexShrink: 0,
    ...typography.fieldLabel,
  },
  input: {
    width: '100%',
    minWidth: 0,
    minHeight: '28px',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borders.radius.md,
    border: `${borders.width} solid ${colors.base.border}`,
    backgroundColor: colors.base.tertiary,
    ...typography.inputText,
  },
} as const;

/**
 * SliderControl Component Spec
 * Green solid fill + percentage label on right
 */
export const sliderControlSpec = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  label: {
    width: '120px',
    flexShrink: 0,
    ...typography.fieldLabel,
  },
  sliderWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slider: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    backgroundColor: colors.base.tertiary,
    accentColor: colors.status.success, // Green fill
  },
  valueLabel: {
    width: '48px',
    textAlign: 'right' as const,
    ...typography.inputText,
    fontWeight: '600',
  },
} as const;

/**
 * CheckboxRow Component Spec
 * 8px vertical spacing between items
 */
export const checkboxRowSpec = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.sm, // 8px
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: '16px',
    height: '16px',
    borderRadius: borders.radius.sm,
    border: `${borders.width} solid ${colors.base.border}`,
    accentColor: colors.accent.primary,
  },
  label: {
    ...typography.inputText,
  },
} as const;

/**
 * Callout Component Spec
 * Blue + lightbulb = tips
 * Orange + warning = warnings
 */
export const calloutSpec = {
  tip: {
    padding: spacing.lg,
    borderRadius: borders.radius.lg,
    backgroundColor: `${colors.status.info}15`, // 15% opacity
    border: `${borders.width} solid ${colors.status.info}30`,
    display: 'flex',
    gap: spacing.md,
    icon: '💡',
    iconColor: colors.status.info,
  },
  warning: {
    padding: spacing.lg,
    borderRadius: borders.radius.lg,
    backgroundColor: `${colors.status.warning}15`,
    border: `${borders.width} solid ${colors.status.warning}30`,
    display: 'flex',
    gap: spacing.md,
    icon: '⚠️',
    iconColor: colors.status.warning,
  },
} as const;

/**
 * PresetButtonGroup Component Spec
 * Uniform grid, icon + label
 */
export const presetButtonGroupSpec = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: spacing.sm,
  },
  button: {
    height: '48px',
    padding: spacing.sm,
    borderRadius: borders.radius.md,
    border: `${borders.width} solid ${colors.base.border}`,
    backgroundColor: colors.base.secondary,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  icon: {
    fontSize: '16px',
  },
  label: {
    fontSize: '10px',
    fontWeight: '600',
  },
} as const;

/**
 * StatRow Component Spec
 * Auto-aligned columns, large bold number + small label
 */
export const statRowSpec = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: borders.radius.lg,
    backgroundColor: colors.base.secondary,
  },
  item: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.text.primary,
  },
  label: {
    fontSize: '10px',
    fontWeight: '400',
    color: colors.text.muted,
    textTransform: 'uppercase' as const,
  },
} as const;

/**
 * Card Component Spec
 * 16px padding, 8px radius, title + description
 */
export const cardSpec = {
  container: {
    padding: spacing.lg, // 16px
    borderRadius: borders.radius.lg, // 8px
    backgroundColor: colors.base.secondary,
    border: `${borders.width} solid ${colors.base.border}`,
  },
  title: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.inputText,
    color: colors.text.secondary,
  },
} as const;

/**
 * Button Sizes (Global)
 */
export const buttonSpec = {
  // Primary CTA Button (ALL action buttons use this)
  primary: {
    height: '28px',
    padding: `0 ${spacing.lg}`,
    borderRadius: borders.radius.md,
    backgroundColor: colors.accent.primary,
    color: colors.text.primary,
    fontSize: '11px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  // Small Button
  small: {
    height: '24px',
    padding: `0 ${spacing.md}`,
    borderRadius: borders.radius.md,
    fontSize: '10px',
  },
  
  // Secondary Button
  secondary: {
    height: '28px',
    padding: `0 ${spacing.lg}`,
    borderRadius: borders.radius.md,
    backgroundColor: colors.base.tertiary,
    color: colors.text.primary,
    fontSize: '11px',
    fontWeight: '600',
    border: `${borders.width} solid ${colors.base.border}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
} as const;

// ============================================
// LAYOUT CONSTANTS
// ============================================
export const layout = {
  topbar: {
    height: '36px',
  },
  sidebar: {
    width: '48px',
  },
  settingsPanel: {
    width: '300px',
  },
  statusBar: {
    height: '24px',
  },
  buttonSpacing: spacing.sm, // 6px between buttons (not 10px)
} as const;

// ============================================
// EXPORT ALL
// ============================================
export const designSystem = {
  colors,
  spacing,
  typography,
  borders,
  layout,
  components: {
    fieldRow: fieldRowSpec,
    slider: sliderControlSpec,
    checkbox: checkboxRowSpec,
    callout: calloutSpec,
    presetButtonGroup: presetButtonGroupSpec,
    statRow: statRowSpec,
    card: cardSpec,
    button: buttonSpec,
  },
} as const;

export type DesignSystem = typeof designSystem;
