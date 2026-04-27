// =============================================================================
// Responsible for all asset lifecycle operations — importing external files
// into the project, deleting tracked assets, and resolving asset paths by GUID.
//
// An "asset" in this context refers to any user-imported file:
//   - 3D model files  (.glb, .gltf, .obj, .fbx)
//   - Texture files   (.png, .jpg, .jpeg, .webp)
//   - Krita mirror    (.png, managed automatically by the app)
//
// IMPORT FLOW (every time a user imports a file):
//   1. Determine the correct destination subfolder based on asset type.
//   2. Copy the file from its source location into the project folder.
//   3. Handle filename conflicts in the destination folder.
//   4. Generate a new GUID for the copied file.
//   5. Create a .meta sidecar file next to the copied file.
//   6. Add an entry to the in-memory GUID table.
//   7. Save the GUID table to disk.
//   8. Return the GUID to the caller (frontend uses it to add the object to scene).
// =============================================================================

import fs from "fs";
import path from "path";
import { generateGuid } from "./GuidService.js";
import { createMeta, deleteMeta } from "./MetaService.js";
import {
  addEntry,
  removeEntry,
  getEntry,
  saveTable,
  toRelativePath,
  toAbsolutePath,
} from "./GuidTableService.js";

// Maps asset types to their destination subfolders inside the project.
const ASSET_TYPE_FOLDER_MAP = {
  model:   "assets/models",
  texture: "assets/textures",
  krita:   "assets/krita",
};

// Supported file extensions per asset type.
// Used for validation when the user tries to import a file.
const SUPPORTED_EXTENSIONS = {
  model:   [".glb", ".gltf", ".obj", ".fbx"],
  texture: [".png", ".jpg", ".jpeg", ".webp"],
  krita:   [".png"],
};

// -----------------------------------------------------------------------------
// determineAssetType(sourcePath)
//
// Infers the asset type from a file's extension.
// This is a convenience function — the frontend can call this to determine
// what type to pass into importAsset() without hardcoding extension checks.
//
// Parameters:
//   sourcePath {string} — Absolute path to the source file.
//
// Returns: {string|null} The asset type string ("model" | "texture" | "krita"),
//                        or null if the extension is not supported.
// -----------------------------------------------------------------------------
const determineAssetType = (sourcePath) => {
  const ext = path.extname(sourcePath).toLowerCase();

  for (const [type, extensions] of Object.entries(SUPPORTED_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }

  return null;
};

// -----------------------------------------------------------------------------
// determineDestinationFolder(projectPath, type)
//
// Returns the absolute path to the correct destination subfolder for a given
// asset type inside the project.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   type        {string} — Asset type: "model" | "texture" | "krita".
//
// Returns: {string} Absolute path to the destination folder.
//
// Throws: If the provided type is not recognised.
// -----------------------------------------------------------------------------
const determineDestinationFolder = (projectPath, type) => {
  const relativeFolder = ASSET_TYPE_FOLDER_MAP[type];

  if (!relativeFolder) {
    throw new Error(
      `Unknown asset type: "${type}". Expected one of: ${Object.keys(ASSET_TYPE_FOLDER_MAP).join(", ")}.`
    );
  }

  return path.join(projectPath, relativeFolder);
};

// -----------------------------------------------------------------------------
// _resolveDestinationPath(destinationFolder, fileName)
//
// Private helper — determines the final destination path for a file being
// copied into the project, handling filename conflicts gracefully.
//
// If a file named "robot.glb" already exists in the destination folder, this
// function will resolve the name to "robot_1.glb", then "robot_2.glb", and so
// on — rather than silently overwriting the existing file.
//
// Parameters:
//   destinationFolder {string} — Absolute path to the destination folder.
//   fileName          {string} — The original file name (e.g. "robot.glb").
//
// Returns: {string} A safe absolute destination path with no conflicts.
// -----------------------------------------------------------------------------
const _resolveDestinationPath = (destinationFolder, fileName) => {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);

  let candidate = path.join(destinationFolder, fileName);
  let counter = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(destinationFolder, `${baseName}_${counter}${ext}`);
    counter++;
  }

  return candidate;
};

