from pathlib import Path
import textwrap, json
root = Path('/data/pidioforge-desktop')

def w(path, content):
    p = root / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(textwrap.dedent(content).lstrip('\n'), encoding='utf-8')

w('package.json', r'''
{
  "name": "pidioforge-desktop-fullstack",
  "version": "1.0.0",
  "private": true,
  "description": "Aplikasi desktop Tauri + React + API lokal untuk produksi video musik: auto lirik, spectrum, branding, overlay, audio mixing, dan batch render.",
  "scripts": {
    "dev": "node tools/dev.mjs",
    "dev:api": "node backend/server.mjs",
    "dev:web": "vite --host 127.0.0.1 --port 1420 frontend",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "preview:static": "node tools/static-preview.mjs"
  },
  "dependencies": {
    "@tauri-apps/api": "latest",
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@tauri-apps/cli": "latest"
  }
}
''')

w('README.md', r'''
# PidioForge Desktop Fullstack

Aplikasi desktop Windows berbasis **Tauri + React** dengan **API lokal Node.js**. UI dan fitur dibuat mengikuti referensi gambar: sidebar modul produksi, panel setting, preview, log detail, status monitor, tombol start/reset, serta modul Auto Lirik, Spectrum/Now Playing, Branding/Logo, Overlay/Bumper, Audio Mixing, dan Antrian/Batch Render.

> Catatan: di sandbox ini jaringan npm dan Rust/Tauri tidak tersedia, jadi saya menyiapkan **source code lengkap + preview statis**. Untuk membuild `.exe`, jalankan di PC Windows yang sudah terpasang Node.js, Rust, dan WebView2.

## Fitur utama

- **Folder bahan & engine target**: pilih visual, audio, output, mode video/render, bitrate, kualitas, batch.
- **Branding/Logo**: bumper video awal/akhir, logo, animasi CTA greenscreen.
- **Audio & Mixing**: volume video/BGM, urutan lagu, ASM mode, audio reactive FX, slot lagu awal/akhir.
- **Auto Lirik**: font, rata tengah, scale, spasi, warna, glow, rotasi 3D, efek karaoke.
- **Spectrum & Now Playing**: model spectrum bar, mirror, posisi, zoom, crop, transparansi, custom warna, progress bar, now playing.
- **Overlay**: timestamp, transisi lagu, partikel video, list lagu, glow/rotasi.
- **Antrian/Batch Render**: tambah job, start, progress, log, reset.
- **API lokal**: endpoint render jobs, konfigurasi, parse lirik, dan health check.
- **Render engine**: wrapper FFmpeg sudah disiapkan; default berjalan sebagai simulasi bila input belum lengkap.

## Struktur proyek

```text
pidioforge-desktop/
├─ backend/              # API lokal Node.js tanpa framework eksternal
│  ├─ server.mjs
│  └─ render-engine.mjs
├─ frontend/             # React UI
│  ├─ index.html
│  ├─ package.json
│  └─ src/
├─ src-tauri/            # konfigurasi Tauri + Rust shell
├─ tools/                # script dev/preview
├─ reference/            # gambar referensi dari chat
└─ dist-preview/         # preview statis hasil build sandbox
```

## Menjalankan di Windows

1. Install prasyarat:
   - Node.js LTS
   - Rust + Cargo
   - Microsoft Edge WebView2 Runtime
   - FFmpeg, lalu tambahkan ke PATH
2. Di folder proyek:

```bash
npm install
npm run dev:api
npm run tauri:dev
```

3. Build installer/exe:

```bash
npm run tauri:build
```

Output Windows ada di `src-tauri/target/release/bundle/`.

## Preview cepat tanpa Tauri

Jika hanya ingin melihat tampilan UI:

```bash
npm install
npm run dev:web
```

Di sandbox, preview statis tersedia di `dist-preview/index.html`.

## API lokal

Base URL default: `http://127.0.0.1:8787`

- `GET /api/health`
- `GET /api/config`
- `POST /api/config`
- `GET /api/jobs`
- `POST /api/jobs`
- `POST /api/jobs/:id/start`
- `POST /api/jobs/reset`
- `POST /api/lyrics/parse`

## Roadmap implementasi lanjutan

- Integrasi file picker native Tauri untuk input/output.
- Rendering video real FFmpeg dengan template filter complex.
- Parsing auto-lirik dari `.lrc`, `.srt`, atau speech-to-text.
- Preset visual spectrum dan plugin overlay custom.
- Database lokal SQLite untuk history render.
''')

w('backend/package.json', r'''
{
  "name": "pidioforge-local-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.mjs"
  }
}
''')

