// =============================================================================
// ProjectGrid.jsx
// Right panel of the Project layout. Displays the direct children of the
// currently selected folder as icon tiles in a grid — matching the Unity
// Project panel style.
//
// Folders in the grid are clickable and navigate into them (updates selected
// folder). Files are displayed but clicking them is a no-op for now.
//
// Props:
//   treeData           {object}   — Root node of the directory tree from IPC.
//   selectedFolderPath {string}   — Absolute path of the currently selected folder.
//   onFolderNavigate   {function} — Called with a folder path when a folder
//                                   tile is clicked in the grid.
// =============================================================================

import { FileIcon } from "./FileIcon";
import { useStore } from "../../context/useStore";
const { invoke } = window.Project;

// -----------------------------------------------------------------------------
// _findNodeByPath(node, targetPath)
//
// Recursively searches the tree for a node whose path matches targetPath.
// Returns the matching node object, or null if not found.
// -----------------------------------------------------------------------------
const _findNodeByPath = (node, targetPath) => {
  if (node.path === targetPath) return node;

  for (const child of node.children || []) {
    const found = _findNodeByPath(child, targetPath);
    if (found) return found;
  }

  return null;
};

// -----------------------------------------------------------------------------
// _truncateName(name, maxLength)
//
// Truncates a file/folder name with an ellipsis if it exceeds maxLength.
// Keeps the file extension visible when truncating.
// e.g. "very_long_model_name.glb" → "very_long_mo….glb"
// -----------------------------------------------------------------------------
const _truncateName = (name, maxLength = 14) => {
  if (name.length <= maxLength) return name;

  const dotIndex = name.lastIndexOf(".");

  // No extension — just truncate with ellipsis.
  if (dotIndex === -1) return name.slice(0, maxLength - 1) + "…";

  const ext = name.slice(dotIndex);         // e.g. ".glb"
  const base = name.slice(0, dotIndex);     // e.g. "very_long_model_name"
  const allowedBase = maxLength - ext.length - 1;

  if (allowedBase <= 0) return name.slice(0, maxLength - 1) + "…";

  return base.slice(0, allowedBase) + "…" + ext;
};

// -----------------------------------------------------------------------------
// GridTile — renders a single icon tile for a file or folder in the grid.
//
// Props:
//   node           {object}   — A child node (file or folder) of the selected folder.
//   onFolderClick  {function} — Called when a folder tile is clicked.
//   onFileClick    {function} — Called when a file tile is clicked (no-op for now).
//   onContextMenu  {function} — Called on right-click (no-op for now).
// -----------------------------------------------------------------------------
const GridTile = ({ node, onFolderClick, onFileClick, onContextMenu }) => {
  const isFolder = node.type === "folder";
  const truncatedName = _truncateName(node.name);

  const handleClick = () => {
    if (isFolder) {
      onFolderClick(node.path);
    } else {
      onFileClick(node);
    }
  };

  return (
    <div
      className={`grid-tile ${isFolder ? "grid-tile--folder" : "grid-tile--file"}`}
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, node)}
      title={node.name}  // native tooltip shows full name on hover
    >
      {/* Large icon centred in the tile */}
      <div className="grid-tile-icon">
        <FileIcon
          fileType={isFolder ? "folder" : node.fileType}
          size={36}
        />
      </div>

      {/* File/folder name underneath the icon */}
      <span className="grid-tile-label">{truncatedName}</span>
    </div>
  );
};

// -----------------------------------------------------------------------------
// ProjectGrid — the right panel container.
// Finds the selected folder node in the tree and renders its direct children.
// -----------------------------------------------------------------------------
export const ProjectGrid = ({ treeData, selectedFolderPath, onFolderNavigate }) => {
  const setRootObjectIds = useStore((state) => state.setRootObjectIds);
  const setObjects = useStore((state) => state.setObjects);
  
  // No project open yet.
  if (!treeData) {
    return (
      <div className="project-grid project-grid--empty">
        <span className="project-panel-placeholder">No project open.</span>
      </div>
    );
  }

  // No folder selected yet — prompt the user to select one.
  if (!selectedFolderPath) {
    return (
      <div className="project-grid project-grid--empty">
        <span className="project-panel-placeholder">
          Select a folder to view its contents.
        </span>
      </div>
    );
  }

  // Find the node in the tree that matches the selected folder path.
  const selectedNode = _findNodeByPath(treeData, selectedFolderPath);

  if (!selectedNode) {
    return (
      <div className="project-grid project-grid--empty">
        <span className="project-panel-placeholder">Folder not found.</span>
      </div>
    );
  }

  const children = selectedNode.children || [];

  // Selected folder exists but is empty.
  if (children.length === 0) {
    return (
      <div className="project-grid project-grid--empty">
        <span className="project-panel-placeholder">This folder is empty.</span>
      </div>
    );
  }

  // Scalability hooks — no-ops for now, wired in for future interactions.
  const handleFileClick = async (node) => {
    if(node.fileType !== "scene"){
      return;
    }

    const filePath = node.path;
    const response = await invoke("scene:load", {filePath});

    if(!(response.success)){
      console.error("Error Occured: ", response.error);
    }

    setRootObjectIds(response.sceneData.rootObjectIds);
    setObjects(response.sceneData.objects);

    console.log("Scene loaded successfully!");
  };

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    // TODO: open context menu (rename, delete, reveal in explorer, etc.)
  };

  return (
    <div className="project-grid">
      {children.map((child) => (
        <GridTile
          key={child.path}
          node={child}
          onFolderClick={onFolderNavigate}
          onFileClick={handleFileClick}
          onContextMenu={handleContextMenu}
        />
      ))}
    </div>
  );
};
