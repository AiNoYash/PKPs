// =============================================================================
// Responsible for all GUID table operations — loading, saving, and mutating
// the persistent guid-table.json file that lives inside every project folder.
//
// IMPORTANT DESIGN NOTE:
//   All mutation functions (addEntry, removeEntry) operate on an in-memory
//   table object. They do NOT write to disk themselves. The caller is
//   responsible for calling saveTable() when they are done with all mutations.
//   This prevents redundant disk writes and keeps I/O efficient.
//
//   Typical usage pattern:
//     const table = loadTable(projectPath);       // read once from disk
//     addEntry(table, ...);                       // mutate in memory
//     removeEntry(table, ...);                    // mutate in memory
//     saveTable(projectPath, table);              // write once to disk
// =============================================================================

const fs = require("fs");
const path = require("path");

// The name of the GUID table file inside every project folder.
const GUID_TABLE_FILENAME = "guid-table.json";

// -----------------------------------------------------------------------------
// _getTablePath(projectPath)
//
// Private helper — constructs the absolute path to the guid-table.json file
// for a given project.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {string} Absolute path to guid-table.json.
// -----------------------------------------------------------------------------
const _getTablePath = (projectPath) => {
  return path.join(projectPath, GUID_TABLE_FILENAME);
};

// -----------------------------------------------------------------------------
// loadTable(projectPath)
//
// Reads guid-table.json from the project folder and parses it into a plain
// JavaScript object that is held in memory for the duration of the session.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//
// Returns: {object} The parsed GUID table. An empty object {} is returned if
//                   the file exists but is empty. 
//
// Throws: If the file does not exist or cannot be parsed.
// -----------------------------------------------------------------------------
const loadTable = (projectPath) => {
  const tablePath = _getTablePath(projectPath);

  if (!fs.existsSync(tablePath)) {
    throw new Error(`guid-table.json not found in project: ${projectPath}`);
  }

  const raw = fs.readFileSync(tablePath, "utf-8");

  // Handle the case where the file exists but is completely empty.
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse guid-table.json in: ${projectPath}. Reason: ${err.message}`);
  }
};

// -----------------------------------------------------------------------------
// saveTable(projectPath, table)
//
// Writes the in-memory table object back to guid-table.json on disk.
// This is the ONLY function that performs a disk write in this module.
// Always call this after finishing all in-memory mutations.
//
// Parameters:
//   projectPath {string} — Absolute path to the root of the project folder.
//   table       {object} — The in-memory GUID table object to persist.
//
// Returns: {void}
// -----------------------------------------------------------------------------
const saveTable = (projectPath, table) => {
  const tablePath = _getTablePath(projectPath);
  fs.writeFileSync(tablePath, JSON.stringify(table, null, 2), "utf-8");
};

// -----------------------------------------------------------------------------
// addEntry(table, guid, filePath, metaPath, type, name)
//
// Adds a new entry into the in-memory table object.
//
// NOTE: filePath and metaPath must be stored as RELATIVE paths (relative to
// the project folder root). This keeps the project portable — moving or
// sharing the project folder won't break stored paths.
// Use toRelativePath() below to convert before calling this function.
//
// Parameters:
//   table    {object} — The in-memory GUID table object (mutated directly).
//   guid     {string} — The GUID of the file being registered.
//   filePath {string} — Relative path to the actual file.
//   metaPath {string} — Relative path to the corresponding .meta file.
//   type     {string} — Asset type: "model" | "texture" | "scene" | "krita".
//   name     {string} — Human-readable display name (e.g. "Robot", "Wood Texture").
//
// Returns: {void} — Mutates the table object directly.
// -----------------------------------------------------------------------------
const addEntry = (table, guid, filePath, metaPath, type, name) => {
  table[guid] = {
    filePath,
    metaPath,
    type,
    name,
    addedAt: new Date().toISOString(),
  };
};

// -----------------------------------------------------------------------------
// removeEntry(table, guid)
//
// Removes an entry from the in-memory table object by its GUID.
// If the GUID does not exist in the table, silently does nothing.
//
// Parameters:
//   table {object} — The in-memory GUID table object (mutated directly).
//   guid  {string} — The GUID of the entry to remove.
//
// Returns: {void} — Mutates the table object directly.
// -----------------------------------------------------------------------------
const removeEntry = (table, guid) => {
  // The 'in' operator checks if the key exists before attempting deletion.
  // This prevents any unexpected behavior on a non-existent key.
  if (guid in table) {
    delete table[guid];
  }
};

// -----------------------------------------------------------------------------
// getEntry(table, guid)
//
// Looks up and returns a single entry from the in-memory table by its GUID.
//
// Parameters:
//   table {object} — The in-memory GUID table object.
//   guid  {string} — The GUID to look up.
//
// Returns: {object|null} The table entry object if found, or null if not found.
//                        An entry object looks like:
//                        {
//                          filePath: "assets/models/robot.glb",
//                          metaPath: "assets/models/robot.glb.meta",
//                          type:     "model",
//                          name:     "Robot",
//                          addedAt:  "2026-04-22T10:30:00Z"
//                        }
// -----------------------------------------------------------------------------
const getEntry = (table, guid) => {
  return table[guid] ?? null;
};

// -----------------------------------------------------------------------------
// toRelativePath(projectPath, absolutePath)
//
// Converts an absolute file path to a path relative to the project folder.
// Always use this before storing paths via addEntry().
//
// Example:
//   projectPath  = "C:/Users/Dev/Projects/MyCharacterPose"
//   absolutePath = "C:/Users/Dev/Projects/MyCharacterPose/assets/models/robot.glb"
//   → returns    = "assets/models/robot.glb"
//
// Parameters:
//   projectPath  {string} — Absolute path to the root of the project folder.
//   absolutePath {string} — Absolute path to convert.
//
// Returns: {string} The relative path string.
// -----------------------------------------------------------------------------
const toRelativePath = (projectPath, absolutePath) => {
  return path.relative(projectPath, absolutePath);
};

// -----------------------------------------------------------------------------
// toAbsolutePath(projectPath, relativePath)
//
// Converts a relative path stored in the table back to an absolute path.
// Use this whenever you need to perform an actual file system operation
// on a file referenced by the GUID table.
//
// Example:
//   projectPath  = "C:/Users/Dev/Projects/MyCharacterPose"
//   relativePath = "assets/models/robot.glb"
//   → returns    = "C:/Users/Dev/Projects/MyCharacterPose/assets/models/robot.glb"
//
// Parameters:
//   projectPath  {string} — Absolute path to the root of the project folder.
//   relativePath {string} — Relative path from a table entry.
//
// Returns: {string} The absolute path string.
// -----------------------------------------------------------------------------
const toAbsolutePath = (projectPath, relativePath) => {
  return path.resolve(projectPath, relativePath);
};

module.exports = {
  loadTable,
  saveTable,
  addEntry,
  removeEntry,
  getEntry,
  toRelativePath,
  toAbsolutePath,
};