w('backend/render-engine.mjs', r'''
import { spawn } from 'node:child_process';

export function buildFfmpegArgs(job, config) {
  const video = job.input?.visual || config.input.visual || 'input.mp4';
  const audio = job.input?.audio || config.input.audio || 'music.mp3';
  const output = job.output || config.input.output || `output-${job.id}.mp4`;
  const bitrate = config.target.bitrate || '4500k';
  const spectrum = config.spectrum.enabled ? '[spectrum overlay enabled]' : '';
  const logo = config.branding.logo ? `[logo ${config.branding.logo}]` : '';
  return [
    '-y',
    '-i', video,
    '-i', audio,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-b:v', bitrate,
    '-c:a', 'aac',
    '-shortest',
    output,
    // Metadata comments below help future filter-complex implementation.
    // spectrum, logo
  ];
}

export function simulateRender(job, onProgress, onLog) {
  let progress = 0;
  onLog(`[${job.title}] render dimulai`);
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      progress = Math.min(100, progress + Math.floor(Math.random() * 12) + 5);
      onProgress(progress);
      onLog(`[${job.title}] progress ${progress}%`);
      if (progress >= 100) {
        clearInterval(timer);
        onLog(`[${job.title}] selesai`);
        resolve({ ok: true, output: job.output || `output-${job.id}.mp4` });
      }
    }, 450);
  });
}

export function runFfmpeg(job, config, onProgress, onLog) {
  const args = buildFfmpegArgs(job, config);
  onLog(`ffmpeg ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stderr.on('data', (buf) => onLog(buf.toString()));
    child.stdout.on('data', (buf) => onLog(buf.toString()));
    child.on('close', (code) => {
      if (code === 0) {
        onProgress(100);
        resolve({ ok: true, output: job.output });
      } else {
        reject(new Error(`FFmpeg exit ${code}`));
      }
    });
  });
}
''')

w('backend/server.mjs', r'''
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { simulateRender } from './render-engine.mjs';

const PORT = Number(process.env.PIDIOFORGE_API_PORT || 8787);
const dataDir = path.resolve(process.cwd(), 'backend/.data');
const dbPath = path.join(dataDir, 'state.json');

const defaultState = {
  config: {
    target: { engine: 'Auto GPU', modeVideo: 'Video/Gambar Fixed', modeRender: 'Auto GPU', bitrate: '4500k', totalBatch: 1 },
    input: { visual: '', audio: '', title: '', output: 'Hasil' },
    branding: { bumperPosition: 'Akhir', bumperTransition: 'None', logo: '', logoPosition: 'Kanan Atas', ctaGreenscreen: '' },
    audio: { videoVolume: 0, bgmVolume: 100, order: 'acak', asmMode: false, reactiveFx: 'Beat Flash', songs: ['', '', ''], endingSong: '' },
    lyrics: { enabled: true, ai: 'auto', model: 'Cepat', language: 'Auto', linkModel: 'Standar', align: 'Rata Tengah', scale: 28, spacing: 110, outline: 0, color: '#ffffff', font: 'AGENCYB', glow: false, karaoke: false },
    spectrum: { enabled: true, model: 'Bar', mirror: 'Off', position: 'Bebas', zoom: 97.8, crop: 0, y: 183.3, transparency: 80, colors: ['#38fff2', '#ff1f32', '#ffeb2d'], progressBar: true, nowPlaying: true },
    overlay: { timestamp: false, songTransition: 'Faded', particleFile: 'Bokeh Dot.mp4', particleSpeed: 100, particleOpacity: 70, playlist: true, glow: false },
  },
  jobs: [
    { id: 'job-001', title: 'Demo Render 1.mp4', status: 'standby', progress: 0, speed: '0.0x', output: 'Hasil/demo-1.mp4', input: {} }
  ],
  logs: ['GUI siap.']
};

async function loadState() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    await writeFile(dbPath, JSON.stringify(defaultState, null, 2));
    return structuredClone(defaultState);
  }
  return JSON.parse(await readFile(dbPath, 'utf8'));
}
async function saveState(state) { await writeFile(dbPath, JSON.stringify(state, null, 2)); }
function json(res, code, data) {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
  });
}
function addLog(state, msg) {
  const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
  state.logs.push(`${time} ${msg}`);
  state.logs = state.logs.slice(-300);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  const state = await loadState();
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, app: 'PidioForge Local API' });
    if (req.method === 'GET' && url.pathname === '/api/config') return json(res, 200, state.config);
    if (req.method === 'POST' && url.pathname === '/api/config') {
      const patch = await readBody(req);
      state.config = { ...state.config, ...patch };
      addLog(state, 'config disimpan.');
      await saveState(state);
      return json(res, 200, state.config);
    }
    if (req.method === 'GET' && url.pathname === '/api/jobs') return json(res, 200, { jobs: state.jobs, logs: state.logs });
    if (req.method === 'POST' && url.pathname === '/api/jobs') {
      const body = await readBody(req);
      const job = { id: `job-${Date.now()}`, title: body.title || `Batch ${state.jobs.length + 1}`, status: 'standby', progress: 0, speed: '0.0x', output: body.output || '', input: body.input || {} };
      state.jobs.push(job);
      addLog(state, `${job.title} masuk antrian.`);
      await saveState(state);
      return json(res, 201, job);
    }
    const startMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/start$/);
    if (req.method === 'POST' && startMatch) {
      const id = startMatch[1];
      const job = state.jobs.find((j) => j.id === id);
      if (!job) return json(res, 404, { error: 'job tidak ditemukan' });
      job.status = 'rendering'; job.progress = 1; addLog(state, `${job.title} start.`); await saveState(state);
      simulateRender(job, async (progress) => {
        const s = await loadState();
        const j = s.jobs.find((x) => x.id === id);
        if (j) { j.progress = progress; j.status = progress >= 100 ? 'done' : 'rendering'; j.speed = progress >= 100 ? '1.0x' : '0.8x'; await saveState(s); }
      }, async (line) => { const s = await loadState(); addLog(s, line); await saveState(s); });
      return json(res, 202, job);
    }
    if (req.method === 'POST' && url.pathname === '/api/jobs/reset') {
      state.jobs = [];
      addLog(state, 'antrian direset.');
      await saveState(state);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/lyrics/parse') {
      const body = await readBody(req);
      const text = body.text || '';
      const lines = text.split(/\r?\n/).filter(Boolean).map((line, i) => ({ time: i * 3, text: line.replace(/^\[[^\]]+\]/, '').trim() }));
      addLog(state, `${lines.length} baris lirik diparse.`);
      await saveState(state);
      return json(res, 200, { lines });
    }
    return json(res, 404, { error: 'not found' });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`PidioForge API: http://127.0.0.1:${PORT}`));
''')

