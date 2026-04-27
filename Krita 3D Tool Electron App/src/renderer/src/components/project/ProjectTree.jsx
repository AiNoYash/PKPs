// =============================================================================
// ProjectTree.jsx
// Left panel of the Project layout. Renders the project folder structure as
// a collapsible, indented tree. Only folder nodes are shown here — files are
// displayed in the right panel (ProjectGrid) when a folder is selected.
//
// Props:
//   treeData            {object}   — Root node of the directory tree from IPC.
//   selectedFolderPath  {string}   — Absolute path of the currently selected folder.
//   expandedPaths       {Set}      — Set of folder paths that are expanded.
//   onFolderSelect      {function} — Called with a folder's path when clicked.
//   onFolderToggle      {function} — Called with a folder's path to expand/collapse.
// =============================================================================

import { FileIcon } from "./FileIcon";

// -----------------------------------------------------------------------------
// TreeNode — renders a single folder node and recursively renders its children.
//
// Props:
//   node               {object}   — A folder node from the directory tree.
//   depth              {number}   — Current nesting depth (controls indentation).
//   selectedFolderPath {string}   — Path of the currently selected folder.
//   expandedPaths      {Set}      — Set of currently expanded folder paths.
//   onFolderSelect     {function} — Selection callback.
//   onFolderToggle     {function} — Expand/collapse callback.
// -----------------------------------------------------------------------------
const TreeNode = ({
  node,
  depth,
  selectedFolderPath,
  expandedPaths,
  onFolderSelect,
  onFolderToggle,
  onContextMenu,
}) => {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedFolderPath === node.path;

  // Determine which icon variant to use based on type and expanded state.
  const iconType =
    node.type === "root"
      ? "root"
      : isExpanded
      ? "folder-open"
      : "folder";

  // Child folders only — files are never shown in the left tree.
  const childFolders = (node.children || []).filter(
    (child) => child.type === "folder"
  );

  const handleClick = () => {
    onFolderSelect(node.path);
    onFolderToggle(node.path);
  };

  return (
    <div className="tree-node-wrapper">
      {/* The clickable row for this folder node */}
      <div
        className={`tree-node-row ${isSelected ? "tree-node-row--selected" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {/* Expand/collapse arrow — invisible spacer if no children */}
        <span className={`tree-node-arrow ${isExpanded ? "tree-node-arrow--expanded" : ""}`}>
          {childFolders.length > 0 ? "›" : ""}
        </span>

        {/* Folder icon */}
        <span className="tree-node-icon">
          <FileIcon fileType={iconType} size={15} />
        </span>

        {/* Folder display name */}
        <span className="tree-node-label">{node.name}</span>
      </div>

      {/* Recursively render child folders if this node is expanded */}
      {isExpanded && childFolders.length > 0 && (
        <div className="tree-node-children">
          {childFolders.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFolderPath={selectedFolderPath}
              expandedPaths={expandedPaths}
              onFolderSelect={onFolderSelect}
              onFolderToggle={onFolderToggle}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// ProjectTree — the left panel container.
// Renders the root node of the tree and passes all callbacks down.
// -----------------------------------------------------------------------------
export const ProjectTree = ({
  treeData,
  selectedFolderPath,
  expandedPaths,
  onFolderSelect,
  onFolderToggle,
}) => {
  if (!treeData) {
    return (
      <div className="project-tree project-tree--empty">
        <span className="project-panel-placeholder">No project open.</span>
      </div>
    );
  }

  // Scalability hook: no-op for now, right-click menu wired in future.
  const handleContextMenu = (e, node) => {
    e.preventDefault();
    // TODO: open context menu for the right-clicked node
  };

  return (
    <div className="project-tree">
      <TreeNode
        node={treeData}
        depth={0}
        selectedFolderPath={selectedFolderPath}
        expandedPaths={expandedPaths}
        onFolderSelect={onFolderSelect}
        onFolderToggle={onFolderToggle}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
};
