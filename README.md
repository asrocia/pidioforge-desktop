# PidioForge Desktop

Desktop video production workspace for Windows. PidioForge combines Electron, React, Vite, a local Node.js API, SQLite render history, and FFmpeg media processing.

## Highlights

- Video, image, audio, batch, and queue rendering
- Automatic lyrics from LRC/SRT with alignment and karaoke modes
- Spectrum, progress, now-playing, particles, branding, CTA, and lower-third overlays
- Audio mixing, normalization, EQ, compression, fades, ducking, and beat detection
- Project tabs, templates, import/export, undo/redo, thumbnails, history, and notifications
- Seamless looping with crossfade and ping-pong modes
- Offline local API at `http://127.0.0.1:8787`

## Architecture

```text
frontend/                  React + Vite UI
backend/                   Local Node.js HTTP API and media engines
electron/                  Electron main process, IPC, updater, packaged resources
tools/                     Development, build, and smoke-test scripts
```

Production builds copy backend runtime dependencies into `electron/resources/backend/vendor` and package them as `extraResources`. This keeps the API outside `app.asar`, where the spawned Node runtime can load backend files and FFmpeg binaries.

## Requirements

- Windows 10 or newer
- Node.js 20+
- FFmpeg and FFprobe on `PATH` for development
- Windows build environment for native Electron dependencies

## Development

```bash
npm install
cd frontend && npm install && cd ..
npm run dev
```

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API, Vite, and Electron |
| `npm run dev:api` | Start local API only |
| `npm run dev:web` | Start Vite only |
| `npm run typecheck` | Run TypeScript validation |
| `cd frontend && npm test -- --run` | Run frontend tests |
| `npm run smoke:api` | Check API health and basic routes |
| `npm run smoke:render` | Exercise render flow |
| `npm run smoke:loop` | Exercise seamless-loop flow |

API default port: `8787`. Stop old PidioForge backend processes before restarting if logs show `EADDRINUSE`.

## Production Installer

Build NSIS and MSI installers:

```bash
npm run electron:build
```

Output:

```text
release/PidioForge Desktop Setup 1.0.0.exe
release/PidioForge Desktop 1.0.0.msi
```

`electron:build` first runs `rebuild:electron`. This rebuilds `better-sqlite3` for Electron `42.5.0`; skipping this step causes:

```text
NODE_MODULE_VERSION 137 ... requires NODE_MODULE_VERSION 146
```

Install new builds after uninstalling older PidioForge versions. Do not reuse an old installer or old `win-unpacked` directory.

## Backend Troubleshooting

App status `Menghubungkan backend` means API health check failed. Check:

```text
%APPDATA%\pidioforge-desktop-fullstack\logs\api.out.log
%APPDATA%\pidioforge-desktop-fullstack\logs\api.err.log
```

Expected health request:

```text
GET http://127.0.0.1:8787/api/health
```

Common errors:

- `Cannot find module 'better-sqlite3'`: install current package build; old installer lacks vendored dependency.
- `NODE_MODULE_VERSION 137 ... requires NODE_MODULE_VERSION 146`: rebuild with `npm run rebuild:electron` and rebuild installer.
- `EADDRINUSE ... 127.0.0.1:8787`: stop stale PidioForge backend or restart Windows, then relaunch one app instance.

## API Surface

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | API and FFmpeg diagnostics |
| `/api/state` | GET | Current app state |
| `/api/config` | GET, POST | Active project configuration |
| `/api/projects` | GET, POST | Project CRUD |
| `/api/projects/:id/export` | GET | Export project |
| `/api/projects/import` | POST | Import project |
| `/api/templates` | GET, POST, DELETE | Template management |
| `/api/jobs` | GET, POST | Render jobs |
| `/api/queue/start` | POST | Start queue |
| `/api/history` | GET | Render history |
| `/api/history/stats` | GET | History statistics |
| `/api/thumbnail/generate` | POST | Generate thumbnail |
| `/api/preview/render` | POST | Render preview |
| `/api/loop/start` | POST | Start loop job |
| `/api/lyrics/auto-align` | POST | Align lyrics |

## Validation

Current release validation:

- `npm run electron:build` — passed
- `npm run typecheck` — passed
- Frontend tests (Vitest) — 189 passed across 27 test files
- Electron native dependency rebuild — passed
- `npm run smoke:api` — API health + diagnostics + preview cleanup verified
- `npm run smoke:render` — Full render pipeline verified (portable, generates sample media)
- `npm run smoke:loop` — Loop flow verified
- `npm run smoke:queue` — Queue CRUD, duplicate, send-to-queue, start/pause verified

## Technology

- React 19, Vite 8, TailwindCSS 4, TypeScript 6
- Node.js HTTP API, FFmpeg, better-sqlite3
- Electron 42, electron-builder, electron-updater
- Vitest, Testing Library, ESLint, Prettier, Husky

## License

Private — Ppjayabaru / Bangalimin

## Release Notes

### 1.0.0 installer reliability update

- Fixed Electron IPC registration typo.
- Fixed CommonJS loading for `electron-updater`.
- Bundled backend runtime dependencies outside `app.asar`.
- Rebuilt `better-sqlite3` for Electron 42 ABI.
- Added backend startup diagnostics and bounded health readiness checks.
- Fixed production CORS handling for packaged `file://` UI.
- Fixed loop-job map propagation for seamless loop status and cancellation.

Install latest generated installer after pulling this update.

## Maintainers

PidioForge Desktop — Ppjayabaru / Bangalimin
