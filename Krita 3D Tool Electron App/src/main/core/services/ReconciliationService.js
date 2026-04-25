// =============================================================================
// Responsible for the 3-pass startup reconciliation scan that synchronises
// the in-memory GUID table with the actual state of files on disk.
//
// This runs automatically every time a project is opened (called from
// ProjectService.openProject). It handles all the cases where the user may
// have modified the project folder contents outside the app while it was closed:
//
//   - User deleted a file (and possibly its meta)
//   - User added a new file from outside the app
//   - Meta file was left behind after a file was deleted
//   - GUID table entry was lost but the meta file still exists
//
// THE 3-PASS STRATEGY:
//   Pass 1 — Validate every existing entry in the GUID table.
//             Remove stale entries whose files or metas are gone.
//   Pass 2 — Scan all real files on disk.
//             Register any untracked files that have no meta or no table entry.
//   Pass 3 — Scan all meta files on disk.
//             Clean up orphaned metas that have no corresponding real file.
//
// FOLDER SCOPE:
//   The scan covers:  assets/models, assets/textures, assets/krita, scenes/
//   The scan ignores: exports/  (exports are not tracked assets)
//
// Dependencies:
//   - Node.js built-in 'fs'    (file system operations)
//   - Node.js built-in 'path'  (path construction)
//   - GuidService              (GUID generation for newly discovered files)
//   - MetaService              (reading, creating, and deleting meta files)
//   - GuidTableService         (table mutation and path utilities)
// =============================================================================

import fs from "fs";
import path from "path";
import { generateGuid } from "./GuidService.js";
import { createMeta, readMeta, deleteMeta, metaExistsFor, getMetaPath } from "./MetaService.js";
import {
  addEntry,
  removeEntry,
  getEntry,
  toRelativePath,
  toAbsolutePath,
} from "./GuidTableService.js";

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

// Folders to include in the reconciliation scan (relative to project root).
// exports/ is intentionally excluded — rendered PNGs are not tracked assets.
const TRACKED_FOLDERS = [
  "assets/models",
  "assets/textures",
  "assets/krita",
  "scenes",
];

// File extensions that are treated as real asset files (not meta files).
// Any file with an extension NOT in this list AND not ending in .meta
// will be silently ignored during scanning.
const TRACKED_EXTENSIONS = [
  ".glb", ".gltf", ".obj", ".fbx",   // 3D models
  ".png", ".jpg", ".jpeg", ".webp",   // textures and krita mirror
  ".json",                             // scene files (.scene.json)
];

// Maps file extensions to their asset type string for the GUID table.
const EXTENSION_TYPE_MAP = {
  ".glb":   "model",
  ".gltf":  "model",
  ".obj":   "model",
  ".fbx":   "model",
  ".png":   "texture",
  ".jpg":   "texture",
  ".jpeg":  "texture",
  ".webp":  "texture",
  ".json":  "scene",
};

// -----------------------------------------------------------------------------
// _inferAssetType(filePath)
//
// Private helper — infers the asset type from a file's extension.
// For .png files inside assets/krita/, the type is "krita" not "texture".
//
// Parameters:
//   filePath {string} — Absolute path to the file.
//
// Returns: {string} The asset type string.
// -----------------------------------------------------------------------------
const _inferAssetType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  // Special case: .png files inside assets/krita/ are "krita" type.
  if (ext === ".png" && filePath.includes(`assets${path.sep}krita`)) {
    return "krita";
  }

  return EXTENSION_TYPE_MAP[ext] || "unknown";
};

// -----------------------------------------------------------------------------
// _isTrackedFile(filePath)
//
// Private helper — returns true if a file should be considered a real tracked
// asset (i.e. it has a tracked extension and is NOT a .meta file).
//
// Parameters:
//   filePath {string} — Absolute path to the file.
//
// Returns: {boolean}
// -----------------------------------------------------------------------------
const _isTrackedFile = (filePath) => {
  // Exclude .meta files — they are sidecars, not real assets.
  if (filePath.endsWith(".meta")) return false;

  const ext = path.extname(filePath).toLowerCase();
  return TRACKED_EXTENSIONS.includes(ext);
};

// -----------------------------------------------------------------------------
// _isMetaFile(filePath)
//
// Private helper — returns true if a file is a .meta sidecar file.
//
// Parameters:
//   filePath {string} — Absolute path to the file.
//
// Returns: {boolean}
// -----------------------------------------------------------------------------
const _isMetaFile = (filePath) => {
  return filePath.endsWith(".meta");
};