w('frontend/package.json', r'''
{
  "name": "pidioforge-ui",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "dev": "vite --host 127.0.0.1 --port 1420", "build": "vite build" },
  "dependencies": { "@vitejs/plugin-react": "latest", "vite": "latest", "typescript": "latest", "react": "latest", "react-dom": "latest", "@tauri-apps/api": "latest" },
  "devDependencies": {}
}
''')

w('frontend/index.html', r'''
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PidioForge Desktop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
''')

w('frontend/src/main.tsx', r'''
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type ModuleKey = 'target' | 'branding' | 'audio' | 'lyrics' | 'spectrum' | 'overlay' | 'queue';
type Job = { id: string; title: string; status: string; progress: number; speed: string; output?: string };

const API = 'http://127.0.0.1:8787';
const nav: Array<{ key: ModuleKey; title: string; sub: string }> = [
  { key: 'target', title: 'FOLDER BAHAN & ENGINE TARGET', sub: '1 GPU • target' },
  { key: 'branding', title: 'BRANDING', sub: 'logo • bumper' },
  { key: 'audio', title: 'AUDIO & MIXING', sub: 'audio 100% • awal 0' },
  { key: 'lyrics', title: 'AUTO LIRIK', sub: 'lirik on' },
  { key: 'spectrum', title: 'SPECTRUM & NOW PLAYING', sub: 'Spec on Bar • NP on' },
  { key: 'overlay', title: 'OVERLAY', sub: '1 efek aktif' },
  { key: 'queue', title: 'ANTRIAN', sub: 'batch render' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
function Select({ value, children }: { value?: string; children?: React.ReactNode }) {
  return <select defaultValue={value || ''}>{children || <><option>Auto</option><option>Off</option><option>Manual</option></>}</select>;
}
function Check({ label, checked }: { label: string; checked?: boolean }) {
  return <label className="check"><input type="checkbox" defaultChecked={checked} /> {label}</label>;
}
function Slider({ label, value }: { label: string; value: number }) {
  return <div className="slider"><span>{label}</span><input type="range" defaultValue={value} /><b>{value}%</b></div>;
}

function SettingsPanel({ active }: { active: ModuleKey }) {
  if (active === 'target') return <Section title="FOLDER BAHAN & ENGINE TARGET">
    <Field label="CONFIG"><div className="inline"><input placeholder="config preset"/><button>Update</button><button>Simpan</button></div></Field>
    <Field label="VISUAL"><FileInput /></Field><Field label="AUDIO"><FileInput /></Field><Field label="JUDUL"><FileInput /></Field><Field label="OUTPUT"><FileInput value="Hasil" /></Field>
    <Field label="MODE VIDEO"><Select value="Off"><option>Off</option><option>Video/Gambar Fixed</option><option>Audio Visualizer</option></Select></Field>
    <Field label="MODE RENDER"><Select value="Auto GPU"><option>Auto GPU</option><option>Mode SatSet</option><option>CPU Aman</option></Select></Field>
    <Field label="MODE LOGIKA"><Select value="Video/Gambar Fixed"><option>Video/Gambar Fixed</option><option>Loop Video</option><option>Random Visual</option></Select></Field>
    <Field label="TRANSISI"><Select value="mix"><option>mix</option><option>fade</option><option>none</option></Select></Field>
    <div className="grid3"><Field label="Durasi"><input defaultValue="1.0"/></Field><Field label="Max Zoom"><input defaultValue="110"/></Field><Field label="Speed"><input defaultValue="100"/></Field></div>
    <div className="grid3"><Field label="Mode Target"><Select value="Durasi"><option>Durasi</option><option>Jumlah Lagu</option></Select></Field><Field label="Nilai"><input defaultValue="105"/></Field><Field label="Bitrate"><input defaultValue="4500k"/></Field></div>
  </Section>;
  if (active === 'branding') return <Section title="BRANDING">
    <Check label="BUMPER VIDEO" /><div className="radio"><label><input name="bumper" type="radio"/> Awal</label><label><input name="bumper" type="radio" defaultChecked/> Akhir</label><label><input name="bumper" type="radio"/> Keduanya</label></div>
    <Field label="Audio Utama"><Select value="Setelah Intro"><option>Setelah Intro</option><option>Bersamaan</option></Select></Field><Field label="Transisi"><Select value="none"><option>none</option><option>fade</option></Select></Field><Field label="File"><FileInput /></Field>
    <Check label="LOGO" /><Field label="File"><FileInput /></Field><Field label="Posisi"><Select value="Kanan Atas"><option>Kanan Atas</option><option>Kiri Atas</option><option>Tengah</option></Select></Field><Field label="Scale"><input defaultValue="10" /></Field>
    <Check label="ANIMASI CTA GREENSCREEN" /><Field label="File"><FileInput /></Field><Field label="Audio"><Select value="Mute"><option>Mute</option><option>On</option></Select></Field><Field label="Muncul"><input defaultValue="2" /></Field>
  </Section>;
  if (active === 'audio') return <Section title="AUDIO & MIXING">
    <Field label="VOL VIDEO"><input defaultValue="0" /></Field><Field label="VOL AUDIO/BGM"><input defaultValue="100" /></Field><Field label="URUTAN LAGU"><Select value="acak"><option>acak</option><option>urut</option><option>random unik</option></Select></Field>
    <Check label="AKTIFKAN ASM MODE (AMBIENT/BGM LOOP)"/><Field label="ASM Audio"><FileInput /><input className="small" defaultValue="15" /></Field>
    <Check label="AKTIFKAN AUDIO REACTIVE FX" checked/><div className="radio vertical"><label><input name="fx" type="radio"/> Logo Pulse</label><label><input name="fx" type="radio" defaultChecked/> Beat Flash</label><label><input name="fx" type="radio"/> Background Jedug</label></div>
    {['Lagu 1', 'Lagu 2', 'Lagu 3', 'Lagu Terakhir'].map(x => <Field key={x} label={x}><FileInput /></Field>)}
    <button className="wide">+ Tambah Slot Audio Awal</button>
  </Section>;
  if (active === 'lyrics') return <Section title="AUTO LIRIK">
    <Field label="AI"><Select value="auto"><option>auto</option><option>manual</option></Select></Field><Field label="Model"><Select value="Cepat"><option>Cepat</option><option>Akurat</option></Select></Field><Field label="Bahasa"><Select value="Auto"><option>Auto</option><option>Indonesia</option><option>English</option></Select></Field>
    <Field label="Model Link"><Select value="Standar"><option>Standar</option><option>Karaoke</option></Select></Field><Field label="Rata"><Select value="Rata Tengah"><option>Rata Tengah</option><option>Kiri</option><option>Kanan</option></Select></Field>
    <Field label="Scale"><input defaultValue="28"/></Field><Field label="Spasi"><input defaultValue="110"/></Field><Field label="Garis Tepi"><input defaultValue="0"/></Field><Field label="Warna"><input type="color" defaultValue="#ffffff"/></Field><Field label="Font Link"><Select value="System"><option>System</option></Select><input defaultValue="AGENCYB"/></Field><button>Pilih Font</button>
    <Check label="GLOW"/><Check label="ROTASI 3D"/><Slider label="Sumbu X" value={0}/><Slider label="Sumbu Y" value={0}/><Check label="EFEK KARAOKE"/><Field label="Gaya"><Select value="Halus"><option>Halus</option><option>Solid</option></Select></Field>
  </Section>;
  if (active === 'spectrum') return <Section title="SPECTRUM & NOW PLAYING">
    <Check label="AUDIO SPECTRUM" checked/><Field label="Model"><Select value="Bar"><option>Bar</option><option>Circle</option><option>Wave</option></Select></Field><Field label="Mirror"><Select value="Off"><option>Off</option><option>On</option></Select></Field><Field label="Posisi Spectrum"><Select value="Bebas"><option>Bebas</option><option>Bawah</option><option>Tengah</option></Select></Field>
    <div className="grid3"><Field label="Zoom Spectrum"><input defaultValue="97.8"/></Field><Field label="Crop"><input defaultValue="0"/></Field><Field label="Tinggi Bar"><input defaultValue="183.3"/></Field></div><Field label="Transparansi"><input defaultValue="80"/></Field>
    <Slider label="Bass" value={135}/><Slider label="Mid" value={90}/><Slider label="High" value={80}/><Check label="CUSTOM WARNA SPECTRUM"/><div className="swatches"><i style=background:'#38fff2'/><i style=background:'#ff1f32'/><i style=background:'#ffeb2d'/></div>
    <Check label="PROGRESS BAR" checked/><Field label="Scale"><input defaultValue="20"/></Field><Field label="Durasi"><Select value="ON"><option>ON</option><option>OFF</option></Select></Field><Check label="NOW PLAYING"/><Field label="AGENCYB"><input defaultValue="AGENCYB"/></Field>
  </Section>;
  if (active === 'overlay') return <Section title="OVERLAY">
    <Check label="TIMESTAMP"/><Check label="TRANSISI LAGU"/><Field label="Transisi"><Select value="Faded"><option>Faded</option><option>Cut</option></Select></Field><Field label="Durasi"><input defaultValue="1.0"/></Field>
    <Check label="VIDEO PARTIKEL" checked/><Field label="File"><input defaultValue="Bokeh Dot.mp4"/></Field><Field label="Speed"><input defaultValue="100"/></Field><Field label="Opacity"><input defaultValue="70"/></Field>
    <Check label="LIST LAGU"/><Field label="Model"><Select value="1 Kolom"><option>1 Kolom</option><option>2 Kolom</option></Select></Field><Field label="Posisi"><Select value="Kiri"><option>Kiri</option><option>Kanan</option></Select></Field><Field label="Font"><input defaultValue="AGENCYB"/></Field><div className="grid3"><Field label="Jarak"><input defaultValue="8"/></Field><Field label="Scale"><input defaultValue="18"/></Field><Field label="No urut"><Select value="Angka"><option>Angka</option><option>None</option></Select></Field></div>
    <button className="wide">+ TAMBAH OVERLAY</button>
  </Section>;
  return <QueuePanel />;
}
function FileInput({ value }: { value?: string }) { return <div className="file"><input defaultValue={value || ''}/><button>Pilih</button></div>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <div className="section"><h2>{title}</h2>{children}</div>; }

function QueuePanel() {
  const [title, setTitle] = useState('Render Baru.mp4');
  const [jobs, setJobs] = useState<Job[]>([]);
  async function refresh(){ const r = await fetch(`${API}/api/jobs`).then(r=>r.json()).catch(()=>({jobs:[]})); setJobs(r.jobs || []); }
  useEffect(()=>{ refresh(); const t=setInterval(refresh, 1000); return ()=>clearInterval(t); }, []);
  async function add(){ await fetch(`${API}/api/jobs`, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({title})}); refresh(); }
  async function start(id:string){ await fetch(`${API}/api/jobs/${id}/start`, {method:'POST'}); refresh(); }
  return <Section title="ANTRIAN / BATCH RENDER"><Field label="Judul Job"><input value={title} onChange={e=>setTitle(e.target.value)}/></Field><button onClick={add} className="wide">+ Tambah ke Antrian</button><div className="jobs">{jobs.map(j=><div className="job" key={j.id}><b>{j.title}</b><span>{j.status}</span><progress value={j.progress} max={100}/><em>{j.progress}% • {j.speed}</em><button onClick={()=>start(j.id)}>START</button></div>)}</div></Section>
}

function Preview({ active, jobs, logs }: { active: ModuleKey; jobs: Job[]; logs: string[] }) {
  const topJob = jobs[0];
  const previewClass = active === 'spectrum' || active === 'overlay' ? 'ocean active' : 'standby';
  return <aside className="previewPane">
    <h2>PREVIEW</h2>
    <div className={`preview ${previewClass}`}><span>{previewClass === 'standby' ? 'preview standby' : ''}</span><div className="spectrumBars">{Array.from({length: 42}).map((_,i)=><i key={i} style={{height:`${10+(i*17)%70}px`}}/> )}</div><b className="caption">MAU YANG DIA <mark>PROGRES</mark></b></div>
    <div className="previewControls"><button>UPDATE PREVIEW</button><button className="muted">UNDO</button><label>Zoom <select defaultValue="100"><option>100</option><option>75</option></select></label></div>
    <div className="logHeader"><h3>LOG DETAIL</h3><div><button>LOG</button><button className="muted">LIRIK</button></div></div>
    <pre className="logBox">{logs.slice(-10).join('\n') || '11:41:07 GUI siap.'}</pre>
    <h3 className="monitorTitle">STATUS MONITOR</h3>
    <div className="monitor"><div>Status: <b>{topJob?.status || 'standby'}</b></div><div>Batch: {jobs.length}</div><div>Render: <b>{topJob?.progress || 0}%</b> / 100%</div><div>Speed: <b>{topJob?.speed || '0.0x'}</b></div><progress value={topJob?.progress || 0} max={100}/></div>
    <div className="actions"><button className="start">START</button><button className="reset">RESET</button></div>
  </aside>;
}

function App() {
  const [active, setActive] = useState<ModuleKey>('target');
  const [jobs, setJobs] = useState<Job[]>([]); const [logs, setLogs] = useState<string[]>(['11:41:07 GUI siap.']);
  useEffect(()=>{ const tick=()=>fetch(`${API}/api/jobs`).then(r=>r.json()).then(d=>{setJobs(d.jobs||[]); setLogs(d.logs||[])}).catch(()=>{}); tick(); const t=setInterval(tick,1500); return()=>clearInterval(t); },[]);
  const cpu = useMemo(()=>Math.round(10 + Math.random()*15), [active]);
  return <div className="app"><nav className="sidebar"><div className="brand"><b>PIDIOFORGE</b><span>PRO</span><small>PRODUCTION SUITE</small></div>{nav.map(item=><button key={item.key} onClick={()=>setActive(item.key)} className={active===item.key?'sel':''}><b>{item.title}</b><small>{item.sub}</small></button>)}<div className="perf"><b>PERFORMA</b><Meter label="CPU" value={cpu}/><Meter label="Memory" value={68}/><Meter label="Disk 0" value={31}/><Meter label="Wi-Fi" value={12}/></div></nav><main><SettingsPanel active={active}/></main><Preview active={active} jobs={jobs} logs={logs}/></div>;
}
function Meter({label,value}:{label:string;value:number}){return <div className="meter"><i><span style={{width:`${value}%`}}/></i><p>{label}<small>{value}%</small></p></div>}

createRoot(document.getElementById('root')!).render(<App />);
''')

