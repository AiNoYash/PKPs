// =============================================================================
// Responsible for all scene lifecycle operations — creating, saving, loading,
// and deleting .scene.json files inside the project's scenes/ folder.
//
// Each scene is stored as an independent .scene.json file on disk, with a
// corresponding .meta sidecar file. The project.json manifest holds only a
// lightweight index of all scenes (guid + name). The full scene data lives
// exclusively in the .scene.json file and is only loaded when that scene
// is actually opened by the user.
//
// SCENE FILE NAMING CONVENTION:
//   Scene files are named using their GUID to guarantee uniqueness:
//   "scenes/scene_<guid>.scene.json"
//   e.g. "scenes/scene_a3f9c21b-7e04-4d88-b1a0-9c3f2e8d5b67.scene.json"
// =============================================================================

const fs = require("fs");
const path = require("path");
const { generateGuid } = require("./GuidService");
const { createMeta, deleteMeta } = require("./MetaService");
const {
  addEntry,
  removeEntry,
  getEntry,
  saveTable,
  toRelativePath,
  toAbsolutePath,
} = require("./GuidTableService");
const { readProjectJson, saveProjectJson } = require("./ProjectService");

const SCENES_FOLDER = "scenes";

// -----------------------------------------------------------------------------
// _getSceneFileName(guid)
//
// Private helper — derives the scene file name from its GUID.
//
// Example:
//   "a3f9c21b-7e04-4d88-b1a0-9c3f2e8d5b67"
//   → "scene_a3f9c21b-7e04-4d88-b1a0-9c3f2e8d5b67.scene.json"
//
// Parameters:
//   guid {string} — The GUID of the scene.
//
// Returns: {string} The scene file name.
// -----------------------------------------------------------------------------
const _getSceneFileName = (guid) => {
  return `scene_${guid}.scene.json`;
};

// -----------------------------------------------------------------------------
// _getSceneFilePath(projectPath, guid)
//
// Private helper — constructs the absolute path to a scene's .scene.json file.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   guid        {string} — The GUID of the scene.
//
// Returns: {string} Absolute path to the .scene.json file.
// -----------------------------------------------------------------------------
const _getSceneFilePath = (projectPath, guid) => {
  return path.join(projectPath, SCENES_FOLDER, _getSceneFileName(guid));
};

// -----------------------------------------------------------------------------
// _buildInitialSceneData(guid, sceneName)
//
// Private helper — builds the initial data object written into a freshly
// created .scene.json file. The objects map is empty, and the camera and
// lighting are set to sensible defaults so the 3D viewport has something
// reasonable to start with.
//
// Parameters:
//   guid      {string} — The GUID assigned to this scene.
//   sceneName {string} — The display name chosen by the user for this scene.
//
// Returns: {object} The initial scene data object.
// -----------------------------------------------------------------------------
const _buildInitialSceneData = (guid, sceneName) => {
  return {
    guid,
    name: sceneName,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    camera: {
      position: { x: 0, y: 2, z: 5 },
      rotation: { x: -10, y: 0, z: 0 },
      fov: 60,
    },
    lighting: {
      ambientIntensity: 0.4,
      lights: [
        {
          type: "directional",
          position: { x: 5, y: 10, z: 5 },
          intensity: 1.0,
          color: "#ffffff",
        },
      ],
    },
    objects: {},
  };
};

