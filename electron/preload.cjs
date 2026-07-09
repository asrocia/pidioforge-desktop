const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pidioforge', {
  pickPath: (options) => ipcRenderer.invoke('pidioforge:pick-path', options),
  revealPath: (targetPath) => ipcRenderer.invoke('pidioforge:reveal-path', targetPath),
  notify: (title, body) => ipcRenderer.invoke('pidioforge:notify', { title, body }),
  saveFile: (options) => ipcRenderer.invoke('pidioforge:save-file', options),
  readFile: (filePath) => ipcRenderer.invoke('pidioforge:read-file', filePath),
});
