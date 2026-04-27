import React from 'react';
import { useStore } from '../context/useStore';
import { ObjectTypes } from '../_enums/ObjectTypesEnum';
import { Box, Layers, Video } from 'lucide-react';
import { TransformSection } from './Inspector/TransformSection';
import { CameraSection } from './Inspector/CameraSection';
import { LightSection } from './Inspector/LightSection';
import "./../css/Inspector.css";

export function Inspector() {
    const selectedInspectorObjectId = useStore((state) => state.selectedInspectorObjectId);
    const objects = useStore((state) => state.objects);

    const activeObject = selectedInspectorObjectId ? objects[selectedInspectorObjectId] : null;

    if (!activeObject) {
        return (
            <div className="inspector-container">
                <div className="inspector-empty">No object selected</div>
            </div>
        );
    }

    // Determine specific sub-type for the header
    let subTypeStr = "";
    if (activeObject.type === ObjectTypes.CAMERA && activeObject.cameraData) {
        subTypeStr = activeObject.cameraData.cameraType;
    } else if (activeObject.type === ObjectTypes.LIGHT && activeObject.lightData) {
        subTypeStr = activeObject.lightData.lightType;
    }

    return (
        <div className="inspector-container">
            <div className="inspector-header">
                {activeObject.type === ObjectTypes.GROUP ? <Layers size={16} /> :
                    activeObject.type === ObjectTypes.CAMERA ? <Video size={16} /> :
                        <Box size={16} />}

                <div className="inspector-header-text">
                    <span className="inspector-name">{activeObject.name}</span>
                    <span className="inspector-type-subtitle">
                        {activeObject.type} {subTypeStr ? `- ${subTypeStr}` : ''}
                    </span>
                </div>
            </div>

            {/* Transform applies to Group, 3D Objects, Cameras, and Lights */}
            <TransformSection activeObject={activeObject} />

            {/* Render Camera Section only if it's a camera */}
            {activeObject.type === ObjectTypes.CAMERA && (
                <CameraSection activeObject={activeObject} />
            )}

            {activeObject.type === ObjectTypes.LIGHT && (
                <LightSection activeObject={activeObject} />
            )}
        </div>
    );
}