// -----------------------------------------------------------------------------
// buildFileSets(projectPath)
//
// Scans all tracked folders in the project and builds two Sets:
//
//   fileSet — Absolute paths of all real tracked asset files found on disk.
//   metaSet — Absolute paths of all .meta sidecar files found on disk.
//
// These two sets are built once at the start of reconciliation and then
// passed into all three passes. This avoids redundant disk scans — the
// file system is read exactly once.
//
// NOTE: This function only reads the tracked folders. The exports/ folder
// is completely ignored.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {object} An object with two Sets:
//   {
//     fileSet: {Set<string>} — Absolute paths of all real asset files.
//     metaSet: {Set<string>} — Absolute paths of all .meta files.
//   }
// -----------------------------------------------------------------------------
const buildFileSets = (projectPath) => {
  const fileSet = new Set();
  const metaSet = new Set();

  TRACKED_FOLDERS.forEach((folder) => {
    const absoluteFolderPath = path.join(projectPath, folder);

    // Skip folders that don't exist yet (e.g. a fresh project with no imports).
    if (!fs.existsSync(absoluteFolderPath)) return;

    const entries = fs.readdirSync(absoluteFolderPath, { withFileTypes: true });

    entries.forEach((entry) => {
      // Only process files, not subfolders.
      if (!entry.isFile()) return;

      const absoluteFilePath = path.join(absoluteFolderPath, entry.name);

      if (_isMetaFile(absoluteFilePath)) {
        metaSet.add(absoluteFilePath);
      } else if (_isTrackedFile(absoluteFilePath)) {
        fileSet.add(absoluteFilePath);
      }
      // Files with untracked extensions are silently ignored.
    });
  });

  return { fileSet, metaSet };
};

// -----------------------------------------------------------------------------
// _passOne(projectPath, table, fileSet, metaSet)
//
// PASS 1 — Validate all existing GUID table entries.
//
// For each entry currently in the GUID table:
//
//   Case A: Meta file is MISSING from metaSet
//     → Both the file and meta are gone (or were never properly created).
//     → Remove the GUID entry from the table.
//
//   Case B: Meta file EXISTS but actual file is MISSING from fileSet
//     → User deleted the file but left the meta behind.
//     → Delete the orphaned meta file from disk.
//     → Remove the GUID entry from the table.
//
//   Case C: Both meta and actual file EXIST
//     → Everything is healthy. No action needed.
//
// This pass does NOT save the table to disk. The caller (reconcile) saves
// once after all three passes are complete.
//
// Parameters:
//   projectPath {string}     — Absolute path to the root of the project folder.
//   table       {object}     — The in-memory GUID table (will be mutated).
//   fileSet     {Set<string>}— Set of absolute paths of all real files on disk.
//   metaSet     {Set<string>}— Set of absolute paths of all .meta files on disk.
//
// Returns: {void} — Mutates table directly.
// -----------------------------------------------------------------------------
const _passOne = (projectPath, table, fileSet, metaSet) => {
  // Collect GUIDs to remove in a separate array to avoid mutating the table
  // object while iterating over it.
  const guidsToRemove = [];

  for (const guid in table) {
    const entry = table[guid];
    const absoluteFilePath = toAbsolutePath(projectPath, entry.filePath);
    const absoluteMetaPath = toAbsolutePath(projectPath, entry.metaPath);

    const metaExists = metaSet.has(absoluteMetaPath);
    const fileExists = fileSet.has(absoluteFilePath);

    if (!metaExists) {
      // Case A — Meta is gone. Mark GUID for removal.
      guidsToRemove.push(guid);
    } else if (!fileExists) {
      // Case B — File is gone but meta still exists. Delete the meta from disk.
      deleteMeta(absoluteFilePath);
      guidsToRemove.push(guid);
    }
    // Case C — Both exist. Do nothing.
  }

  // Now safely remove all stale entries from the table.
  guidsToRemove.forEach((guid) => removeEntry(table, guid));
};

