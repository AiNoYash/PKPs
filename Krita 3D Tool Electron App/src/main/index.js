"use strict";

import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { ipcMain } from 'electron';
import { setupStoreHandlers } from './core/store';
import { setupProjectHandlers } from './core/ipc/dialogHandlers.js';
import "./core/ipc/fileHandlers.js";
import { setupKritaHandlers } from './core/ipc/kritaHandlers.js';

let mainWindow = null;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: "#151515", // ? Colors taken from index.css color-bg-border and color-text-secondary
      symbolColor: "#8A8A8A",
      height: 33 // ? I am making app in 1.25 screen scaling and this looks perfect as 40 px so...
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    }
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window-state-change', 'fullscreen');
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window-state-change', 'windowed');
  });

  // Let renderer query the initial state on load
  ipcMain.handle('get-window-state', () => {
    return mainWindow.isFullScreen() ? 'fullscreen' : 'windowed';
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
};


const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit();

} else {

  setupStoreHandlers();
  setupProjectHandlers();

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });


  // This method will be called when Electron has finished initialization and is ready to create browser windows.
  // ? Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // ? Set app user model id for windows
    electronApp.setAppUserModelId('com.krita.3d.tool.app')

    // ? Default open or close DevTools by F12 in development and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    });

    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

  });

  setupKritaHandlers();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  

  ipcMain.on('quit-app', () => {
    app.quit();
  });
}
