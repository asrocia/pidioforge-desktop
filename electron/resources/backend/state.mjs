import { readFile, writeFile, mkdir, rename, copyFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { defaultConfig, defaultState, deepMerge, workspaceDir, dbPath } from './config.mjs';

let writeChain = Promise.resolve();
let stateUpdateChain = Promise.resolve();

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function replaceFileWithRetry(tmpPath, finalPath, attempts = 8) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      await rename(tmpPath, finalPath);
      return;
    } catch (error) {
      lastError = error;
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(error?.code)) throw error;
      await sleep(40 + i * 80);
    }
  }
  try {
    await copyFile(tmpPath, finalPath);
    await unlink(tmpPath).catch(() => {});
    return;
  } catch (error) {
    throw lastError || error;
  }
}

export async function loadState() {
  await mkdir(workspaceDir, { recursive: true });
  if (!existsSync(dbPath)) { await saveState(defaultState); return structuredClone(defaultState); }
  let state;
  try { state = JSON.parse(await readFile(dbPath, 'utf8')); }
  catch { try { await rename(dbPath, `${dbPath}.corrupt-${Date.now()}`); } catch {} state = structuredClone(defaultState); await saveState(state); }
  state.projects ||= defaultState.projects;
  state.presets ||= defaultState.presets;
  state.jobs ||= [];
  state.queue = deepMerge(defaultState.queue, state.queue || {});
  state.logs ||= [];
  state.activeProjectId ||= state.projects[0]?.id || 'default';
  // merge new defaults into older saved projects
  state.projects = state.projects.map(p => ({ ...p, config: deepMerge(defaultConfig, p.config || {}) }));
  return state;
}

export async function saveState(state) {
  const data = JSON.stringify(state, null, 2);
  writeChain = writeChain.then(async () => {
    await mkdir(workspaceDir, { recursive: true });
    const tmpPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
    const backupPath = `${dbPath}.bak`;
    await writeFile(tmpPath, data);
    if (existsSync(dbPath)) await copyFile(dbPath, backupPath).catch(() => {});
    await replaceFileWithRetry(tmpPath, dbPath);
  }).catch(async (error) => {
    await writeFile(`${dbPath}.failed-${Date.now()}.json`, data).catch(() => {});
    throw error;
  });
  return writeChain;
}

export async function updateState(mutator) {
  stateUpdateChain = stateUpdateChain.then(async () => { const state = await loadState(); await mutator(state); await saveState(state); return state; });
  return stateUpdateChain;
}

export function activeProject(state) { return state.projects.find(p => p.id === state.activeProjectId) || state.projects[0]; }

export function activeConfig(state) { return activeProject(state)?.config || defaultConfig; }

export function addLog(state, msg) { const time = new Date().toLocaleTimeString('id-ID', { hour12: false }); state.logs.push(`${time} ${msg}`); state.logs = state.logs.slice(-500); }

export function jlog(state, line) { if (String(line).length < 900) addLog(state, line); else addLog(state, String(line).slice(0, 900) + '...'); }
