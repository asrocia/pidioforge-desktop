// tools/smoke-project.mjs
import { mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const port = Number(process.env.PIDIOFORGE_TEST_PORT || 8820);
const base = `http://127.0.0.1:${port}`;
const root = path.join(os.tmpdir(), `pidioforge-project-smoke-${Date.now()}`);

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

  // 1. Create project
  const p = await api('/api/projects', { name: 'Smoke Project', config: { input: { title: 'Smoke' } } });
  if (!p.id) throw new Error('Project creation: no id');
  console.log(`project created: ${p.id}`);

  // 2. Activate
  await api(`/api/projects/${p.id}/activate`, {});
  const state = await api('/api/state');
  if (state.activeProjectId !== p.id) throw new Error('Activate failed');
  console.log('activate ok');

  // 3. Rename
  const renamed = await api(`/api/projects/${p.id}/rename`, { name: 'Renamed Project' });
  if (renamed.name !== 'Renamed Project') throw new Error('Rename failed');
  console.log('rename ok');

  // 4. Config patch persisted
  await api('/api/config', { input: { title: 'Smoke Config Test' } });
  const cfg = await api('/api/config');
  if (cfg.input?.title !== 'Smoke Config Test') throw new Error('Config patch not persisted');
  console.log('config patch ok');

  // 5. Duplicate project
  const dup = await api(`/api/projects/${p.id}/duplicate`, {});
  if (!dup.id || dup.id === p.id) throw new Error('Duplicate failed');
  console.log(`duplicate ok: ${dup.id}`);

  // 6. Export
  const exported = await api(`/api/projects/${p.id}/export`, undefined, 'GET');
  if (!exported.version || !exported.project?.config) throw new Error('Export format invalid');
  console.log('export ok');

  // 7. Import (roundtrip)
  const imported = await api('/api/projects/import', { project: exported.project });
  if (!imported.id) throw new Error('Import: no id returned');
  if (imported.name !== exported.project.name) throw new Error('Import: name mismatch');
  console.log(`import ok: ${imported.id}`);

  // 8. Save preset
  const preset = await api('/api/presets', { name: 'Smoke Preset', config: cfg });
  if (!preset.id) throw new Error('Preset save failed');
  console.log(`preset saved: ${preset.id}`);

  // 9. Apply preset
  const afterPreset = await api(`/api/presets/${preset.id}/apply`, {});
  if (!afterPreset.input) throw new Error('Preset apply returned no config');
  console.log('preset apply ok');

  // 10. Save template
  const tpl = await api('/api/templates', {
    name: 'Smoke Template',
    description: 'E2E test template',
    modules: ['spectrum', 'lyrics'],
    config: { spectrum: { enabled: true, model: 'Wave' } },
  });
  if (!tpl.id) throw new Error('Template save failed');
  console.log(`template saved: ${tpl.id}`);

  // 11. Apply template
  const afterTpl = await api(`/api/templates/${tpl.id}/apply`, {});
  if (afterTpl.spectrum?.model !== 'Wave') throw new Error('Template apply: spectrum model wrong');
  console.log('template apply ok');

  // 12. Delete dup project
  await api(`/api/projects/${dup.id}/delete`, {});
  const projects = await api('/api/projects');
  if (projects.projects.find(x => x.id === dup.id)) throw new Error('Delete failed: dup still present');
  console.log('project delete ok');

  // 13. Cannot delete last project guard
  const allP = await api('/api/projects');
  if (allP.projects.length === 1) {
    const deleteRes = await fetch(`${base}/api/projects/${allP.projects[0].id}/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (deleteRes.status !== 400) throw new Error('Guard: deleting last project should return 400');
    console.log('last-project guard ok');
  }

  console.log('smoke:project ok');
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  if (child) child.kill('SIGTERM');
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
