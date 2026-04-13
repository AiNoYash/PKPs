import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('Application', {
  quitApp: () => ipcRenderer.send('quit-app')
});