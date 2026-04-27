import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('Application', {
  quitApp: () => ipcRenderer.send('quit-app'),
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, val) => ipcRenderer.invoke('store:set', key, val),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  system: process.platform,
});

contextBridge.exposeInMainWorld('Project', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

contextBridge.exposeInMainWorld('kritaAPI', {
  checkConnection: () => ipcRenderer.invoke('krita:check-connection'), 
  getResolution: () => ipcRenderer.invoke('krita:get-resolution'),
  sendSnapshot: (imageData) => ipcRenderer.invoke('krita:send-snapshot', imageData),
  getLayers: () => ipcRenderer.invoke('krita:get-layers') // NEW
});

contextBridge.exposeInMainWorld('electronAPI', {
  getWindowState: () => ipcRenderer.invoke('get-window-state'),
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window-state-change', (_event, state) => callback(state));
    // Returning cleanup function
    return () => ipcRenderer.removeAllListeners('window-state-change');
  },
});