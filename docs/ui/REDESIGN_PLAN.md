# PidioForge Desktop — Full UI Redesign (Filmora/CapCut Style)

## Konsep

Transformasi dari layout "floating popup" ke layout **3-column fixed** yang mirip Filmora/CapCut:

```
┌─────────────────────────────────────────────────────────┐
│ Topbar (36px) — brand + status minimal                  │
├────┬──────────────┬─────────────────────────────────────┤
│    │              │                                     │
│ 48 │   Settings   │         Preview Area                │
│ px │   Panel      │         (video preview,             │
│    │   (300px)    │          controls, layers)          │
│ I  │              │                                     │
│ C  │  scrollable  │                                     │
│ O  │  form area   │                                     │
│ N  │              │                                     │
│    │              │                                     │
│ B  │              │                                     │
│ A  │              │                                     │
│ R  │              │                                     │
│    │              │                                     │
├────┴──────────────┴─────────────────────────────────────┤
│ Status bar (24px) — save status + perf (optional)       │
└─────────────────────────────────────────────────────────┘
```

## Perubahan Utama

### 1. Topbar (36px, slimmer)
- Brand minimal (just "PidioForge")
- Status dot kecil (green/orange/red)
- Hapus perf metrics & stats dari topbar (pindah ke status bar bawah)
- UpdateBanner tetap

### 2. Sidebar → Icon Toolbar (48px fixed)
- Icon-only, vertical
- Tooltip on hover (nama module)
- Active state: left border accent, bukan full highlight
- Compact: 36x36px icon buttons

### 3. Settings Panel (300px, fixed — bukan floating)
- Inline di grid, bukan absolute/overlay
- Header: module name + collapse button
- Body: scrollable form content
- Hapus glass-morphism/backdrop-filter
- Clean flat design

### 4. Preview Area (fill remaining)
- Tetap sama secara fungsional
- Bersihkan controls (button lebih kecil)
- Tab bar lebih compact

### 5. Status Bar (24px, baru)
- CPU/Mem/Render stats
- Save status
- Encoder info

### 6. Buttons (global)
- Default size: 28px height (turun dari 38px)
- Small size: 24px
- Hapus emoji dari button text
- Border-radius: 6px (bukan 9px)
- Text: 11px
- Spacing antar button: 6px (bukan 10px)

### 7. CSS Cleanup
- Hapus `workspace-fixes.css` (semua override !important)
- Hapus CSS class `.workspaceFloatingPanel`, `.workspacePanelBody`, dll
- Semua styling via Tailwind + design tokens yang sudah ada

## Files yang Diubah

1. `frontend/src/App.tsx` — Layout baru (3-column grid)
2. `frontend/src/components/layout/WorkspacePopup.tsx` → Rename ke `SettingsPane.tsx` (fixed panel)
3. `frontend/src/components/ui/button.tsx` — Perkecil sizing
4. `frontend/src/components/ui/panel-primitives.tsx` — Compact spacing
5. `frontend/src/workspace-fixes.css` — HAPUS (replace with minimal Tailwind)
6. `frontend/src/index.css` — Update design tokens jika perlu
7. `frontend/src/styles.css` — Cleanup unused vars

## Estimasi
- ~500 LOC perubahan (spread across 6-7 files)
- Chunk 1: Layout shell (App.tsx + SettingsPane)
- Chunk 2: Button & primitives resize
- Chunk 3: CSS cleanup
