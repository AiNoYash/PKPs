// =============================================================================
// FileIcon.jsx
// Single source of truth for all icon-to-filetype mappings in the Project panel.
// Uses lucide-react icons. To add a new file type in the future, only this
// file needs to be updated.
//
// Props:
//   fileType {string} — One of: "root" | "folder" | "model" | "texture" |
//                       "scene" | "krita" | "export" | "unknown"
//   size     {number} — Icon size in pixels. Defaults to 20.
//   color    {string} — Icon color. Defaults to the type's preset color.
// =============================================================================

import {
    FolderKanban,
    Folder,
    FolderOpen,
    Box,
    Image,
    Clapperboard,
    Layers,
    ImageDown,
    File,
  } from "lucide-react";
  
  // Preset color per file type — matches the dark Unity-like aesthetic.
  const TYPE_COLORS = {
    root:    "#7eaadc",   // muted blue — project root
    folder:  "#7eaadc",   // muted blue — standard folders
    model:   "#79c99e",   // muted green — 3D models
    texture: "#c9a96e",   // muted amber — image textures
    scene:   "#b48ae0",   // muted purple — scene files
    krita:   "#e07f7f",   // muted red — krita canvas mirror
    export:  "#8ecfc9",   // muted teal — rendered exports
    unknown: "#888888",   // grey — unrecognised file types
  };
  
  // Maps each type to its Lucide icon component.
  // "folder-open" is a special variant used when a folder is expanded.
  const TYPE_ICON_MAP = {
    root:          FolderKanban,
    folder:        Folder,
    "folder-open": FolderOpen,
    model:         Box,
    texture:       Image,
    scene:         Clapperboard,
    krita:         Layers,
    export:        ImageDown,
    unknown:       File,
  };
  
export const FileIcon = ({ fileType = "unknown", size = 20, color }) => {
  const IconComponent = TYPE_ICON_MAP[fileType] || TYPE_ICON_MAP["unknown"];
  const iconColor = color || TYPE_COLORS[fileType] || TYPE_COLORS["unknown"];

  return <IconComponent size={size} color={iconColor} strokeWidth={1.5} />;
};
  
export { TYPE_COLORS };