// =============================================================================
// Responsible for creating new projects and opening existing ones.
// Handles the entire project folder structure setup and the project.json
// manifest file.
// =============================================================================

import fs from "fs";
import path from "path";
import { generateGuid } from "./GuidService.js";
import { loadTable, saveTable } from "./GuidTableService.js";
import { reconcile } from "./ReconciliationService.js";

const PROJECT_FILENAME = "project.json";
const GUID_TABLE_FILENAME = "guid-table.json";

// The full folder structure that every new project gets on creation.
// All of these are relative to the project root folder.
const PROJECT_FOLDERS = [
  "assets/models",
  "assets/textures",
  "assets/krita",
  "scenes",
  "exports",
];

// -----------------------------------------------------------------------------
// _getProjectFilePath(projectPath)
//
// Private helper — constructs the absolute path to project.json for a
// given project.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {string} Absolute path to project.json.
// -----------------------------------------------------------------------------
const _getProjectFilePath = (projectPath) => {
  return path.join(projectPath, PROJECT_FILENAME);
};

// -----------------------------------------------------------------------------
// _createFolderStructure(projectPath)
//
// Private helper — creates all the required subfolders inside a new project.
// Uses { recursive: true } so that nested folders like "assets/models" are
// created in a single call without needing to create "assets" first.
// If a folder already exists, it is silently skipped — no error is thrown.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {void}
// -----------------------------------------------------------------------------
const _createFolderStructure = (projectPath) => {
  PROJECT_FOLDERS.forEach((folder) => {
    const absoluteFolderPath = path.join(projectPath, folder);
    fs.mkdirSync(absoluteFolderPath, { recursive: true });
  });
};

// -----------------------------------------------------------------------------
// _createProjectJson(projectPath, projectName)
//
// Private helper — creates the initial project.json manifest file for a
// freshly created project. The scenes array starts empty and activeSceneGuid
// is null because no scene has been created yet.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   projectName {string} — The display name of the project chosen by the user.
//
// Returns: {object} The initial project manifest object that was written.
// -----------------------------------------------------------------------------
const _createProjectJson = (projectPath, projectName) => {
  const manifest = {
    projectName,
    createdAt: new Date().toISOString(),
    lastOpened: new Date().toISOString(),
    activeSceneGuid: null,
    scenes: [],
  };

  const projectFilePath = _getProjectFilePath(projectPath);
  fs.writeFileSync(projectFilePath, JSON.stringify(manifest, null, 2), "utf-8");

  return manifest;
};

// -----------------------------------------------------------------------------
// _createGuidTable(projectPath)
//
// Private helper — creates an empty guid-table.json file inside the project
// folder. This gives the table a valid JSON file to load from on first open.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {void}
// -----------------------------------------------------------------------------
const _createGuidTable = (projectPath) => {
  const tablePath = path.join(projectPath, GUID_TABLE_FILENAME);
  fs.writeFileSync(tablePath, JSON.stringify({}, null, 2), "utf-8");
};

// -----------------------------------------------------------------------------
// createProject(parentDirectory, projectName)
//
// Master function for new project creation.
// Creates the project root folder, all subfolders, the project.json manifest,
// and an empty guid-table.json — in that order.
//
// Parameters:
//   parentDirectory {string} — Absolute path to the folder where the new
//                              project folder will be created.
//                              e.g. "C:/Users/Dev/Projects"
//   projectName     {string} — The name chosen by the user for the project.
//                              This becomes the project folder name as well.
//                              e.g. "MyCharacterPose"
//
// Returns: {object} Result object:
//   {
//     success:     {boolean} — Whether the creation succeeded.
//     projectPath: {string}  — Absolute path to the newly created project root.
//     manifest:    {object}  — The initial project.json content.
//     error:       {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const createProject = (parentDirectory, projectName) => {
  const projectPath = path.join(parentDirectory, projectName);

  try {
    // Step 1 — Make sure a project with this name doesn't already exist.
    if (fs.existsSync(projectPath)) {
      return {
        success: false,
        projectPath: null,
        manifest: null,
        error: `A project named "${projectName}" already exists in the selected folder.`,
      };
    }

    // Step 2 — Create the root project folder.
    fs.mkdirSync(projectPath, { recursive: true });

    // Step 3 — Create all subfolders inside the project.
    _createFolderStructure(projectPath);

    // Step 4 — Create the project.json manifest file.
    const manifest = _createProjectJson(projectPath, projectName);

    // Step 5 — Create the empty guid-table.json file.
    _createGuidTable(projectPath);

    return {
      success: true,
      projectPath,
      manifest,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      projectPath: null,
      manifest: null,
      error: `Failed to create project. Reason: ${err.message}`,
    };
  }
};

