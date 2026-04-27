// =============================================================================
// Builds a nested directory tree object from the project folder on disk.
// Used by the Project panel in the frontend to display the 2-column layout.
//
// Rules:
//   - .meta files are always excluded from the tree.
//   - Each file node includes its GUID looked up from the active GUID table.
//   - Folder order is fixed: assets/ → scenes/ → exports/ at the root level.
// =============================================================================

import fs from "fs";
import path from "path";
import { toRelativePath } from "./GuidTableService.js";

// Maps file extensions to a fileType string used by the frontend for icons.
const EXTENSION_TYPE_MAP = {
  ".glb":  "model",
  ".gltf": "model",
  ".obj":  "model",
  ".fbx":  "model",
  ".png":  "texture",
  ".jpg":  "texture",
  ".jpeg": "texture",
  ".webp": "texture",
  ".json": "scene",
};

// -----------------------------------------------------------------------------
// _inferFileType(filePath)
//
// Infers a file's type string from its extension and location.
// .png files inside assets/krita/ are "krita", not "texture".
// .png files inside exports/ are "export".
//
// Returns: {string} fileType
// -----------------------------------------------------------------------------
const _inferFileType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".png") {
    if (filePath.includes(`assets${path.sep}krita`)) return "krita";
    if (filePath.includes(`exports`)) return "export";
  }

  return EXTENSION_TYPE_MAP[ext] || "unknown";
};

// -----------------------------------------------------------------------------
// _buildNode(absolutePath, projectPath, table)
//
// Recursively builds a tree node for a given path on disk.
// Returns null if the path is a .meta file (they are always skipped).
//
// A folder node looks like:
//   { name, type: "folder", path, children: [...] }
//
// A file node looks like:
//   { name, type: "file", fileType, path, guid }
//
// Parameters:
//   absolutePath {string} — Absolute path to the file or folder.
//   projectPath  {string} — Project root path (for relative path lookups).
//   table        {object} — Active in-memory GUID table.
//
// Returns: {object|null}
// -----------------------------------------------------------------------------
const _buildNode = (absolutePath, projectPath, table) => {
  const name = path.basename(absolutePath);

  // Skip all .meta sidecar files.
  if (name.endsWith(".meta")) return null;

  const stat = fs.statSync(absolutePath);

  if (stat.isDirectory()) {
    // Read and recursively build children, filtering out any nulls (.meta files).
    const childNames = fs.readdirSync(absolutePath);
    const children = childNames
      .map((childName) => _buildNode(path.join(absolutePath, childName), projectPath, table))
      .filter((node) => node !== null);

    return {
      name,
      type: "folder",
      path: absolutePath,
      children,
    };
  } else {
    // Look up the GUID for this file from the active GUID table.
    const relativePath = toRelativePath(projectPath, absolutePath);
    const guid = _getGuidForFile(relativePath, table);

    return {
      name,
      type: "file",
      fileType: _inferFileType(absolutePath),
      path: absolutePath,
      guid,
    };
  }
};

// -----------------------------------------------------------------------------
// _getGuidForFile(relativePath, table)
//
// Scans the GUID table for an entry whose filePath matches the given
// relative path. Returns the GUID string if found, or null if not found.
// (exports/ files won't be in the table — they correctly return null.)
//
// Parameters:
//   relativePath {string} — Relative path to look up.
//   table        {object} — Active in-memory GUID table.
//
// Returns: {string|null}
// -----------------------------------------------------------------------------
const _getGuidForFile = (relativePath, table) => {
  for (const guid in table) {
    if (table[guid].filePath === relativePath) return guid;
  }
  return null;
};

// -----------------------------------------------------------------------------
// buildDirectoryTree(projectPath, table)
//
// Builds and returns the full directory tree for the given project.
// The root node represents the project folder itself. Its children are ordered
// as: assets/ → scenes/ → exports/ to match the expected panel display order.
//
// Parameters:
//   projectPath {string} — Absolute path to the project root folder.
//   table       {object} — Active in-memory GUID table.
//
// Returns: {object} The root tree node with all children populated.
// -----------------------------------------------------------------------------
const buildDirectoryTree = (projectPath, table) => {
  const projectName = path.basename(projectPath);

  // Fixed display order for top-level folders.
  const topLevelOrder = ["assets", "scenes", "exports"];

  const children = topLevelOrder
    .map((folderName) => {
      const folderPath = path.join(projectPath, folderName);

      // Skip top-level folders that don't exist yet (e.g. fresh project).
      if (!fs.existsSync(folderPath)) return null;

      return _buildNode(folderPath, projectPath, table);
    })
    .filter((node) => node !== null);

  return {
    name: projectName,
    type: "root",
    path: projectPath,
    children,
  };
};

export { buildDirectoryTree };