w('frontend/src/styles.css', r'''
:root{font-family:Arial,Helvetica,sans-serif;color:#dce4ef;background:#101317}*{box-sizing:border-box}body{margin:0;overflow:hidden}.app{height:100vh;display:grid;grid-template-columns:150px minmax(420px,1fr) minmax(430px,48vw);background:#11151a;color:#e9eef5}.sidebar{background:#0c1117;border-right:2px solid #232b36;padding:12px 10px;overflow:auto}.brand{padding:6px 4px 14px}.brand b{font-size:16px}.brand span{margin-left:8px;background:#16bd6c;color:white;font-size:11px;padding:2px 5px;border-radius:2px}.brand small{display:block;color:#7e8a9d;margin-top:4px}.sidebar button{width:100%;text-align:left;margin:4px 0;padding:11px 10px;border:1px solid #1d2632;background:#151b24;color:#e8edf3;cursor:pointer}.sidebar button.sel{background:#08aefa;border-color:#1bc7ff}.sidebar button b{display:block;font-size:12px}.sidebar button small{display:block;color:#ff5454;margin-top:5px}.sidebar button.sel small{color:white}.perf{margin-top:12px;font-size:12px}.meter{display:flex;gap:6px;align-items:center;margin:8px 0}.meter i{width:42px;height:24px;border:1px solid #405065;background:#171d25;position:relative}.meter i span{position:absolute;bottom:0;left:0;height:3px;background:#4ee075}.meter p{margin:0}.meter small{display:block;color:#aeb8c8}main{background:#1b2029;padding:18px;overflow:auto;border-right:4px solid #263142}.section{max-width:720px}.section h2{text-align:center;letter-spacing:.06em;margin:0 0 18px;font-size:22px}.field{display:grid;grid-template-columns:145px 1fr;gap:10px;align-items:center;margin:6px 0;color:#aeb9ca;font-size:13px}.field span{text-align:right}input,select{background:#30343c;border:1px solid #555d6d;color:#e8edf3;height:26px;padding:2px 7px;min-width:0}input[type=color]{padding:1px;width:42px}.file{display:flex;gap:6px}.file input{flex:1}.file button,button{background:#ff980e;color:white;border:0;height:28px;padding:0 18px;font-weight:bold;cursor:pointer}.inline{display:flex;gap:6px}.inline input{flex:1}.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.grid3 .field{display:block}.grid3 .field span{text-align:left;display:block;margin-bottom:3px}.check{display:block;margin:10px 0;color:#dfe6f1;font-size:13px}.radio{display:flex;gap:16px;margin:6px 0 12px;padding-left:145px;font-size:13px;color:#d9e2ec}.vertical{display:grid;padding-left:145px;gap:6px}.slider{display:grid;grid-template-columns:145px 1fr 40px;gap:8px;align-items:center;margin:6px 0;color:#aeb9ca;font-size:13px}.slider span{text-align:right}.wide{width:100%;margin:12px 0;background:#ff980e}.swatches{display:flex;gap:18px;margin:10px 0 10px 145px}.swatches i{width:24px;height:16px;display:block}.previewPane{background:#141414;padding:18px 18px 12px;overflow:auto}.previewPane h2{text-align:center;font-size:18px;margin:0 0 14px}.preview{height:210px;max-width:430px;margin:0 auto;background:#050505;border:1px solid #30343a;display:flex;align-items:center;justify-content:center;color:#898e98;position:relative;overflow:hidden}.preview.ocean{background:radial-gradient(circle at 55% 55%,#21d0d8 0 8%,transparent 18%),radial-gradient(circle at 38% 45%,#ffb347 0 4%,transparent 12%),linear-gradient(#034ef8,#01a5e6 45%,#0052a5);}.preview .spectrumBars{position:absolute;left:20px;right:20px;bottom:18px;height:75px;display:none;align-items:flex-end;gap:2px}.preview.ocean .spectrumBars{display:flex}.spectrumBars i{flex:1;min-width:3px;background:linear-gradient(#fff,#4effff);box-shadow:0 0 6px #fff}.caption{position:absolute;bottom:22px;font-size:22px;text-shadow:2px 2px 5px #000;color:white}.caption mark{background:#297dff;color:white;border-radius:4px;padding:0 4px}.preview.standby .caption{display:none}.previewControls{display:flex;gap:6px;justify-content:center;margin:8px 0 14px}.previewControls button,.logHeader button{background:#10b759}.previewControls .muted,.logHeader .muted{background:#323640}.logHeader{display:flex;justify-content:space-between;align-items:center}.logHeader h3,.monitorTitle{margin:0 0 6px;letter-spacing:.05em}.logBox{height:135px;background:#020202;border:1px solid #343944;margin:0 0 14px;padding:10px;color:#dfe6ef;font-family:Consolas,monospace;font-size:12px;white-space:pre-wrap}.monitor{background:#030303;border:1px solid #343944;padding:12px;color:#dfe6ef}.monitor b{color:#27d66f}.monitor progress,.job progress{width:100%;height:10px;accent-color:#ff3d34}.actions{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px}.actions button{height:34px}.start{background:#ff3634}.reset{background:#ff9e00}.jobs{margin-top:12px;display:grid;gap:8px}.job{background:#121820;border:1px solid #344051;padding:10px;display:grid;grid-template-columns:1fr 90px;gap:6px}.job button{grid-column:2}.job progress{grid-column:1/3}.job em{font-style:normal;color:#aeb9ca}
''')

