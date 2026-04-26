import { ipcMain } from 'electron';

export function setupKritaHandlers() {
    // Handler to get Krita's current document resolution
    ipcMain.handle('krita:get-resolution', async () => {
        try {
            // Using standard Node fetch (available in modern Electron)
            const res = await fetch('http://127.0.0.1:5000/resolution');
            return await res.json();
        } catch (err) {
            console.error("IPC: Krita resolution fetch failed:", err);
            // Fallback resolution if Krita isn't open or responding
            return { width: 1920, height: 1080 }; 
        }
    });

    // Handler to send the heavy base64 image data to Krita
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