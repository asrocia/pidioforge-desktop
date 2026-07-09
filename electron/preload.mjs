import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pidioforge', {
  pickPath: (options) => ipcRenderer.invoke('pidioforge:pick-path', options),
});
