// tools/smoke-presets.mjs
import { mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const port = Number(process.env.PIDIOFORGE_TEST_PORT || 8822);
const base = `http://127.0.0.1:${port}`;
const root = path.join(os.tmpdir(), `pidioforge-presets-smoke-${Date.now()}`);

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
async function api(route, body, method) {
  const m = method ?? (body !== undefined ? 'POST' : 'GET');
  const r = await fetch(base + route, {
    method: m,
    headers: { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!r.ok) throw new Error(`${m} ${route} ${r.status}: ${text.slice(0, 300)}`);
  return json;
}
async function waitForApi() {
  for (let i = 0; i < 30; i++) {
    try {
      return await api('/api/health');
    } catch {
      await wait(400);
    }
  }
  throw new Error('API tidak aktif');
}

let child;
if (process.env.PIDIOFORGE_START_API !== '0') {
  await mkdir(root, { recursive: true });
  child = spawn(process.execPath, ['backend/server.mjs'], {
    env: { ...process.env, PIDIOFORGE_API_PORT: String(port), PIDIOFORGE_DATA_DIR: path.join(root, 'data') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', b => process.stdout.write(`[api] ${b}`));
  child.stderr.on('data', b => process.stderr.write(`[api] ${b}`));
}

try {
  await waitForApi();

  // 1. Branding presets list
  const branding = await api('/api/branding/presets', undefined, 'GET');
  if (!Array.isArray(branding.presets) || branding.presets.length < 2) throw new Error('Branding presets missing');
  console.log(`branding presets: ${branding.presets.map(p => p.id).join(', ')}`);

  const youtubeFullPreset = branding.presets.find(p => p.id === 'youtube-full');
  if (!youtubeFullPreset) throw new Error('youtube-full preset missing');

  // 2. Overlay presets list
  const overlay = await api('/api/overlay/presets', undefined, 'GET');
  if (!Array.isArray(overlay.presets) || overlay.presets.length < 3) throw new Error('Overlay presets missing');
  console.log(`overlay presets: ${overlay.presets.map(p => p.id).join(', ')}`);

  // 3. Spectrum presets list
  const spectrum = await api('/api/spectrum/presets', undefined, 'GET');
  if (!Array.isArray(spectrum.presets) || spectrum.presets.length < 2) throw new Error('Spectrum presets missing');
  console.log(`spectrum presets: ${spectrum.presets.map(p => p.id).join(', ')}`);

  // 4. Audio presets list
  const audio = await api('/api/audio/presets', undefined, 'GET');
  if (!Array.isArray(audio.presets) || audio.presets.length < 3) throw new Error('Audio presets missing');
  console.log(`audio presets: ${audio.presets.map(p => p.id).join(', ')}`);

  // 5. Performance presets list
  const perf = await api('/api/performance/presets', undefined, 'GET');
  if (!Array.isArray(perf.presets) || perf.presets.length < 2) throw new Error('Performance presets missing');
  console.log(`performance presets: ${perf.presets.map(p => p.id).join(', ')}`);

  // 6. Save user preset, apply
  const savedPreset = await api('/api/presets', {
    name: 'YouTube Full (smoke)',
    config: youtubeFullPreset.patch,
  });
  if (!savedPreset.id) throw new Error('Preset save failed');
  const appliedCfg = await api(`/api/presets/${savedPreset.id}/apply`, {});
  if (!appliedCfg.branding?.logoEnabled) throw new Error('Preset apply: logoEnabled not set');
  console.log('user preset save+apply ok');

  // 7. Save user template, apply, verify
  const tpl = await api('/api/templates', {
    name: 'Neon Cinematic (smoke)',
    description: 'Neon bars + cinematic overlay',
    modules: ['spectrum', 'overlay'],
    config: {
      ...spectrum.presets.find(p => p.id === 'neon-bars').patch,
      ...overlay.presets.find(p => p.id === 'cinematic').patch,
    },
  });
  if (!tpl.id) throw new Error('Template save failed');
  const afterTpl = await api(`/api/templates/${tpl.id}/apply`, {});
  if (afterTpl.spectrum?.model !== 'Bar') throw new Error('Template apply: spectrum model wrong');
  if (!afterTpl.overlay?.vignette) throw new Error('Template apply: vignette not set');
  console.log('template save+apply ok');

  // 8. Performance apply
  const perfApply = await api('/api/performance/apply', { mode: 'turbo' });
  if (!perfApply.config?.performance?.mode) throw new Error('Performance apply: no mode in config');
  console.log(`performance apply ok: mode=${perfApply.config.performance.mode}`);

  // 9. Branding validate
  const brandVal = await api('/api/branding/validate', { config: { branding: { logoEnabled: true, logo: '' } } });
  if (typeof brandVal.ok !== 'boolean') throw new Error('Branding validate: no ok field');
  console.log(`branding validate ok=${brandVal.ok} warnings=${brandVal.warnings?.length}`);

  // 10. Overlay validate
  const ovVal = await api('/api/overlay/validate', {
    config: { overlay: { lowerThirdEnabled: true, lowerThirdText: '' } },
  });
  if (!ovVal.warnings?.length) throw new Error('Overlay validate: expected warning for empty lowerThirdText');
  console.log(`overlay validate warning ok: ${ovVal.warnings[0]}`);

  // 11. Delete template
  const delTpl = await fetch(`${base}/api/templates/${tpl.id}`, { method: 'DELETE' });
  if (!delTpl.ok) throw new Error(`Template delete failed: ${delTpl.status}`);
  const tplList = await api('/api/templates', undefined, 'GET');
  if ((tplList.templates || []).find(t => t.id === tpl.id)) throw new Error('Template not deleted');
  console.log('template delete ok');

  console.log('smoke:presets ok');
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  if (child) child.kill('SIGTERM');
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
