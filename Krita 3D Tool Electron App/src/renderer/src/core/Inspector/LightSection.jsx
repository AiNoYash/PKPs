import React, { useState } from 'react';
import { useStore } from "../../context/useStore";
import { LightTypes } from "../../_enums/LightTypesEnum";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NumberInput } from './InputHelpers/NumberInput';
import { ColorInput } from './InputHelpers/ColorInput';
import { CheckboxInput } from './InputHelpers/CheckboxInput';


export function LightSection({ activeObject }) {
    const [isOpen, setIsOpen] = useState(true);
    const updateLightData = useStore((state) => state.updateLightData);

    const handleLightChange = (property, value) => {
        if (updateLightData) {
            updateLightData(activeObject.id, { [property]: value });
        } else {
            console.warn("updateLightData is not defined in Zustand store yet.");
        }
    };

    const lightData = activeObject.lightData;
    if (!lightData) return null;

    return (
        <div className="inspector-section">
            <div
                className="section-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Light</span>
            </div>

            {isOpen && (
                <div className="section-content">
                    <ColorInput
                        label="Color"
                        value={lightData.color}
                        onChange={(v) => handleLightChange('color', v)}
                    />
                    <NumberInput
                        label="Intensity"
                        value={lightData.intensity}
                        onChange={(v) => handleLightChange('intensity', v)}
                    />

                    {lightData.lightType === LightTypes.DIRECTIONAL && (
                        <CheckboxInput
                            label="Cast Shadow"
                            checked={lightData.castShadow}
                            onChange={(v) => handleLightChange('castShadow', v)}
                        />
                    )}
                </div>
            )}
        </div>
    );
}