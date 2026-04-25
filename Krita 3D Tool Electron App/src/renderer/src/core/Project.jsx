// =============================================================================
// Project.jsx
// Main container for the Project panel. Fetches the directory tree from the
// backend via IPC, manages all shared state, and wires ProjectTree and
// ProjectGrid together.
//
// Rendered inside the flexlayout-react tab assigned to the Project panel.
// No props required — this component is self-contained.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { ProjectTree } from "../components/project/ProjectTree";
import { ProjectGrid } from "../components/project/ProjectGrid";
import "../css/Project.css";

// ipcRenderer exposed to the renderer process via Electron's contextBridge.
const { invoke } = window.Project;

export const Project = () => {
  // The full directory tree object returned from the backend.
  const [treeData, setTreeData] = useState(null);

  // Absolute path of the folder currently selected in the left tree.
  // Drives what the right grid displays.
  const [selectedFolderPath, setSelectedFolderPath] = useState(null);

  // Set of folder paths that are currently expanded in the left tree.
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  // Tracks navigation history for the right panel — enables a future
  // "back" button or breadcrumb bar without reworking state.
  const [navigationHistory, setNavigationHistory] = useState([]);

  // Error message to display if the IPC call fails.
  const [error, setError] = useState(null);

  // Loading state to show a placeholder while the tree is being fetched.
  const [isLoading, setIsLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // fetchDirectoryTree
  //
  // Calls the backend to get the latest directory tree for the open project.
  // Re-exported as a stable reference via useCallback so child components or
  // external callers (e.g. after asset:import) can trigger a refresh.
  // ---------------------------------------------------------------------------
  const fetchDirectoryTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke("project:getDirectoryTree");

      if (!result.success) {
        setError(result.error);
        setTreeData(null);
        return;
      }

      setTreeData(result.tree);

      // On first load, auto-select and auto-expand the root node so the
      // panel doesn't appear blank — mirrors Unity's default behaviour.
      setSelectedFolderPath((prev) => prev ?? result.tree.path);
      setExpandedPaths((prev) => {
        if (prev.size === 0) {
          return new Set([result.tree.path]);
        }
        return prev;
      });
    } catch (err) {
      setError(`Failed to load project directory. Reason: ${err.message}`);
      setTreeData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch the tree when the component first mounts.
  useEffect(() => {
    fetchDirectoryTree();
  }, [fetchDirectoryTree]);

  // ---------------------------------------------------------------------------
  // handleFolderSelect
  //
  // Called when the user clicks a folder node in the left tree.
  // Updates selectedFolderPath — the right grid reacts automatically.
  // ---------------------------------------------------------------------------
  const handleFolderSelect = useCallback((folderPath) => {
    setSelectedFolderPath(folderPath);
  }, []);

  // ---------------------------------------------------------------------------
  // handleFolderToggle
  //
  // Called when the user clicks a folder node in the left tree.
  // Toggles the folder's expanded/collapsed state.
  // ---------------------------------------------------------------------------
  const handleFolderToggle = useCallback((folderPath) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // handleFolderNavigate
  //
  // Called when the user clicks a folder tile in the right grid.
  // Selects the folder, expands it in the left tree, and records the
  // previous location in navigationHistory for future back-navigation.
  // ---------------------------------------------------------------------------
  const handleFolderNavigate = useCallback((folderPath) => {
    setNavigationHistory((prev) => [...prev, selectedFolderPath]);
    setSelectedFolderPath(folderPath);

    // Also expand the folder in the left tree so both panels stay in sync.
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      next.add(folderPath);
      return next;
    });
  }, [selectedFolderPath]);

  // ---------------------------------------------------------------------------
  // RENDER — loading, error, and normal states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="project-panel">
        <div className="project-panel-body">
          <div className="project-tree project-tree--empty">
            <span className="project-panel-placeholder">Loading…</span>
          </div>
          <div className="project-grid project-grid--empty">
            <span className="project-panel-placeholder">Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-panel">
        <div className="project-panel-body">
          <div className="project-grid project-grid--empty">
            <span className="project-panel-placeholder">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-panel">
      <div className="project-panel-body">

        {/* LEFT — folder tree */}
        <ProjectTree
          treeData={treeData}
          selectedFolderPath={selectedFolderPath}
          expandedPaths={expandedPaths}
          onFolderSelect={handleFolderSelect}
          onFolderToggle={handleFolderToggle}
        />

        {/* RIGHT — icon grid */}
        <ProjectGrid
          treeData={treeData}
          selectedFolderPath={selectedFolderPath}
          onFolderNavigate={handleFolderNavigate}
        />

      </div>
    </div>
  );
};
