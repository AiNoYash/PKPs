import { useState } from 'react';
import { useStore } from "../../context/useStore";
import { Vector3Input } from "./InputHelpers/Vector3Input";
import { ChevronDown, ChevronRight } from 'lucide-react';

export function TransformSection({ activeObject }) {
    const [isOpen, setIsOpen] = useState(true);
    const updateTransform = useStore((state) => state.updateTransform);

    const handleTransformChange = (type, partialVal) => {
        updateTransform(activeObject.id, { [type]: partialVal });
    };

    return (
        <div className="inspector-section">
            <div 
                className="section-header" 
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Transform</span>
            </div>
            
            {isOpen && (
                <div className="section-content">
                    <Vector3Input
                        label="Position"
                        value={activeObject.transform.position}
                        onChange={(val) => handleTransformChange('position', val)}
                    />
                    <Vector3Input
                        label="Rotation"
                        value={activeObject.transform.rotation}
                        onChange={(val) => handleTransformChange('rotation', val)}
                        isRotation={true}
                    />
                    <Vector3Input
                        label="Scale"
                        value={activeObject.transform.scale}
                        onChange={(val) => handleTransformChange('scale', val)}
                    />
                </div>
            )}
        </div>
    );
}