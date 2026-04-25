import { dialog, ipcMain } from 'electron';
import path from 'path';

export function setupProjectHandlers() {
    ipcMain.handle('dialog:newProject', async () => {
        const result = await dialog.showSaveDialog({
            title: 'Create New Project',
            buttonLabel: 'Create Project',
            message: 'Choose a location and name for your new project folder',
            properties: ['createDirectory', 'showHiddenFiles'] 
        });

        if (result.canceled || !result.filePath) {
            return null; // User clicked Cancel
        }

        // result.filePath will be something like: "/Users/username/Documents/MyAwesomeProject"
        const projectName = path.basename(result.filePath);
        const parentDirectory = path.dirname(result.filePath);

        return { parentDirectory, projectName };
    });

    ipcMain.handle('dialog:openProject', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Open 3D Project',
            buttonLabel: 'Open Project',
            properties: ['openDirectory'] // Restrict selection to folders only
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return null; // User clicked Cancel
        }

        return result.filePaths[0]; // Return the selected folder path
    });

    ipcMain.handle('dialog:openFileImport', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Import Asset File',
            buttonLabel: 'Import',
            properties: ['openFile'] // Restrict selection to folders only
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return null; // User clicked Cancel
        }

        return result.filePaths[0]; // Return the selected folder path
    });

}