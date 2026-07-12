import { createRequire } from 'node:module';
import { ipcMain } from 'electron';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

export function setupAutoUpdater(win) {
  mainWindow = win;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('updater:status', { status: 'checking' });
  });

  autoUpdater.on('update-available', info => {
    sendToRenderer('updater:status', {
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('updater:status', { status: 'up-to-date' });
  });

  autoUpdater.on('download-progress', progress => {
    sendToRenderer('updater:status', {
      status: 'downloading',
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', info => {
    sendToRenderer('updater:status', {
      status: 'ready',
      version: info.version,
    });
  });

  autoUpdater.on('error', err => {
    sendToRenderer('updater:status', {
      status: 'error',
      error: err?.message || 'Update check failed',
    });
  });

  ipcMain.handle('pidioforge:check-update', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, version: result?.updateInfo?.version };
    } catch (err) {
      return { ok: false, error: err?.message };
    }
  });

  ipcMain.handle('pidioforge:download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message };
    }
  });

  ipcMain.handle('pidioforge:install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Check for updates 5 seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
}

function sendToRenderer(channel, data) {
  if (mainWindow?.webContents && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}
