// =============================================================================
// SESSION STATE:
//   Two session-level variables are maintained here for the duration of the
//   app's runtime:
//     - activeProjectPath {string|null} — The absolute path to the currently
//                                         open project folder.
//     - activeTable       {object|null} — The in-memory GUID table for the
//                                         currently open project.
// =============================================================================

import fs from "fs";
import { ipcMain } from "electron";
import { 
  createProject, 
  openProject, 
  readProjectJson, 
  saveProjectJson 
} from "../services/ProjectService.js";
import { 
  importAsset,
  renameAsset,
  deleteAsset, 
  getAssetPath, 
  determineAssetType, 
  getBase64
} from "../services/AssetService.js";
import { 
  createScene, 
  saveScene, 
  loadScene, 
  deleteScene, 
  renameScene 
} from "../services/SceneService.js";
import { buildDirectoryTree } from "../services/DirectoryTreeService.js";

// -----------------------------------------------------------------------------
// SESSION STATE VARIABLES
// -----------------------------------------------------------------------------
let activeProjectPath = null;
let activeTable = null;

// -----------------------------------------------------------------------------
// _requireActiveProject()
//
// Private helper — returns a standard error result if no project is currently
// open. Used at the top of every handler that requires an active project.
//
// Returns: {object|null}
//   If no project is open:
//     { success: false, error: "No project is currently open." }
//   If a project is open:
//     null  (meaning the caller should proceed normally)
// -----------------------------------------------------------------------------
const _requireActiveProject = () => {
  if (activeProjectPath === null || activeTable === null) {
    return {
      success: false,
      error: "No project is currently open.",
    };
  }
  return null;
};

// =============================================================================
// PROJECT HANDLERS
// =============================================================================

// -----------------------------------------------------------------------------
// "project:create"
//
// Creates a brand new project folder and initialises all its structure.
// On success, automatically sets the new project as the active project so the
// user can start working immediately without a separate "open" step.
//
// Expected args from frontend:
//   { parentDirectory: string, projectName: string }
//
// Returns: Full result from ProjectService.createProject(), plus the manifest.
// -----------------------------------------------------------------------------
ipcMain.handle("project:create", async (_event, { parentDirectory, projectName }) => {
  const result = createProject(parentDirectory, projectName);

  if (result.success) {
    // Auto-open the newly created project as the active session.
    activeProjectPath = result.projectPath;
    activeTable = {};
  }

  return result;
});

// -----------------------------------------------------------------------------
// "project:open"
//
// Opens an existing project from a given folder path. Runs the full
// reconciliation scan internally before returning to the frontend.
// On success, sets the opened project as the active session.
//
// Expected args from frontend:
//   { projectPath: string }
//
// Returns: Full result from ProjectService.openProject(), including the
//          reconciled GUID table and the project manifest.
// -----------------------------------------------------------------------------
ipcMain.handle("project:open", async (_event, { projectPath }) => {
  const result = openProject(projectPath);

  if (result.success) {
    activeProjectPath = result.projectPath;
    activeTable = result.table;
  }

  return result;
});

// -----------------------------------------------------------------------------
// "project:close"
//
// Clears the active session state. Should be called by the frontend before
// opening a different project or when the user explicitly closes the project.
// Does NOT save anything — the frontend is responsible for triggering
// scene:save before calling this if there are unsaved changes.
//
// Expected args from frontend: none
//
// Returns: { success: true }
// -----------------------------------------------------------------------------
ipcMain.handle("project:close", async () => {
  activeProjectPath = null;
  activeTable = null;

  return { success: true };
});

// -----------------------------------------------------------------------------
// "project:getManifest"
//
// Returns the current project.json manifest for the active project.
// The frontend uses this to populate the scene list panel and display
// the project name.
//
// Expected args from frontend: none
//
// Returns: { success: boolean, manifest: object|null, error: string|null }
// -----------------------------------------------------------------------------
ipcMain.handle("project:getManifest", async () => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  try {
    const manifest = readProjectJson(activeProjectPath);
    return { success: true, manifest, error: null };
  } catch (err) {
    return {
      success: false,
      manifest: null,
      error: `Failed to read project manifest. Reason: ${err.message}`,
    };
  }
});

