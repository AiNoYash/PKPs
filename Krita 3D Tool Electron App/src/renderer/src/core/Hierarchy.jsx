import { useState } from "react";
import { useStore } from "../context/useStore";
import { Eye, EyeOff, Lock, Unlock, ChevronDown, ChevronRight, Box, Cuboid } from "lucide-react";
import { ContextMenu } from "../components/ContextMenu";

import "../css/Hierarchy.css";

const HierarchyNode = ({ id, depth = 0 }) => {
    const obj = useStore((state) => state.objects[id]);
    const selectedObjectId = useStore((state) => state.selectedObjectId);
    const selectObject = useStore((state) => state.selectObject);
    const toggleVisibility = useStore((state) => state.toggleVisibility);
    const toggleLock = useStore((state) => state.toggleLock);
    
    const [expanded, setExpanded] = useState(true);

    if (!obj) return null;

    const isSelected = selectedObjectId === id;
    const hasChildren = obj.childrenIds && obj.childrenIds.length > 0;

    const handleSelect = (e) => {
        e.stopPropagation();
        selectObject(id);
    };

    const handleToggleExpand = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };


    return (
        <div className="hierarchy-node-container">
            <div
                className={`hierarchy-row ${isSelected ? "selected" : ""}`}
                onClick={handleSelect}
            >
                {/* 1. Fixed Icons Column */}
                <div className="hierarchy-icons">
                    <span
                        className={`icon-toggle ${!obj.visible ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(id); }}
                        title="Toggle Visibility"
                    >
                        {obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </span>
                    <span
                        className={`icon-toggle ${obj.locked ? "active" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleLock(id); }}
                        title="Toggle Lock"
                    >
                        {obj.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </span>
                </div>

                {/* 2. Dynamic Indentation Spacer */}
                <div style={{ width: `${depth * 14}px`, flexShrink: 0 }} />

                {/* 3. Node Content */}
                <div className="hierarchy-expander" onClick={handleToggleExpand}>
                    {hasChildren ? (
                        expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <span style={{ width: 14 }} />
                    )}
                </div>

                <Box size={14} className="hierarchy-type-icon" />
                
                <span className="hierarchy-name">{obj.name}</span>
            </div>

            {expanded && hasChildren && (
                <div className="hierarchy-children">
                    {obj.childrenIds.map((childId) => (
                        <HierarchyNode key={childId} id={childId} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export function Hierarchy() {
    const rootObjectIds = useStore((state) => state.rootObjectIds);
    const setAllVisibility = useStore((state) => state.setAllVisibility);
    const setAllLock = useStore((state) => state.setAllLock);

    const [sceneExpanded, setSceneExpanded] = useState(true);
    const [sceneVisible, setSceneVisible] = useState(true);
    const [sceneLocked, setSceneLocked] = useState(false);

    const handleSceneVisibility = (e) => {
        e.stopPropagation();
        const newState = !sceneVisible;
        setSceneVisible(newState);
        setAllVisibility(newState);
    };

    const handleSceneLock = (e) => {
        e.stopPropagation();
        const newState = !sceneLocked;
        setSceneLocked(newState);
        setAllLock(newState);
    };

    return (
        <div className="docker-content-container hierarchy-container">
            <div className="hierarchy-node-container">
                {/* SCENE HEADER NODE */}
                <div 
                    className="hierarchy-row scene-header"
                    onClick={() => setSceneExpanded(!sceneExpanded)}
                >
                    {/* Fixed Icons Column for Scene */}
                    <div className="hierarchy-icons">
                        <span
                            className={`icon-toggle ${!sceneVisible ? "active" : ""}`}
                            onClick={handleSceneVisibility}
                            title="Toggle Scene Visibility"
                        >
                            {sceneVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </span>
                        <span
                            className={`icon-toggle ${sceneLocked ? "active" : ""}`}
                            onClick={handleSceneLock}
                            title="Toggle Scene Lock"
                        >
                            {sceneLocked ? <Lock size={14} /> : <Unlock size={14} />}
                        </span>
                    </div>

                    {/* Scene has 0 indentation, but we add a tiny gap to match the children's flow */}
                    <div style={{ width: `4px`, flexShrink: 0 }} />

                    <div className="hierarchy-expander">
                        {sceneExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>

                    <Cuboid size={14} className="hierarchy-type-icon scene-icon" />
                    
                    <span className="hierarchy-name" style={{ fontWeight: '600' }}>Main Scene</span>
                </div>

                {/* SCENE CHILDREN */}
                {sceneExpanded && (
                    <div className="hierarchy-children">
                        {rootObjectIds.map((id) => (
                            <HierarchyNode key={id} id={id} depth={1} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}