// -----------------------------------------------------------------------------
// readProjectJson(projectPath)
//
// Reads and parses the project.json manifest from an existing project folder.
// Used both during openProject() and by other services that need to inspect
// or update the manifest (e.g. SceneService adding a new scene entry).
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {object} The parsed project manifest object.
//
// Throws: If project.json does not exist or cannot be parsed.
// -----------------------------------------------------------------------------
const readProjectJson = (projectPath) => {
  const projectFilePath = _getProjectFilePath(projectPath);

  if (!fs.existsSync(projectFilePath)) {
    throw new Error(`project.json not found in: ${projectPath}`);
  }

  const raw = fs.readFileSync(projectFilePath, "utf-8");

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse project.json in: ${projectPath}. Reason: ${err.message}`);
  }
};

// -----------------------------------------------------------------------------
// saveProjectJson(projectPath, manifest)
//
// Writes an updated project manifest object back to project.json on disk.
// Always update the lastOpened timestamp before calling this when opening
// a project.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   manifest    {object} — The updated project manifest object to persist.
//
// Returns: {void}
// -----------------------------------------------------------------------------
const saveProjectJson = (projectPath, manifest) => {
  const projectFilePath = _getProjectFilePath(projectPath);
  fs.writeFileSync(projectFilePath, JSON.stringify(manifest, null, 2), "utf-8");
};

// -----------------------------------------------------------------------------
// openProject(projectPath)
//
// Opens an existing project by:
//   1. Validating that the folder and project.json both exist.
//   2. Reading the project.json manifest.
//   3. Updating the lastOpened timestamp in the manifest.
//   4. Loading the GUID table into memory.
//   5. Running the 3-pass reconciliation to sync the table with the actual
//      state of files on disk (handles changes made outside the app).
//   6. Saving the reconciled table back to disk.
//   7. Returning the manifest and reconciled table to the caller.
//
// The ReconciliationService is required inside this function (not at the top
// of the file) to avoid a potential circular dependency, since
// ReconciliationService itself imports GuidTableService.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {object} Result object:
//   {
//     success:     {boolean} — Whether the open succeeded.
//     projectPath: {string}  — The opened project path (same as input).
//     manifest:    {object}  — The updated project.json content.
//     table:       {object}  — The reconciled in-memory GUID table.
//     error:       {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const openProject = (projectPath) => {
  try {
    // Step 1 — Validate the project folder exists.
    if (!fs.existsSync(projectPath)) {
      return {
        success: false,
        projectPath: null,
        manifest: null,
        table: null,
        error: `Project folder not found: ${projectPath}`,
      };
    }

    // Step 2 — Read the project.json manifest.
    const manifest = readProjectJson(projectPath);

    // Step 3 — Update the lastOpened timestamp and save it.
    manifest.lastOpened = new Date().toISOString();
    saveProjectJson(projectPath, manifest);

    // Step 4 — Load the GUID table into memory.
    let table = loadTable(projectPath);

    // Step 5 — Run the 3-pass reconciliation.
    table = reconcile(projectPath, table);

    // Step 6 — Persist the reconciled table to disk.
    saveTable(projectPath, table);

    // Step 7 — Return everything the frontend needs to bootstrap the session.
    return {
      success: true,
      projectPath,
      manifest,
      table,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      projectPath: null,
      manifest: null,
      table: null,
      error: `Failed to open project. Reason: ${err.message}`,
    };
  }
};

export {
  createProject,
  readProjectJson,
  saveProjectJson,
  openProject,
};