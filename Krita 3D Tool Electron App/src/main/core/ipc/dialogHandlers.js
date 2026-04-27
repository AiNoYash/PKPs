import { dialog, ipcMain } from 'electron';
import path from 'path';
import { loadTable } from '../services/GuidTableService';
import { createScene, saveScene } from '../services/SceneService';
import { useStore } from '../../../renderer/src/context/useStore';

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

    ipcMain.handle("dialog:saveAsScene", async (_event, { projectPath }) => {
        let result;
        try {
            result = await dialog.showSaveDialog({
                defaultPath: `${projectPath}/scenes/untitled`,
                title: 'Save Current Scene',
            });
        } catch (err) {
            console.error("dialog:saveAsScene: Failed to open dialog:", err);
            return { success: false, error: "Failed to open save dialog." };
        }
    
        if (result.canceled || !result.filePath) return null; // User cancelled
    
        const chosenPath = result.filePath;
        const fileName = path.basename(chosenPath);
    
        let table;
        try {
            table = loadTable(projectPath);
        } catch (err) {
            console.error("dialog:saveAsScene: loadTable failed:", err);
            return { success: false, error: "Failed to load project table." };
        }
    
        let res;
        try {
            res = createScene(projectPath, fileName, table);
        } catch (err) {
            console.error("dialog:saveAsScene: createScene threw:", err);
            return { success: false, error: "Failed to create scene." };
        }
    
        if (!res?.success) {
            console.error("dialog:saveAsScene: createScene returned failure:", res);
            return { success: false, error: "Scene creation was unsuccessful." };
        }
    
        try {
            res.sceneData.rootObjectIds = useStore.getState().rootObjectIds;
            res.sceneData.objects       = useStore.getState().objects;
            res.sceneData.lastModified  = new Date().toISOString();
        } catch (err) {
            console.error("dialog:saveAsScene: Failed to populate scene data:", err);
            return { success: false, error: "Failed to read scene state." };
        }
    
        let saveResponse;
        try {
            saveResponse = saveScene(projectPath, res.guid, res.sceneData);
        } catch (err) {
            console.error("dialog:saveAsScene: saveScene threw:", err);
            return { success: false, error: "Failed to save scene to disk." };
        }
    
        if (!saveResponse?.success) {
            console.error("dialog:saveAsScene: saveScene returned failure:", saveResponse);
            return { success: false, error: "Scene could not be written to disk." };
        }
    
        console.log("dialog:saveAsScene: Scene saved successfully:", fileName);
        return { success: true, data: { fileName, guid: res.guid } };
    });

}