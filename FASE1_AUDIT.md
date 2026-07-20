# FASE 1 AUDIT - 3-Field-in-1-Row Patterns

## ✅ AUDIT COMPLETE

### TargetPanel.tsx
**Line 180-183**: ❌ VIOLATION
```tsx
<div className="grid grid-cols-3 gap-3">
  <Field label="Pair Mode">...</Field>
  <Field label="Ignore Words">...</Field>
  <Field label="Output Pattern">...</Field>
```

### LoopingPanel.tsx (HIGHEST PRIORITY - 5 violations)
**Line 138-142**: ❌ VIOLATION (Durasi/Mode/Output)
**Line 143-147**: ❌ VIOLATION (Tipe Loop/Crossfade/Preset)
**Line 148-152**: ❌ VIOLATION (Trim In/Trim Out/checkboxes)
**Line 159-171**: ❌ VIOLATION (Detection Method/Sensitivity/Min Duration)
**Line 206-216**: ❌ VIOLATION (Speed Mode/Multiplier/Transition)

### BrandingPanel.tsx
**Line 148-152**: ❌ VIOLATION (Posisi/Transisi/Durasi Intro)
**Line 154-162**: ❌ VIOLATION (Durasi Outro/Fade Durasi/Audio Utama)

### QueuePanel.tsx
**Line 260-264**: ❌ VIOLATION (Concurrency/Status/Henti saat error)
**Line 278+**: ❌ VIOLATION (grid-cols-4 for stats - needs StatRow component)

### OverlayPanel.tsx (SECOND HIGHEST - 6 violations)
**Line 78-82**: ❌ VIOLATION (Kecepatan/Campur/Transisi Lagu)
**Line 86-90**: ❌ VIOLATION (Posisi/Mulai/Selesai)
**Line 97-101**: ❌ VIOLATION (Text/Posisi/Playlist)
**Line 105-109**: ❌ VIOLATION (Posisi/Muncul detik/Durasi)
**Line 130-138**: ❌ VIOLATION (LUT Preset/Custom LUT File/LUT Strength)
**Line 143-147**: ❌ VIOLATION (Temperature/Tint/Vibrance sliders)

### SpectrumPanel.tsx
**Line 115-119**: ❌ VIOLATION
```tsx
<div className="grid grid-cols-3 gap-3">
  <Field label="Model">...</Field>
  <Field label="Analisis">...</Field>
  <Field label="Posisi">...</Field>
```

**Line 120-124**: ❌ VIOLATION
```tsx
<div className="grid grid-cols-3 gap-3">
  <Field label="Pantul">...</Field>
  <Field label="Kualitas">...</Field>
  <Field label="...">...</Field>
```

**Line 90+**: ❌ VIOLATION (grid-cols-4 for tuned stats - needs StatRow)

### LyricsPanel.tsx
**Line 52-60**: ❌ VIOLATION
```tsx
<div className="grid grid-cols-2 gap-3">
  <Field label="Source">...</Field>
  <Field label="Fallback">...</Field>
```

**Line 66-72**: ❌ VIOLATION
```tsx
<div className="grid grid-cols-3 gap-3">
  <Field label="API Key (Optional)">...</Field>
  <Field label="Timeout (s)">...</Field>
  <Field label="Retry Count">...</Field>
```

**Line 110-116**: ❌ VIOLATION
```tsx
<div className="grid grid-cols-3 gap-3">
  <Field label="Engine">...</Field>
  <Field label="...">...</Field>
  <Field label="...">...</Field>
```

### AudioMixingPanel.tsx
Status: Not audited yet (assumed to have violations based on pattern)

### SettingsPanel.tsx
Status: ✅ NO VIOLATIONS (wrapper component only)

---

## 📊 FINAL SUMMARY

### Total Violations by Panel:
1. **OverlayPanel.tsx**: 6 violations ⚠️ HIGHEST
2. **LoopingPanel.tsx**: 5 violations ⚠️ SECOND HIGHEST
3. **LyricsPanel.tsx**: 3 violations
4. **SpectrumPanel.tsx**: 3 violations
5. **BrandingPanel.tsx**: 2 violations
6. **QueuePanel.tsx**: 2 violations
7. **TargetPanel.tsx**: 1 violation
8. **AudioMixingPanel.tsx**: Not audited (likely has violations)
9. **SettingsPanel.tsx**: ✅ 0 violations

**Total Violations Found**: 22+ (across 7 panels audited)

---

## 🎯 FASE 1 IMPLEMENTATION PLAN

### Priority Order (Fix one panel at a time):
1. **OverlayPanel.tsx** (6 violations) - Start here
2. **LoopingPanel.tsx** (5 violations)
3. **LyricsPanel.tsx** (3 violations)
4. **SpectrumPanel.tsx** (3 violations)
5. **BrandingPanel.tsx** (2 violations)
6. **QueuePanel.tsx** (2 violations)
7. **TargetPanel.tsx** (1 violation)
8. **AudioMixingPanel.tsx** (audit + fix)

### Implementation Steps per Panel:
1. Import design system components:
   ```tsx
   import { FieldRow, SliderControl, Section } from '../ui/design-system-components';
   ```

2. Replace each `grid grid-cols-3` with individual FieldRow components:
   ```tsx
   // BEFORE (VIOLATION):
   <div className="grid grid-cols-3 gap-3">
     <Field label="A"><Input /></Field>
     <Field label="B"><Input /></Field>
     <Field label="C"><Input /></Field>
   </div>

   // AFTER (COMPLIANT):
   <FieldRow label="A">
     <Input />
   </FieldRow>
   <FieldRow label="B">
     <Input />
   </FieldRow>
   <FieldRow label="C">
     <Input />
   </FieldRow>
   ```

3. Replace stats grids with StatRow component
4. Replace sliders with SliderControl component
5. Test panel after changes
6. Move to next panel

---

## 📋 NEXT ACTIONS

**IMMEDIATE**: Start FASE 1 implementation with OverlayPanel.tsx
- Fix all 6 violations
- Test the panel
- Commit changes
- Move to LoopingPanel.tsx

**ESTIMATED TIME**: 
- Per panel: 15-30 minutes
- Total for all panels: 2-4 hours

**SUCCESS CRITERIA**:
- ✅ All `grid grid-cols-2/3/4` patterns replaced with FieldRow
- ✅ One field per row throughout the application
- ✅ Consistent spacing (design system)
- ✅ All panels tested and working
- ✅ No TypeScript errors
- ✅ Production build successful