// -----------------------------------------------------------------------------
// "project:getDirectoryTree"
//
// Scans the active project folder on disk and returns a fully nested tree
// object representing the project's file/folder structure. .meta files are
// automatically excluded. Each file node includes its GUID from the table.
//
// Called by the Project panel (Project.jsx) on mount and whenever the
// frontend needs to refresh the directory view (e.g. after an import).
//
// Expected args from frontend: none
//
// Returns:
//   {
//     success:  boolean,
//     tree:     object|null,  — The full nested directory tree object
//     error:    string|null
//   }
// -----------------------------------------------------------------------------
ipcMain.handle("project:getDirectoryTree", async () => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  try {
    const tree = buildDirectoryTree(activeProjectPath, activeTable);
    return { success: true, tree, error: null };
  } catch (err) {
    return {
      success: false,
      tree: null,
      error: `Failed to build directory tree. Reason: ${err.message}`,
    };
  }
});

// =============================================================================
// SCENE HANDLERS
// =============================================================================

// -----------------------------------------------------------------------------
// "scene:create"
//
// Creates a new scene inside the active project.
//
// Expected args from frontend:
//   { sceneName: string }
//
// Returns: Full result from SceneService.createScene(), including the new
//          scene's GUID and initial scene data.
// -----------------------------------------------------------------------------
ipcMain.handle("scene:create", async (_event, { sceneName }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = createScene(activeProjectPath, sceneName, activeTable);

  return result;
});

// -----------------------------------------------------------------------------
// "scene:save"
//
// Saves the current state of a scene to its .scene.json file on disk.
// The frontend passes the full scene state object from the Zustand store.
//
// Expected args from frontend:
//   { guid: string, sceneData: object }
//
// Returns: { success: boolean, error: string|null }
// -----------------------------------------------------------------------------
ipcMain.handle("scene:save", async (_event, { guid, sceneData }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = saveScene(activeProjectPath, guid, sceneData);

  return result;
});

// -----------------------------------------------------------------------------
// "scene:load"
//
// Loads the full scene data for a given scene GUID from disk.
// Also updates activeSceneGuid in project.json.
//
// Expected args from frontend:
//   { guid: string }
//
// Returns: Full result from SceneService.loadScene(), including the full
//          sceneData object that the frontend loads into Zustand.
// -----------------------------------------------------------------------------
ipcMain.handle("scene:load", async (_event, { filePath }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  if(!fs.existsSync(filePath)){
    return {
      success: false,
      sceneData: null,
      error: "file does not exist",
    }
  }

  let result;
  try{
    const raw = fs.readFileSync(filePath);
    result = JSON.parse(raw);
  }catch(err){
    return {
      success: false,
      sceneData: null,
      error: "could not read file content"
    }
  }

  return {
    success: true,
    sceneData: result,
    error: null
  }
});

// -----------------------------------------------------------------------------
// "scene:delete"
//
// Deletes a scene from the active project entirely — removes the file,
// meta, GUID table entry, and project.json manifest entry.
//
// Expected args from frontend:
//   { guid: string }
//
// Returns: Full result from SceneService.deleteScene(), including
//          newActiveSceneGuid so the frontend knows which scene to switch to.
// -----------------------------------------------------------------------------
ipcMain.handle("scene:delete", async (_event, { guid }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = deleteScene(activeProjectPath, guid, activeTable);

  return result;
});

// -----------------------------------------------------------------------------
// "scene:rename"
//
// Renames a scene's display name in the .scene.json file, GUID table,
// and project.json manifest. The file name on disk does not change.
//
// Expected args from frontend:
//   { guid: string, newName: string }
//
// Returns: { success: boolean, error: string|null }
// -----------------------------------------------------------------------------
ipcMain.handle("scene:rename", async (_event, { guid, newName }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = renameScene(activeProjectPath, guid, newName, activeTable);

  return result;
});

// =============================================================================
// ASSET HANDLERS
// =============================================================================

