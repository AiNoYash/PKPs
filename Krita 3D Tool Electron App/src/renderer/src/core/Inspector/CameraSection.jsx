import React, { useState, useEffect } from 'react';
import { useStore } from "../../context/useStore";
import { CameraTypes } from "../../_enums/CameraTypesEnum";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CheckboxInput } from './InputHelpers/CheckboxInput';
import { NumberInput } from './InputHelpers/NumberInput';



export function CameraSection({ activeObject }) {
    const [isOpen, setIsOpen] = useState(true);
    
    // Local states as requested
    const [isActiveCamera, setIsActiveCamera] = useState(false);
    const [matchKritaCanvas, setMatchKritaCanvas] = useState(false);

    // Ensure your useStore has an updateCameraData function (provided below)
    const updateCameraData = useStore((state) => state.updateCameraData);

    const handleCameraChange = (property, value) => {
        if (updateCameraData) {
            updateCameraData(activeObject.id, { [property]: value });
        } else {
            console.warn("updateCameraData is not defined in Zustand store yet.");
        }
    };

    const camData = activeObject.cameraData;
    if (!camData) return null;

    return (
        <div className="inspector-section">
            <div 
                className="section-header" 
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Camera</span>
            </div>
            
            {isOpen && (
                <div className="section-content">
                    <CheckboxInput 
                        label="Make Active Camera" 
                        checked={isActiveCamera} 
                        onChange={setIsActiveCamera} 
                    />
                    <CheckboxInput 
                        label="Match Krita Canvas" 
                        checked={matchKritaCanvas} 
                        onChange={setMatchKritaCanvas} 
                    />

                    <div className="inspector-divider" style={{ height: '1px', backgroundColor: '#1f1f1f', margin: '4px 0' }} />

                    {camData.cameraType === CameraTypes.PERSPECTIVE && (
                        <NumberInput label="FOV" value={camData.fov} onChange={(v) => handleCameraChange('fov', v)} />
                    )}
                    
                    {camData.cameraType === CameraTypes.ORTHOGRAPHIC && (
                        <NumberInput label="Size" value={camData.frustumSize} onChange={(v) => handleCameraChange('frustumSize', v)} />
                    )}

                    <NumberInput label="Near" value={camData.near} onChange={(v) => handleCameraChange('near', v)} />
                    <NumberInput label="Far" value={camData.far} onChange={(v) => handleCameraChange('far', v)} />
                    <NumberInput label="Zoom" value={camData.zoom} onChange={(v) => handleCameraChange('zoom', v)} />
                </div>
            )}
        </div>
    );
}