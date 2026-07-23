import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pidioforge', {
  pickPath: options => ipcRenderer.invoke('pidioforge:pick-path', options),
  pickPaths: options => ipcRenderer.invoke('pidioforge:pick-paths', options),
  revealPath: targetPath => ipcRenderer.invoke('pidioforge:reveal-path', targetPath),
  notify: (title, body) => ipcRenderer.invoke('pidioforge:notify', { title, body }),
  saveFile: options => ipcRenderer.invoke('pidioforge:save-file', options),
  readFile: filePath => ipcRenderer.invoke('pidioforge:read-file', filePath),
  checkUpdate: () => ipcRenderer.invoke('pidioforge:check-update'),
  downloadUpdate: () => ipcRenderer.invoke('pidioforge:download-update'),
  installUpdate: () => ipcRenderer.invoke('pidioforge:install-update'),
  onUpdateStatus: callback => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
});