// -----------------------------------------------------------------------------
// "asset:determineType"
//
// Infers the asset type from a file's extension before importing.
// The frontend calls this first when the user picks a file, to display
// the correct type label in the UI and confirm the file is supported.
//
// Expected args from frontend:
//   { sourcePath: string }
//
// Returns:
//   {
//     success:   boolean,
//     assetType: string|null,  — "model" | "texture" | "krita" | null
//     error:     string|null
//   }
// -----------------------------------------------------------------------------
ipcMain.handle("asset:determineType", async (_event, { sourcePath }) => {
  const assetType = determineAssetType(sourcePath);

  if (assetType === null) {
    return {
      success: false,
      assetType: null,
      error: `Unsupported file type: "${sourcePath}". Please import a supported model or texture file.`,
    };
  }

  return { success: true, assetType, error: null };
});

// -----------------------------------------------------------------------------
// "asset:import"
//
// Imports a file from the user's device into the active project.
// Copies the file, creates a .meta sidecar, and registers it in the GUID table.
//
// Expected args from frontend:
//   { sourcePath: string, type: string, name: string }
//
// Returns: Full result from AssetService.importAsset(), including the
//          assigned GUID which the frontend uses to add the object to the scene.
// -----------------------------------------------------------------------------
ipcMain.handle("asset:import", async (_event, { sourcePath, type, name }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = importAsset(activeProjectPath, sourcePath, type, name, activeTable);

  return result;
});

// -----------------------------------------------------------------------------
// "asset:rename"
//
// Renames a tracked asset file on disk and updates the GUID table entry.
// The file extension is preserved — only the base name changes.
// Scene files must use scene:rename instead (they have extra manifest steps).
//
// Expected args from frontend:
//   { guid: string, newName: string }
//
// Returns: { success: boolean, error: string|null }
// -----------------------------------------------------------------------------
ipcMain.handle("asset:rename", async (_event, { guid, newName }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;
 
  const result = renameAsset(activeProjectPath, guid, newName, activeTable);
 
  return result;
});

// -----------------------------------------------------------------------------
// "asset:delete"
//
// Deletes a tracked asset from the active project — removes the file, meta,
// and GUID table entry from disk.
//
// NOTE: The frontend is responsible for confirming the asset is not currently
// referenced by any open scene before calling this. This handler will delete
// regardless.
//
// Expected args from frontend:
//   { guid: string }
//
// Returns: { success: boolean, error: string|null }
// -----------------------------------------------------------------------------
ipcMain.handle("asset:delete", async (_event, { guid }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = deleteAsset(activeProjectPath, guid, activeTable);

  return result;
});

// -----------------------------------------------------------------------------
// "asset:getPath"
//
// Resolves the absolute file path of a tracked asset from its GUID.
// The frontend calls this when it needs to actually load an asset into
// the Three.js viewport (e.g. useGLTF needs a real file path to load from).
//
// Expected args from frontend:
//   { guid: string }
//
// Returns: Full result from AssetService.getAssetPath(), including the
//          absolute file path string and the full GUID table entry.
// -----------------------------------------------------------------------------
ipcMain.handle("asset:getPath", async (_event, { guid }) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = getAssetPath(activeProjectPath, guid, activeTable);

  return result;
});

ipcMain.handle("asset:getBase64", async (_event, filePath) => {
  const guard = _requireActiveProject();
  if (guard) return guard;

  const result = getBase64(filePath);

  return result;
});

// -----------------------------------------------------------------------------
// registerFileHandlers()
//
// Exported initialisation function. Call this once from the Electron main
// process entry point (main.js) after the app is ready. This registers all
// the ipcMain handlers above so they are active for the lifetime of the app.
//
// Usage in main.js:
//   const { registerFileHandlers } = require('./core/ipc/fileHandlers');
//   app.whenReady().then(() => {
//     registerFileHandlers();
//     // ... create BrowserWindow, etc.
//   });
// -----------------------------------------------------------------------------
export const registerFileHandlers = () => {
  // All handlers are registered at module load time via the ipcMain.handle()
  // calls above. This function's purpose is to give the main process a clean,
  // explicit entry point to initialise this module — and serves as a natural
  // place to add any future setup logic (e.g. logging, handler validation).
  console.log("[fileHandlers] All IPC file handlers registered successfully.");
};
