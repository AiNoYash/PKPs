import Store from 'electron-store';
import { ipcMain } from 'electron';
// ? The "not a constructor" for Store error happens because v11+ is a pure ESM package, but electron-vite compiles your src/main files into CommonJS. The import gets wrapped in an object, so you end up trying to call new on an object instead of the class.
// Access the default export if the transpiler wrapped it


const StoreClass = Store.default || Store;
const store = new StoreClass();

store.clear(); // ! Remove this to test storing functionalities


export function setupStoreHandlers() {
    ipcMain.handle('store:get', (_, key) => {
        return store.get(key);
    });

    ipcMain.handle('store:set', (_, key, val) => {
        store.set(key, val);
    });
}