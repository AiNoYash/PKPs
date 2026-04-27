import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('Application', {
  quitApp: () => ipcRenderer.send('quit-app'),
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, val) => ipcRenderer.invoke('store:set', key, val),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  system: process.platform,
});

contextBridge.exposeInMainWorld('Project', {
  // Generic invoke — used by the Project panel and any future IPC calls
  // that don't need a dedicated wrapper here.
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld('kritaAPI', {
  checkConnection: () => ipcRenderer.invoke('krita:check-connection'), 
  getResolution: () => ipcRenderer.invoke('krita:get-resolution'),
  sendSnapshot: (imageData) => ipcRenderer.invoke('krita:send-snapshot', imageData)
});