// -----------------------------------------------------------------------------
// _passTwo(projectPath, table, fileSet, metaSet)
//
// PASS 2 — Discover and register untracked files.
//
// For each real file found in fileSet:
//
//   Case A: No corresponding .meta file EXISTS in metaSet
//     → File was added outside the app with no meta.
//     → Generate a new GUID, create a .meta file, add a table entry.
//
//   Case B: .meta file EXISTS but NO table entry for its GUID
//     → Meta exists but table entry was lost somehow.
//     → Read the GUID from the existing meta file, add the table entry.
//
//   Case C: .meta file EXISTS and table entry EXISTS
//     → Everything is healthy. No action needed.
//
// Parameters:
//   projectPath {string}     — Absolute path to the root of the project folder.
//   table       {object}     — The in-memory GUID table (will be mutated).
//   fileSet     {Set<string>}— Set of absolute paths of all real files on disk.
//   metaSet     {Set<string>}— Set of absolute paths of all .meta files on disk.
//
// Returns: {void} — Mutates table directly.
// -----------------------------------------------------------------------------
const _passTwo = (projectPath, table, fileSet, metaSet) => {
  fileSet.forEach((absoluteFilePath) => {
    const absoluteMetaPath = getMetaPath(absoluteFilePath);
    const metaExists = metaSet.has(absoluteMetaPath);

    if (!metaExists) {
      // Case A — No meta file. Treat as a completely new untracked file.
      const guid = generateGuid();
      const type = _inferAssetType(absoluteFilePath);
      const name = path.basename(absoluteFilePath);

      // Create the .meta file on disk.
      createMeta(absoluteFilePath, guid, type);

      // Add the entry to the in-memory table.
      const relativeFilePath = toRelativePath(projectPath, absoluteFilePath);
      const relativeMetaPath = toRelativePath(projectPath, absoluteMetaPath);
      addEntry(table, guid, relativeFilePath, relativeMetaPath, type, name);
    } else {
      // Meta file exists — check whether the GUID table has an entry for it.
      try {
        const metaData = readMeta(absoluteFilePath);
        const existingEntry = getEntry(table, metaData.guid);

        if (existingEntry === null) {
          // Case B — Meta exists but no table entry. Re-register from meta data.
          const relativeFilePath = toRelativePath(projectPath, absoluteFilePath);
          const relativeMetaPath = toRelativePath(projectPath, absoluteMetaPath);

          addEntry(
            table,
            metaData.guid,
            relativeFilePath,
            relativeMetaPath,
            metaData.type,
            metaData.originalName
          );
        }
        // Case C — Both exist. Do nothing.
      } catch (err) {
        // If the meta file exists but is corrupt/unreadable, treat it as missing.
        // Delete the bad meta and generate a fresh one with a new GUID.
        const guid = generateGuid();
        const type = _inferAssetType(absoluteFilePath);
        const name = path.basename(absoluteFilePath);

        createMeta(absoluteFilePath, guid, type);

        const relativeFilePath = toRelativePath(projectPath, absoluteFilePath);
        const relativeMetaPath = toRelativePath(projectPath, absoluteMetaPath);
        addEntry(table, guid, relativeFilePath, relativeMetaPath, type, name);
      }
    }
  });
};

// -----------------------------------------------------------------------------
// _passThree(projectPath, fileSet, metaSet)
//
// PASS 3 — Clean up orphaned .meta files.
//
// For each .meta file found in metaSet:
//   Check if the corresponding real file exists in fileSet.
//
//   If the real file is MISSING:
//     → This is an orphaned meta — the actual file was deleted but the meta
//       was left behind AND it had no table entry (otherwise Pass 1 would
//       have already cleaned it up).
//     → Delete the orphaned meta file from disk.
//
//   If the real file EXISTS:
//     → Healthy. No action needed.
//
// NOTE: A .meta file's "corresponding real file" is derived by stripping the
// ".meta" suffix from the meta file's path.
// e.g. "assets/models/robot.glb.meta" → "assets/models/robot.glb"
//
// Parameters:
//   projectPath {string}     — Absolute path to the root of the project folder.
//   fileSet     {Set<string>}— Set of absolute paths of all real files on disk.
//   metaSet     {Set<string>}— Set of absolute paths of all .meta files on disk.
//
// Returns: {void}
// -----------------------------------------------------------------------------
const _passThree = (projectPath, fileSet, metaSet) => {
  metaSet.forEach((absoluteMetaPath) => {
    // Derive the real file path by stripping the ".meta" suffix.
    const correspondingFilePath = absoluteMetaPath.slice(0, -".meta".length);
    const realFileExists = fileSet.has(correspondingFilePath);

    if (!realFileExists) {
      // Orphaned meta — delete it directly since we already have the meta path.
      if (fs.existsSync(absoluteMetaPath)) {
        fs.unlinkSync(absoluteMetaPath);
      }
    }
  });
};

// -----------------------------------------------------------------------------
// reconcile(projectPath, table)
//
// Master reconciliation function — runs all 3 passes in sequence.
// Called automatically by ProjectService.openProject() every time a project
// is opened. The caller is responsible for saving the returned table to disk.
//
// Execution order:
//   1. buildFileSets  — Scan disk once, build fileSet and metaSet.
//   2. _passOne       — Validate and clean the existing GUID table.
//   3. _passTwo       — Discover and register any new untracked files.
//   4. _passThree     — Clean up any remaining orphaned meta files.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   table       {object} — The current in-memory GUID table (will be mutated).
//
// Returns: {object} The updated in-memory GUID table after reconciliation.
//                   The caller (ProjectService) saves this to disk.
// -----------------------------------------------------------------------------
const reconcile = (projectPath, table) => {
  // Step 1 — Scan the file system once to build both sets.
  const { fileSet, metaSet } = buildFileSets(projectPath);

  // Step 2 — Validate existing GUID table entries.
  _passOne(projectPath, table, fileSet, metaSet);

  // Step 3 — Discover and register untracked files.
  _passTwo(projectPath, table, fileSet, metaSet);

  // Step 4 — Clean up orphaned meta files.
  _passThree(projectPath, fileSet, metaSet);

  return table;
};

export {
  buildFileSets,
  reconcile,
};