// -----------------------------------------------------------------------------
// _copyAssetFile(sourcePath, destinationFolder)
//
// Private helper — copies a file from its source location (anywhere on the
// user's device) into the project's destination folder.
// Resolves filename conflicts before copying.
//
// Parameters:
//   sourcePath        {string} — Absolute path to the source file.
//   destinationFolder {string} — Absolute path to the destination folder.
//
// Returns: {string} Absolute path to the newly copied file in the project.
// -----------------------------------------------------------------------------
const _copyAssetFile = (sourcePath, destinationFolder) => {
  const fileName = path.basename(sourcePath);
  const destinationPath = _resolveDestinationPath(destinationFolder, fileName);

  fs.copyFileSync(sourcePath, destinationPath);

  return destinationPath;
};

// -----------------------------------------------------------------------------
// importAsset(projectPath, sourcePath, type, name, table)
//
// Master import function — runs the full import flow for a single asset file.
// This is the primary function called by the IPC handler when the user imports
// a file from their device into the project.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   sourcePath  {string} — Absolute path to the file on the user's device.
//   type        {string} — Asset type: "model" | "texture" | "krita".
//   name        {string} — Display name for this asset (shown in the Hierarchy panel).
//   table       {object} — The current in-memory GUID table (will be mutated).
//
// Returns: {object} Result object:
//   {
//     success:         {boolean} — Whether the import succeeded.
//     guid:            {string}  — The GUID assigned to the imported asset.
//     destinationPath: {string}  — Absolute path to the file inside the project.
//     error:           {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const importAsset = (projectPath, sourcePath, type, name, table) => {
  try {
    // Step 1 — Validate that the source file actually exists.
    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        guid: null,
        destinationPath: null,
        error: `Source file not found: ${sourcePath}`,
      };
    }

    // Step 2 — Validate the asset type.
    const destinationFolder = determineDestinationFolder(projectPath, type);

    // Step 3 — Copy the file into the project folder.
    const destinationPath = _copyAssetFile(sourcePath, destinationFolder);

    // Step 4 — Generate a new GUID for this asset.
    const guid = generateGuid();

    // Step 5 — Create the .meta sidecar file next to the copied file.
    createMeta(destinationPath, guid, type);

    // Step 6 — Convert paths to relative before storing in the table.
    const relativeFilePath = toRelativePath(projectPath, destinationPath);
    const relativeMetaPath = toRelativePath(projectPath, destinationPath + ".meta");

    // Step 7 — Add the entry to the in-memory GUID table.
    addEntry(table, guid, relativeFilePath, relativeMetaPath, type, name);

    // Step 8 — Persist the updated table to disk.
    saveTable(projectPath, table);

    return {
      success: true,
      guid,
      destinationPath,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      guid: null,
      destinationPath: null,
      error: `Failed to import asset. Reason: ${err.message}`,
    };
  }
};

// -----------------------------------------------------------------------------
// renameAsset(projectPath, guid, newName, table)
//
// Renames a tracked asset on disk and updates the GUID table entry.
//
// What changes:
//   - The actual file is renamed on disk (new filename = newName + original ext).
//   - The .meta sidecar file is renamed to match the new file name.
//   - The GUID table entry's filePath, metaPath, and name are updated.
//
// What does NOT change:
//   - The GUID (permanent, never changes).
//   - The meta file's internal content (guid, type, createdAt stay the same).
//
// Returns: { success, error }
// -----------------------------------------------------------------------------
export const renameAsset = (projectPath, guid, newName, table) => {
  try {
    const entry = getEntry(table, guid);
 
    if (entry === null) {
      return { success: false, error: `No asset found with GUID: ${guid}` };
    }
 
    const absoluteFilePath = toAbsolutePath(projectPath, entry.filePath);
 
    if (!fs.existsSync(absoluteFilePath)) {
      return { success: false, error: `Asset file not found on disk for GUID: ${guid}` };
    }
 
    const dir = path.dirname(absoluteFilePath);
    const ext = path.extname(absoluteFilePath);
 
    // Keep the original extension — only the base name changes.
    const newFileName = newName.endsWith(ext) ? newName : `${newName}${ext}`;
    const newAbsoluteFilePath = path.join(dir, newFileName);
 
    // Guard against a collision with an existing file.
    if (fs.existsSync(newAbsoluteFilePath) && newAbsoluteFilePath !== absoluteFilePath) {
      return { success: false, error: `A file named "${newFileName}" already exists in this folder.` };
    }
 
    const oldAbsoluteMetaPath = absoluteFilePath + ".meta";
    const newAbsoluteMetaPath = newAbsoluteFilePath + ".meta";
 
    // Rename the actual file, then the sidecar meta file.
    fs.renameSync(absoluteFilePath, newAbsoluteFilePath);
 
    if (fs.existsSync(oldAbsoluteMetaPath)) {
      fs.renameSync(oldAbsoluteMetaPath, newAbsoluteMetaPath);
    }
 
    // Update the in-memory table entry and persist.
    entry.filePath = toRelativePath(projectPath, newAbsoluteFilePath);
    entry.metaPath = toRelativePath(projectPath, newAbsoluteMetaPath);
    entry.name = newName;
 
    saveTable(projectPath, table);
 
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: `Failed to rename asset. Reason: ${err.message}` };
  }
};