// -----------------------------------------------------------------------------
// createScene(projectPath, sceneName, table)
//
// Creates a brand new scene inside the project:
//   1. Generates a GUID for the new scene.
//   2. Builds the initial scene data with default camera and lighting.
//   3. Writes the .scene.json file to the scenes/ folder.
//   4. Creates a .meta sidecar file next to the scene file.
//   5. Adds an entry to the in-memory GUID table.
//   6. Saves the updated GUID table to disk.
//   7. Adds a lightweight entry to the project.json scenes array.
//   8. Saves the updated project.json to disk.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   sceneName   {string} — The display name chosen by the user for this scene.
//   table       {object} — The current in-memory GUID table (will be mutated).
//
// Returns: {object} Result object:
//   {
//     success:   {boolean} — Whether creation succeeded.
//     guid:      {string}  — The GUID assigned to the new scene.
//     sceneData: {object}  — The full initial scene data that was written to disk.
//     error:     {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const createScene = (projectPath, sceneName, table) => {
  try {
    // Step 1 — Generate a new GUID for this scene.
    const guid = generateGuid();

    // Step 2 — Build the initial scene data object.
    const sceneData = _buildInitialSceneData(guid, sceneName);

    // Step 3 — Write the .scene.json file to disk.
    const sceneFilePath = _getSceneFilePath(projectPath, guid);
    fs.writeFileSync(sceneFilePath, JSON.stringify(sceneData, null, 2), "utf-8");

    // Step 4 — Create the .meta sidecar file next to the scene file.
    createMeta(sceneFilePath, guid, "scene");

    // Step 5 — Store relative paths in the GUID table.
    const relativeFilePath = toRelativePath(projectPath, sceneFilePath);
    const relativeMetaPath = toRelativePath(projectPath, sceneFilePath + ".meta");

    // Step 6 — Add the entry to the in-memory GUID table and save to disk.
    addEntry(table, guid, relativeFilePath, relativeMetaPath, "scene", sceneName);
    saveTable(projectPath, table);

    // Step 7 — Add a lightweight entry to the project.json manifest.
    const manifest = readProjectJson(projectPath);
    manifest.scenes.push({
      guid,
      name: sceneName,
      createdAt: sceneData.createdAt,
    });

    // Step 8 — If this is the very first scene, set it as the active scene.
    if (manifest.scenes.length === 1) {
      manifest.activeSceneGuid = guid;
    }

    saveProjectJson(projectPath, manifest);

    return {
      success: true,
      guid,
      sceneData,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      guid: null,
      sceneData: null,
      error: `Failed to create scene. Reason: ${err.message}`,
    };
  }
};

