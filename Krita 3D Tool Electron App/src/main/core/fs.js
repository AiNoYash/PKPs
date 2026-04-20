import fs from 'fs';
import { dialog, ipcMain } from 'electron';




export function setupProjectHandlers() {
    
    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (canceled || filePaths.length === 0) return null;

        const folderPath = filePaths[0];
        try {
            // Read directory and get file types
            const files = fs.readdirSync(folderPath, { withFileTypes: true }).map(dirent => ({
                name: dirent.name,
                isDirectory: dirent.isDirectory(),
                path: join(folderPath, dirent.name)
            }));

            // Sort: Folders first, then files alphabetically
            files.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            return { folderPath, files };
        } catch (error) {
            console.error("Failed to read directory:", error);
            return null;
        }
    });

}