// -----------------------------------------------------------------------------
// deleteAsset(projectPath, guid, table)
//
// Deletes a tracked asset entirely:
//   1. Looks up the asset's file path from the GUID table.
//   2. Deletes the actual file from disk.
//   3. Deletes the .meta sidecar file from disk.
//   4. Removes the entry from the in-memory GUID table.
//   5. Saves the updated table to disk.
//
// NOTE: This does NOT check whether the asset is currently referenced by any
// scene. That responsibility belongs to the SceneService or the frontend.
// The caller should confirm the asset is safe to delete before calling this.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   guid        {string} — The GUID of the asset to delete.
//   table       {object} — The current in-memory GUID table (will be mutated).
//
// Returns: {object} Result object:
//   {
//     success: {boolean} — Whether the deletion succeeded.
//     error:   {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const deleteAsset = (projectPath, guid, table) => {
  try {
    // Step 1 — Look up the asset in the GUID table.
    const entry = getEntry(table, guid);

    if (entry === null) {
      return {
        success: false,
        error: `No asset found with GUID: ${guid}`,
      };
    }

    // Step 2 — Resolve the absolute file path from the stored relative path.
    const absoluteFilePath = toAbsolutePath(projectPath, entry.filePath);

    // Step 3 — Delete the actual file from disk (if it still exists).
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
    }

    // Step 4 — Delete the .meta sidecar file (MetaService handles missing file gracefully).
    deleteMeta(absoluteFilePath);

    // Step 5 — Remove the entry from the in-memory GUID table.
    removeEntry(table, guid);

    // Step 6 — Persist the updated table to disk.
    saveTable(projectPath, table);

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to delete asset. Reason: ${err.message}`,
    };
  }
};

// -----------------------------------------------------------------------------
// getAssetPath(projectPath, guid, table)
//
// Resolves and returns the absolute path to an asset's file from its GUID.
// This is the function the frontend calls when it needs to actually load
// an asset file into the 3D viewport (e.g. load a .glb model into Three.js).
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   guid        {string} — The GUID of the asset to resolve.
//   table       {object} — The current in-memory GUID table.
//
// Returns: {object} Result object:
//   {
//     success:      {boolean} — Whether the resolution succeeded.
//     absolutePath: {string}  — Absolute path to the asset file, or null.
//     entry:        {object}  — The full GUID table entry for this asset, or null.
//     error:        {string}  — Error message if success is false, otherwise null.
//   }
// -----------------------------------------------------------------------------
const getAssetPath = (projectPath, guid, table) => {
  const entry = getEntry(table, guid);

  if (entry === null) {
    return {
      success: false,
      absolutePath: null,
      entry: null,
      error: `No asset found with GUID: ${guid}`,
    };
  }

  const absolutePath = toAbsolutePath(projectPath, entry.filePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      success: false,
      absolutePath: null,
      entry: null,
      error: `Asset file not found on disk for GUID: ${guid}. Path: ${absolutePath}`,
    };
  }

  return {
    success: true,
    absolutePath,
    entry,
    error: null,
  };
};

export {
  determineAssetType,
  determineDestinationFolder,
  importAsset,
  deleteAsset,
  getAssetPath,
};