// -----------------------------------------------------------------------------
// saveScene(projectPath, guid, sceneData)
//
// Overwrites a scene's .scene.json file with fresh data coming from the
// frontend (the Zustand store sends the full current scene state over IPC).
// Also updates the lastModified timestamp before writing.
//
// This function does NOT touch the GUID table or project.json — saving a
// scene only affects the .scene.json file itself.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   guid        {string} — The GUID of the scene being saved.
//   sceneData   {object} — The full scene state object from the Zustand store.
//
// Returns: {object} Result object:
//   {
//     success: {boolean} — Whether the save succeeded.
//     error:   {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const saveScene = (projectPath, guid, sceneData) => {
  try {
    const sceneFilePath = _getSceneFilePath(projectPath, guid);

    if (!fs.existsSync(sceneFilePath)) {
      return {
        success: false,
        error: `Scene file not found for GUID: ${guid}`,
      };
    }

    // Stamp the current time as lastModified before writing.
    sceneData.lastModified = new Date().toISOString();

    fs.writeFileSync(sceneFilePath, JSON.stringify(sceneData, null, 2), "utf-8");

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to save scene. Reason: ${err.message}`,
    };
  }
};

// -----------------------------------------------------------------------------
// loadScene(projectPath, guid, table)
//
// Reads and returns the full scene data from a .scene.json file.
// Called when the user clicks on a scene in the UI to open it.
// Also updates the activeSceneGuid in project.json to reflect the new
// active scene.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   guid        {string} — The GUID of the scene to load.
//   table       {object} — The current in-memory GUID table.
//
// Returns: {object} Result object:
//   {
//     success:   {boolean} — Whether the load succeeded.
//     sceneData: {object}  — The full parsed scene data object, or null.
//     error:     {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const loadScene = (projectPath, guid, table) => {
  try {
    // Verify the GUID exists in the table before attempting to load.
    const entry = getEntry(table, guid);

    if (entry === null) {
      return {
        success: false,
        sceneData: null,
        error: `No scene found in GUID table with GUID: ${guid}`,
      };
    }

    const sceneFilePath = _getSceneFilePath(projectPath, guid);

    if (!fs.existsSync(sceneFilePath)) {
      return {
        success: false,
        sceneData: null,
        error: `Scene file not found on disk for GUID: ${guid}`,
      };
    }

    const raw = fs.readFileSync(sceneFilePath, "utf-8");
    const sceneData = JSON.parse(raw);

    // Update the active scene in the project.json manifest.
    const manifest = readProjectJson(projectPath);
    manifest.activeSceneGuid = guid;
    saveProjectJson(projectPath, manifest);

    return {
      success: true,
      sceneData,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      sceneData: null,
      error: `Failed to load scene. Reason: ${err.message}`,
    };
  }
};

// -----------------------------------------------------------------------------
// deleteScene(projectPath, guid, table)
//
// Fully removes a scene from the project:
//   1. Looks up the scene in the GUID table.
//   2. Deletes the .scene.json file from disk.
//   3. Deletes the .meta sidecar file from disk.
//   4. Removes the entry from the in-memory GUID table and saves it.
//   5. Removes the lightweight entry from the project.json scenes array.
//   6. If the deleted scene was the active scene, reassigns activeSceneGuid
//      to the next available scene, or null if no scenes remain.
//   7. Saves the updated project.json to disk.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   guid        {string} — The GUID of the scene to delete.
//   table       {object} — The current in-memory GUID table (will be mutated).
//
// Returns: {object} Result object:
//   {
//     success:           {boolean} — Whether the deletion succeeded.
//     newActiveSceneGuid {string}  — The GUID of the new active scene after
//                                    deletion, or null if no scenes remain.
//                                    The frontend uses this to know which scene
//                                    to switch to automatically.
//     error:             {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const deleteScene = (projectPath, guid, table) => {
  try {
    // Step 1 — Look up the scene entry in the GUID table.
    const entry = getEntry(table, guid);

    if (entry === null) {
      return {
        success: false,
        newActiveSceneGuid: null,
        error: `No scene found in GUID table with GUID: ${guid}`,
      };
    }

    // Step 2 — Resolve and delete the .scene.json file.
    const sceneFilePath = _getSceneFilePath(projectPath, guid);

    if (fs.existsSync(sceneFilePath)) {
      fs.unlinkSync(sceneFilePath);
    }

    // Step 3 — Delete the .meta sidecar file.
    deleteMeta(sceneFilePath);

    // Step 4 — Remove entry from GUID table and save.
    removeEntry(table, guid);
    saveTable(projectPath, table);

    // Step 5 — Remove the lightweight entry from project.json scenes array.
    const manifest = readProjectJson(projectPath);
    manifest.scenes = manifest.scenes.filter((scene) => scene.guid !== guid);

    // Step 6 — Handle active scene reassignment.
    let newActiveSceneGuid = manifest.activeSceneGuid;

    if (manifest.activeSceneGuid === guid) {
      // The deleted scene was the active one.
      // Reassign to the first remaining scene, or null if none are left.
      newActiveSceneGuid = manifest.scenes.length > 0
        ? manifest.scenes[0].guid
        : null;

      manifest.activeSceneGuid = newActiveSceneGuid;
    }

    // Step 7 — Save the updated manifest to disk.
    saveProjectJson(projectPath, manifest);

    return {
      success: true,
      newActiveSceneGuid,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      newActiveSceneGuid: null,
      error: `Failed to delete scene. Reason: ${err.message}`,
    };
  }
};

// -----------------------------------------------------------------------------
// renameScene(projectPath, guid, newName, table)
//
// Renames a scene — updates the name in both the .scene.json file and the
// lightweight entry in project.json. The file name on disk does NOT change
// since it is GUID-based, not name-based. Only the display name changes.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   guid        {string} — The GUID of the scene to rename.
//   newName     {string} — The new display name for the scene.
//   table       {object} — The current in-memory GUID table (will be mutated).
//
// Returns: {object} Result object:
//   {
//     success: {boolean} — Whether the rename succeeded.
//     error:   {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const renameScene = (projectPath, guid, newName, table) => {
  try {
    const entry = getEntry(table, guid);

    if (entry === null) {
      return {
        success: false,
        error: `No scene found in GUID table with GUID: ${guid}`,
      };
    }

    // Update the name inside the .scene.json file.
    const sceneFilePath = _getSceneFilePath(projectPath, guid);

    if (!fs.existsSync(sceneFilePath)) {
      return {
        success: false,
        error: `Scene file not found on disk for GUID: ${guid}`,
      };
    }

    const raw = fs.readFileSync(sceneFilePath, "utf-8");
    const sceneData = JSON.parse(raw);
    sceneData.name = newName;
    sceneData.lastModified = new Date().toISOString();
    fs.writeFileSync(sceneFilePath, JSON.stringify(sceneData, null, 2), "utf-8");

    // Update the name in the GUID table entry.
    entry.name = newName;
    saveTable(projectPath, table);

    // Update the name in the project.json manifest.
    const manifest = readProjectJson(projectPath);
    const sceneEntry = manifest.scenes.find((scene) => scene.guid === guid);

    if (sceneEntry) {
      sceneEntry.name = newName;
    }

    saveProjectJson(projectPath, manifest);

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to rename scene. Reason: ${err.message}`,
    };
  }
};

module.exports = {
  createScene,
  saveScene,
  loadScene,
  deleteScene,
  renameScene,
};