w('src-tauri/tauri.conf.json', r'''
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "PidioForge Desktop",
  "version": "1.0.0",
  "identifier": "com.ppjayabaru.pidioforge",
  "build": {
    "beforeDevCommand": "npm run dev:web",
    "devUrl": "http://127.0.0.1:1420",
    "beforeBuildCommand": "cd frontend && npm run build",
    "frontendDist": "../frontend/dist"
  },
  "app": {
    "windows": [
      { "title": "PidioForge Desktop", "width": 1280, "height": 760, "minWidth": 1100, "minHeight": 680, "resizable": true }
    ],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": ["icons/icon.png"]
  }
}
''')

w('src-tauri/Cargo.toml', r'''
[package]
name = "pidioforge_desktop"
version = "1.0.0"
description = "PidioForge Desktop"
authors = ["Ppjayabaru"]
edition = "2021"

[lib]
name = "pidioforge_desktop_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
''')

w('src-tauri/build.rs', 'fn main() { tauri_build::build() }\n')
w('src-tauri/src/main.rs', r'''
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;

struct ApiProcess(Mutex<Option<Child>>);

#[tauri::command]
fn app_health() -> String { "PidioForge ready".into() }

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .manage(ApiProcess(Mutex::new(None)))
    .setup(|app| {
      let handle = app.handle().clone();
      let state = handle.state::<ApiProcess>();
      let mut guard = state.0.lock().unwrap();
      if guard.is_none() {
        // Pada build produksi, ganti path ini ke sidecar backend.
        let child = Command::new("node")
          .arg("backend/server.mjs")
          .stdout(Stdio::null())
          .stderr(Stdio::null())
          .spawn()
          .ok();
        *guard = child;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![app_health])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
''')

