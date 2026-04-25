import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('Application', {
  quitApp: () => ipcRenderer.send('quit-app'),
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, val) => ipcRenderer.invoke('store:set', key, val),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  system: process.platform
});