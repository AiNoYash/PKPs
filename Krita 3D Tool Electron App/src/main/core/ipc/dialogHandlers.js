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

    // -----------------------------------------------------------------------------
    // "dialog:showConfirmation"
    //
    // Shows a native OS confirmation dialog (via Electron's dialog module) and
    // returns whether the user confirmed or cancelled.
    //
    // Used by the frontend before performing destructive operations like delete.
    // Running this in the main process is required — dialog is not available
    // in the renderer process directly.
    //
    // Expected args from frontend:
    //   {
    //     title:   string  — Dialog window title  (e.g. "Delete File")
    //     message: string  — Main message text    (e.g. "Are you sure you want to delete robot.glb?")
    //     detail:  string  — Secondary detail text (e.g. "This action cannot be undone.")
    //   }
    //
    // Returns:
    //   { confirmed: boolean }
    //   confirmed = true  → user clicked the destructive/confirm button
    //   confirmed = false → user clicked Cancel
    // -----------------------------------------------------------------------------
    ipcMain.handle("dialog:showConfirmation", async (_event, { title, message, detail }) => {
    const response = await dialog.showMessageBox({
        type: "warning",
        title,
        message,
        detail,
        buttons: ["Cancel", "Delete"],
        defaultId: 0,   // Cancel is the default — user must actively choose Delete
        cancelId: 0,    // Pressing Escape = Cancel
    });
    
    // response.response is the index of the button clicked.
    // 0 = Cancel, 1 = Delete
    return { confirmed: response.response === 1 };
    });

}