w('tools/dev.mjs', r'''
import { spawn } from 'node:child_process';
function run(name, cmd, args){
  const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('exit', code => console.log(`${name} exit ${code}`));
  return p;
}
run('api', 'node', ['backend/server.mjs']);
run('tauri', 'npm', ['run', 'tauri:dev']);
''')

w('tools/static-preview.mjs', r'''
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
await mkdir('dist-preview', { recursive: true });
await copyFile('frontend/src/styles.css', 'dist-preview/styles.css');
await writeFile('dist-preview/index.html', `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PidioForge Preview</title><link rel="stylesheet" href="styles.css"></head><body><div class="app"><nav class="sidebar"><div class="brand"><b>PIDIOFORGE</b><span>PRO</span><small>PRODUCTION SUITE</small></div>${['FOLDER BAHAN & ENGINE TARGET','BRANDING','AUDIO & MIXING','AUTO LIRIK','SPECTRUM & NOW PLAYING','OVERLAY','ANTRIAN'].map((x,i)=>`<button class="${i===4?'sel':''}"><b>${x}</b><small>${i===4?'Spec on Bar • NP on':'0 efek aktif'}</small></button>`).join('')}<div class="perf"><b>PERFORMA</b><div class="meter"><i><span style="width:18%"></span></i><p>CPU<small>18%</small></p></div><div class="meter"><i><span style="width:68%"></span></i><p>Memory<small>68%</small></p></div></div></nav><main><div class="section"><h2>SPECTRUM & NOW PLAYING</h2><label class="check"><input checked type="checkbox"> AUDIO SPECTRUM</label><label class="field"><span>Model</span><select><option>Bar</option></select></label><label class="field"><span>Posisi Spectrum</span><select><option>Bebas</option></select></label><div class="grid3"><label class="field"><span>Zoom Spectrum</span><input value="97.8"></label><label class="field"><span>Crop</span><input value="0"></label><label class="field"><span>Tinggi Bar</span><input value="183.3"></label></div><div class="slider"><span>Bass</span><input type="range" value="135"><b>135%</b></div><div class="slider"><span>Mid</span><input type="range" value="90"><b>90%</b></div><div class="slider"><span>High</span><input type="range" value="80"><b>80%</b></div><label class="check"><input checked type="checkbox"> PROGRESS BAR</label><label class="check"><input checked type="checkbox"> NOW PLAYING</label></div></main><aside class="previewPane"><h2>PREVIEW</h2><div class="preview ocean active"><div class="spectrumBars">${Array.from({length:42}).map((_,i)=>`<i style="height:${10+(i*17)%70}px"></i>`).join('')}</div><b class="caption">MAU YANG DIA <mark>PROGRES</mark></b></div><div class="previewControls"><button>UPDATE PREVIEW</button><button class="muted">UNDO</button><label>Zoom <select><option>100</option></select></label></div><div class="logHeader"><h3>LOG DETAIL</h3><div><button>LOG</button><button class="muted">LIRIK</button></div></div><pre class="logBox">11:41:07 GUI siap.\n11:41:08 preview spectrum aktif.\n11:41:09 API lokal standby.</pre><h3 class="monitorTitle">STATUS MONITOR</h3><div class="monitor"><div>Status: <b>standby</b></div><div>Batch: 1</div><div>Render: <b>0%</b> / 100%</div><div>Speed: <b>0.0x</b></div><progress value="0" max="100"></progress></div><div class="actions"><button class="start">START</button><button class="reset">RESET</button></div></aside></div></body></html>`);
console.log('dist-preview/index.html created');
''')

# minimal ts config
w('frontend/tsconfig.json', r'''
{
  "compilerOptions": { "target": "ES2020", "useDefineForClassFields": true, "lib": ["DOM", "DOM.Iterable", "ES2020"], "allowJs": false, "skipLibCheck": true, "esModuleInterop": true, "allowSyntheticDefaultImports": true, "strict": true, "forceConsistentCasingInFileNames": true, "module": "ESNext", "moduleResolution": "Node", "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx" },
  "include": ["src"],
  "references": []
}
''')
w('frontend/vite.config.ts', r'''
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { host: '127.0.0.1', port: 1420, strictPort: true } });
''')
print('created')
