import Store from 'electron-store';
import { ipcMain } from 'electron';

const store = new Store();

export function setupStoreHandlers() {
    ipcMain.handle('store:get', (_, key) => {
        return store.get(key);
    });

    ipcMain.handle('store:set', (_, key, val) => {
        store.set(key, val);
    });
}