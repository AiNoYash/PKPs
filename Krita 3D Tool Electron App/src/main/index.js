"use strict";

import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';


let mainWindow = null;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    titleBarStyle: 'hidden',
    fullscreen: true,
    titleBarOverlay: {
      color: "#151515", // ? Colors taken from index.css color-bg-border and color-text-secondary
      symbolColor: "#8A8A8A",
      height: 30
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    }
  });

  // mainWindow.on('ready-to-show', () => {
  //   mainWindow.show()
  // })


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



  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

