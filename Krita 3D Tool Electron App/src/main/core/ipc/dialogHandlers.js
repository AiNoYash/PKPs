import { dialog, ipcMain } from 'electron';
import path from 'path';

export function setupProjectHandlers() {
    
    // ---------------------------------------------------------
    // 1. New Project Dialog
    // Uses showSaveDialog so the user can type a folder name
    // ---------------------------------------------------------
    ipcMain.handle('dialog:newProject', async () => {
        const result = await dialog.showSaveDialog({
            title: 'Create New 3D Project',
            buttonLabel: 'Create Project',
            message: 'Choose a location and name for your new project folder',
            // properties array handles OS-specific behaviors
            properties: ['createDirectory', 'showHiddenFiles'] 
        });

        if (result.canceled || !result.filePath) {
            return null; // User clicked Cancel
        }

        // result.filePath will be something like: "/Users/username/Documents/MyAwesomeProject"
        // We split it so we can pass it directly to your existing ProjectService
        const projectName = path.basename(result.filePath);
        const parentDirectory = path.dirname(result.filePath);

        return { parentDirectory, projectName };
    });

    // ---------------------------------------------------------
    // 2. Open Project Dialog
    // Uses showOpenDialog restricted to selecting folders
    // ---------------------------------------------------------
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

}