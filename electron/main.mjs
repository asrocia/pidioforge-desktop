import { app, BrowserWindow, dialog, ipcMain, shell, Notification } from 'electron';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setupAutoUpdater } from './updater.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronDir = path.dirname(fileURLToPath(import.meta.url));
const apiPort = process.env.PIDIOFORGE_API_PORT || '8787';
const devUrl = process.env.PIDIOFORGE_DEV_SERVER_URL || 'http://127.0.0.1:1420';

let mainWindow;
let apiProcess;

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('no-sandbox');

function platformResourceName() {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'macos';
  return 'linux';
}

function resourceDir() {
  return app.isPackaged ? process.resourcesPath : path.join(root, 'electron', 'resources');
}

function backendScript(resources) {
  const bundled = path.join(resources, 'backend', 'server.mjs');
  if (existsSync(bundled)) return bundled;
  return path.join(root, 'backend', 'server.mjs');
}

function nodeCommand() {
  return {
    command: process.execPath,
    env: { ELECTRON_RUN_AS_NODE: '1' },
  };
}

async function isApiHealthy() {
  try {
    const res = await fetch(`http://127.0.0.1:${apiPort}/api/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForApi() {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    if (await isApiHealthy()) return true;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return false;
}

async function startApi() {
  if (apiProcess || (await isApiHealthy())) return;

  const resources = resourceDir();
  const dataDir = path.join(app.getPath('userData'), 'backend-data');
  const logDir = path.join(app.getPath('userData'), 'logs');
  await mkdir(dataDir, { recursive: true });
  await mkdir(logDir, { recursive: true });

  const script = backendScript(resources);
  const { command, env } = nodeCommand(resources);
  const stdout = createWriteStream(path.join(logDir, 'api.out.log'), { flags: 'a' });
  const stderr = createWriteStream(path.join(logDir, 'api.err.log'), { flags: 'a' });

  apiProcess = spawn(command, [script], {
    cwd: path.dirname(path.dirname(script)),
    env: {
      ...process.env,
      ...env,
      PIDIOFORGE_API_PORT: apiPort,
      PIDIOFORGE_RESOURCE_DIR: resources,
      PIDIOFORGE_APP_DIR: app.getAppPath(),
      PIDIOFORGE_DATA_DIR: dataDir,
      PIDIOFORGE_PLATFORM_RESOURCE: platformResourceName(),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  apiProcess.stdout?.pipe(stdout);
  apiProcess.stderr?.pipe(stderr);
  apiProcess.on('error', error => {
    console.error('Backend process failed:', error);
  });
  apiProcess.on('exit', () => {
    apiProcess = undefined;
    stdout.end();
    stderr.end();
  });

  if (!(await waitForApi())) {
    const process = apiProcess;
    apiProcess = undefined;
    process?.kill();
    stdout.end();
    stderr.end();
    throw new Error(`Backend API unavailable on port ${apiPort}. Check logs in ${logDir}`);
  }
}

function stopApi() {
  if (!apiProcess) return;
  const child = apiProcess;
  apiProcess = undefined;
  child.kill('SIGTERM');
}

ipcMain.handle('pidioforge:pick-path', async (_event, options = {}) => {
  const requestedKind = String(options.kind || 'file').toLowerCase();
  const kind = ['file', 'directory', 'save'].includes(requestedKind) ? requestedKind : 'file';
  const filters =
    Array.isArray(options.filters) && options.filters.length
      ? options.filters
      : [
          {
            name: 'Media',
            extensions: [
              'mp4',
              'mov',
              'mkv',
              'webm',
              'avi',
              'mp3',
              'wav',
              'aac',
              'm4a',
              'flac',
              'ogg',
              'jpg',
              'jpeg',
              'png',
              'webp',
              'bmp',
              'lrc',
              'srt',
              'txt',
            ],
          },
        ];
  if (kind === 'save') {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options.title || 'Pilih output',
      defaultPath: options.defaultPath || undefined,
      filters,
    });
    return result.canceled ? '' : result.filePath || '';
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || (kind === 'directory' ? 'Pilih folder' : 'Pilih file'),
    defaultPath: options.defaultPath || undefined,
    properties: kind === 'directory' ? ['openDirectory', 'createDirectory'] : ['openFile'],
    filters: kind === 'directory' ? undefined : filters,
  });
  return result.canceled ? '' : result.filePaths?.[0] || '';
});

ipcMain.handle('pidioforge:reveal-path', async (_event, targetPath = '') => {
  if (!targetPath) return { ok: false, error: 'path kosong' };
  const resolved = path.resolve(String(targetPath));
  if (existsSync(resolved)) {
    shell.showItemInFolder(resolved);
    return { ok: true };
  }
  const parent = path.dirname(resolved);
  if (existsSync(parent)) {
    await shell.openPath(parent);
    return { ok: true };
  }
  return { ok: false, error: 'folder tidak ditemukan' };
});

ipcMain.handle('pidioforge:notify', async (_event, { title = '', body = '' } = {}) => {
  if (!Notification.isSupported()) return;
  new Notification({ title: title || 'PidioForge', body: body || '' }).show();
});
ipcMain.handle('pidioforge:save-file', async (_event, { content = '', defaultName = 'project.pidioforge' } = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Project',
    defaultPath: defaultName,
    filters: [{ name: 'PidioForge Project', extensions: ['pidioforge'] }],
  });
  if (result.canceled || !result.filePath) return { ok: false };
  const { writeFile } = await import('node:fs/promises');
  await writeFile(result.filePath, content, 'utf8');
  return { ok: true, path: result.filePath };
});

ipcMain.handle('pidioforge:read-file', async (_event, filePath = '') => {
  if (!filePath) {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Project',
      filters: [{ name: 'PidioForge Project', extensions: ['pidioforge', 'json'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths?.[0]) return { ok: false };
    filePath = result.filePaths[0];
  }
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(filePath, 'utf8');
  return { ok: true, content, path: filePath };
});

async function createWindow() {
  await startApi();

  mainWindow = new BrowserWindow({
    title: 'PidioForge Desktop',
    width: 1366,
    height: 768,
    minWidth: 900,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(electronDir, 'preload.cjs'),
      sandbox: true,
    },
  });

  mainWindow.maximize();
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    setupAutoUpdater(mainWindow);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (app.isPackaged) {
    await mainWindow.loadFile(path.join(root, 'frontend', 'dist', 'index.html'));
  } else {
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

const locked = app.requestSingleInstanceLock();
if (!locked) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(createWindow);
  app.on('before-quit', stopApi);
  app.on('window-all-closed', () => {
    stopApi();
    if (process.platform !== 'darwin') app.quit();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
