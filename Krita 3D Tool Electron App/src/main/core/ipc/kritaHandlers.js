import { ipcMain } from 'electron';

export function setupKritaHandlers() {
    ipcMain.handle('krita:check-connection', async () => {
        try {
            const res = await fetch('http://127.0.0.1:5000/ping');
            if (!res.ok) return { connected: false };
            
            // NEW: Parse JSON to fetch the command attached by Krita
            const data = await res.json();
            return { connected: true, command: data.command };
        } catch (err) {
            return { connected: false };
        }
    });

    ipcMain.handle('krita:get-resolution', async () => {
        try {
            const res = await fetch('http://127.0.0.1:5000/resolution');
            return await res.json();
        } catch (err) {
            console.error("IPC: Krita resolution fetch failed:", err);
            return null; 
        }
    });

    ipcMain.handle('krita:send-snapshot', async (event, imageData) => {
        try {
            const res = await fetch('http://127.0.0.1:5000/snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });
            return res.ok;
        } catch (err) {
            console.error("IPC: Krita snapshot send failed:", err);
            return false;
        }
    });
}