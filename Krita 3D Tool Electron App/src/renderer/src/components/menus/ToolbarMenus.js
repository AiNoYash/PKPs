import { useStore } from "../../context/useStore.js";

const { invoke } = window.Project;

const handleNewProject = async () => {
    // 1. Open the native dialog
    const dialogResult = await invoke('dialog:newProject');
    
    // If user canceled, do nothing
    if (!dialogResult) return; 

    // 2. Pass the extracted data to your existing backend creator
    const { parentDirectory, projectName } = dialogResult;
    const createResult = await invoke('project:create', { 
        parentDirectory, 
        projectName 
    });

    if (createResult.success) {
        console.log("Project created successfully!");
        // Update store with the new project path
        useStore.getState().setActiveProjectPath(createResult.projectPath);
    } else {
        console.error("Failed to create project:", createResult.error);
    }
};

const handleOpenProject = async () => {
    // 1. Open the native folder picker
    const projectPath = await invoke('dialog:openProject');
    
    if (!projectPath) return; // User canceled

    // 2. Pass the path to your existing backend opener
    const openResult = await invoke('project:open', { projectPath });

    if (openResult.success) {
        console.log("Project opened successfully!", openResult);
        // Update store with the opened project path
        useStore.getState().setActiveProjectPath(openResult.projectPath);
    } else {
        console.error("Failed to open project:", openResult.error);
    }
};

const handleFileImport = async () => {
    // 1. Open the native file picker
    const sourcePath = await invoke('dialog:openFileImport');
    if (!sourcePath) return; // User canceled

    // Extract a default name from the file path (e.g., "model.glb" from "C:/docs/model.glb")
    const fileName = sourcePath.split(/[/\\]/).pop();

    // 2. Ask the backend to determine the asset type (model, texture, krita, etc.)
    const typeResult = await invoke('asset:determineType', { sourcePath });
    
    if (!typeResult.success) {
        console.error("Import failed:", typeResult.error);
        // Optional: Show an error alert to the user here
        return;
    }

    // 3. Send the file to the backend to be copied into the active project and assigned a GUID
    const importResult = await invoke('asset:import', { 
        sourcePath, 
        type: typeResult.assetType, 
        name: fileName 
    });

    if (importResult.success) {
        console.log("File imported successfully!", importResult);
        // 4. Tell the Zustand store that the file tree needs to be refreshed
        useStore.getState().triggerTreeRefresh();
    } else {
        console.error("Failed to import file:", importResult.error);
    }
};

export const fileMenuItems = [
    { label: 'New Project...', shortcut: 'Ctrl+Shift+N', action: handleNewProject },
    { label: 'Open Project...', shortcut: 'Ctrl+O', action: handleOpenProject },
    { label: 'Import File...', shortcut: 'Ctrl+I', action: handleFileImport },
    { type: 'divider' },
    { label: 'Save', shortcut: 'Ctrl+S', action: () => console.log('Saved') },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => console.log('Saved As') },
    { type: 'divider' },
    { label: 'Exit', shortcut: 'Alt+F4', action: () => { window.Application.quitApp(); } }
    // ! We need to have a function here where we check if any data is not saved or something
];



// export const fileMenuItems = [
//     { label: 'New Project', shortcut: 'Ctrl+Shift+N', action: () => console.log('New') },
//     { label: 'Open Project', shortcut: 'Ctrl+O' },
//     { type: 'divider' },
//     {
//         label: 'Open Recent',
//         children: [
//             { label: 'project_krita_3d' },
//             { label: 'rulebook_ludo' },
//             {
//                 label: 'More...',
//                 children: [{ label: 'Clear History' }]
//             }
//         ]
//     },
//     { type: 'divider' },
//     { label: 'Exit', shortcut: 'Alt+F4', action: () => { window.Application.quitApp(); } }
//     // ! We need to have a function here where we check if any data is not saved or something
// ];