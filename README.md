# PidioForge Desktop

Aplikasi desktop Windows untuk produksi video musik otomatis. Dibangun dengan **Electron + React + Vite + TailwindCSS v4** (frontend) dan **Node.js API lokal + FFmpeg** (backend).

## Fitur

### Produksi Video
- **Sumber & Engine** — pilih visual, audio, output, mode render, resolusi, bitrate, batch
- **Branding** — logo overlay, bumper video, CTA greenscreen, watermark teks
- **Audio & Mixing** — volume, normalize, EQ, compressor, fade, ducking, beat detection
- **Lirik Otomatis** — parse LRC/SRT, auto-align timing, beat snap, karaoke mode
- **Spektrum & Now Playing** — bar/wave/line visualizer, progress bar, now playing text
- **Overlay** — particle, timestamp, lower third, vignette, film grain, scanlines
- **Queue & Batch Render** — antrian job, concurrency, auto-optimize performa
- **Seamless Looping** — video pendek jadi panjang, crossfade, ping-pong

### Workspace
- **Multi-Project Tabs** — switch, rename, duplicate, delete projects
- **Template System** — simpan/apply config subset
- **Export/Import** — share project sebagai file .pidioforge
- **Undo/Redo** — Ctrl+Z / Ctrl+Y
- **Collapsible Sidebar** — toggle expand/collapse
- **Drag-Reorder Queue** — geser job di antrian
- **Thumbnail Generator** — auto-extract best frame
- **Render History** — SQLite tracking (durasi, size, status)
- **Desktop Notifications** — alert saat render selesai/gagal
- **Auto-Update** — cek dan install update otomatis

## Struktur Proyek

```
pidioforge-desktop/
├── backend/                 # API lokal Node.js (modular ESM)
│   ├── server.mjs           # Entry point (30 lines)
│   ├── routes.mjs           # Route handler
│   ├── config.mjs           # Default config & presets
│   ├── state.mjs            # State persistence (JSON)
│   ├── history.mjs          # Render history (SQLite)
│   ├── render-engine.mjs    # FFmpeg render wrapper
│   ├── loop-engine.mjs      # Seamless loop video
│   ├── audio-engine.mjs     # Loudness, waveform, beats
│   ├── lyrics-engine.mjs    # Auto-align, export SRT/LRC/VTT
│   ├── target-engine.mjs    # Validation, pairing, estimates
│   ├── thumbnail-engine.mjs # Frame extraction
│   └── ...                  # Other engine modules
├── frontend/                # React + Vite + TailwindCSS v4
│   ├── src/
│   │   ├── main.tsx          # Entry point (8 lines)
│   │   ├── App.tsx           # Main app component
│   │   ├── components/
│   │   │   ├── panels/       # 10 panel components
│   │   │   ├── ui/           # Shared UI primitives
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ProjectTabs.tsx
│   │   ├── hooks/            # useUndoRedo
│   │   ├── lib/              # api, config-path, format
│   │   ├── utils/            # cn, media, format-presets
│   │   └── types/            # TypeScript types
│   └── vitest.config.ts
├── electron/                # Electron main process
│   ├── main.mjs             # Window, IPC, API lifecycle
│   ├── updater.mjs          # Auto-update (electron-updater)
│   └── preload.cjs          # Context bridge
├── tools/                   # Dev scripts
├── .github/workflows/       # CI: lint, typecheck, test, build
├── eslint.config.mjs        # ESLint flat config
└── .prettierrc              # Prettier config
```

## Setup Development

### Prasyarat
- Node.js 20+
- FFmpeg (tambahkan ke PATH)
- Windows 10/11

### Install & Run

```bash
npm install
cd frontend && npm install && cd ..
npm run dev
```

### Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan API + frontend + Electron |
| `npm run dev:api` | API saja (port 8787) |
| `npm run dev:web` | Frontend saja (port 1420) |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `cd frontend && npm test` | Vitest (31 tests) |
| `npm run electron:build` | Build .exe installer |

### Build Production

```bash
npm run prepare:build
npm run electron:build
```

Output installer di folder `release/`.

## API Lokal

Base URL: `http://127.0.0.1:8787`

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/health` | GET | Status + FFmpeg info |
| `/api/state` | GET | Full app state |
| `/api/config` | GET/POST | Config project aktif |
| `/api/projects` | GET/POST | CRUD projects |
| `/api/projects/:id/export` | GET | Export project |
| `/api/projects/import` | POST | Import project |
| `/api/templates` | GET/POST/DELETE | Template system |
| `/api/jobs` | GET/POST | Queue jobs |
| `/api/queue/start` | POST | Start render queue |
| `/api/history` | GET | Render history |
| `/api/history/stats` | GET | Aggregate stats |
| `/api/thumbnail/generate` | POST | Extract thumbnails |
| `/api/preview/render` | POST | Render preview |
| `/api/loop/start` | POST | Start loop render |
| `/api/lyrics/auto-align` | POST | Align lyrics |

## Tech Stack

- **Frontend:** React 19, Vite 8, TailwindCSS v4, TypeScript 6
- **Backend:** Node.js HTTP, better-sqlite3, FFmpeg
- **Desktop:** Electron 42, electron-builder, electron-updater
- **Testing:** Vitest, @testing-library/react (31 tests)
- **Linting:** ESLint + Prettier + Husky + lint-staged
- **CI/CD:** GitHub Actions

## Keyboard Shortcuts

| Shortcut | Aksi |
|----------|------|
| Ctrl+Z | Undo config |
| Ctrl+Y | Redo config |

## License

Private — by Ppjayabaru / Bangalimin
