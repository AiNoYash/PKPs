import React, { useEffect, useState } from 'react';
import { useStore } from "../../context/useStore";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CheckboxInput } from './InputHelpers/CheckboxInput';
import { NumberInput } from './InputHelpers/NumberInput';
import { GeometryTypes } from '../../_enums/GeometryTypesEnum';
import { MaterialTypes } from '../../_enums/MaterialTypesEnum';
import { MaterialFactory } from '../../_classes/MaterialFactory';

// Helper to map array indices to readable labels based on Geometry Type
const GeometryArgLabels = {
    [GeometryTypes.BOX]: ['Width', 'Height', 'Depth'],
    [GeometryTypes.SPHERE]: ['Radius', 'Width Segments', 'Height Segments'],
    [GeometryTypes.PLANE]: ['Width', 'Height'],
    [GeometryTypes.CYLINDER]: ['Radius Top', 'Radius Bottom', 'Height', 'Radial Segments'],
    [GeometryTypes.CONE]: ['Radius', 'Height', 'Radial Segments'],
    [GeometryTypes.TORUS]: ['Radius', 'Tube', 'Radial Segments', 'Tubular Segments'],
    [GeometryTypes.CAPSULE]: ['Radius', 'Length', 'Cap Segments', 'Radial Segments'],
    [GeometryTypes.CIRCLE]: ['Radius', 'Segments'],
    [GeometryTypes.RING]: ['Inner Radius', 'Outer Radius', 'Theta Segments'],
    [GeometryTypes.TETRAHEDRON]: ['Radius', 'Detail'],
    [GeometryTypes.TORUS_KNOT]: ['Radius', 'Tube', 'Tubular Segments', 'Radial Segments']
};

export function ObjectSection({ activeObject }) {
    const [isOpen, setIsOpen] = useState(true);
    const updateObject = useStore((state) => state.updateObject);
    const updateMeshData = useStore((state) => state.updateMeshData);


    const meshData = activeObject?.meshData;
    if (!meshData) return null;


    const [availableTextures, setAvailableTextures] = useState(null);
    const activeFileTree = useStore((state) => state.activeFileTree);


    useEffect(() => {
        if (activeFileTree === null) {
            return;
        }

        const textures = activeFileTree.children[0].children[2];

        setAvailableTextures(textures.children.map((texture, index, arr) => {
            return texture.path;
        }));


    }, [activeFileTree]);

    console.log(availableTextures);

    const handleGeometryArgChange = (index, value) => {
        const newArgs = [...meshData.geometryArgs];
        newArgs[index] = value;

        updateObject(activeObject.id, {
            meshData: { ...meshData, geometryArgs: newArgs }
        });
    };

    const handleMaterialTypeChange = (e) => {
        const newMaterialType = e.target.value;

        // Fetch the template for the newly selected material to ensure we have the right default props
        let template;
        if (newMaterialType === MaterialTypes.BASIC_MATERIAL) template = MaterialFactory.meshBasicMaterialTemplate;
        else if (newMaterialType === MaterialTypes.PHYSICAL_MATERIAL) template = MaterialFactory.meshPhysicalMaterialTemplate;
        else template = MaterialFactory.meshStandardMaterialTemplate;

        updateObject(activeObject.id, {
            meshData: {
                ...meshData,
                materialType: newMaterialType,
                materialProps: { ...template.materialProps },
                textureMaps: { ...template.textureMaps }
            }
        });
    };


    const handleMaterialPropChange = (property, value) => {
        updateMeshData(activeObject.id, {
            materialProps: { [property]: value }
        });
    };

    const handleTextureMapChange = (mapName, e) => {
        const selectedValue = e.target.value;

        // Determine the value to store: null if empty string, otherwise the path
        const newValue = selectedValue === "" ? null : selectedValue;

        updateMeshData(activeObject.id, {
            textureMaps: {
                [mapName]: newValue
            }
        });
    };

    // --- RENDER HELPERS ---

    const argLabels = GeometryArgLabels[meshData.geometryType] || [];
    const matProps = meshData.materialProps;

    const textureMaps = meshData.textureMaps || {};

    return (
        <div className="inspector-section">
            <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Object Data</span>
            </div>

            {isOpen && (
                <div className="section-content">

                    {/* --- GEOMETRY SECTION --- */}
                    <div className="inspector-subsection-title">Geometry ({meshData.geometryType})</div>
                    {meshData.geometryArgs.map((argValue, index) => (
                        <NumberInput
                            key={`geom-${index}`}
                            label={argLabels[index] || `Arg ${index + 1}`}
                            value={argValue}
                            onChange={(v) => handleGeometryArgChange(index, v)}
                        />
                    ))}

                    <div className="inspector-divider" style={{ height: '1px', backgroundColor: '#1f1f1f', margin: '8px 0' }} />

                    {/* --- MATERIAL SECTION --- */}
                    <div className="inspector-subsection-title">Material</div>

                    <div className="inspector-row">
                        <span className="inspector-label">Type</span>
                        <select
                            className="inspector-select"
                            value={meshData.materialType}
                            onChange={handleMaterialTypeChange}
                        >
                            <option value={MaterialTypes.STANDARD_MATERIAL}>Standard</option>
                            <option value={MaterialTypes.BASIC_MATERIAL}>Basic (Unlit)</option>
                            <option value={MaterialTypes.PHYSICAL_MATERIAL}>Physical (Advanced PBR)</option>
                        </select>
                    </div>

                    {/* Dynamic Material Properties based on what exists in the object */}
                    {matProps.color !== undefined && (
                        <div className="inspector-row">
                            <span className="inspector-label">Color</span>
                            <input
                                type="color"
                                value={matProps.color}
                                onChange={(e) => handleMaterialPropChange('color', e.target.value)}
                            />
                        </div>
                    )}

                    {matProps.emissive !== undefined && (
                        <div className="inspector-row">
                            <span className="inspector-label">Emissive</span>
                            <input
                                type="color"
                                value={matProps.emissive}
                                onChange={(e) => handleMaterialPropChange('emissive', e.target.value)}
                            />
                        </div>
                    )}

                    {matProps.roughness !== undefined && <NumberInput label="Roughness" value={matProps.roughness} onChange={(v) => handleMaterialPropChange('roughness', v)} />}
                    {matProps.metalness !== undefined && <NumberInput label="Metalness" value={matProps.metalness} onChange={(v) => handleMaterialPropChange('metalness', v)} />}
                    {matProps.emissiveIntensity !== undefined && <NumberInput label="Glow Intensity" value={matProps.emissiveIntensity} onChange={(v) => handleMaterialPropChange('emissiveIntensity', v)} />}

                    {/* Physical Material Exclusives */}
                    {matProps.clearcoat !== undefined && <NumberInput label="Clearcoat" value={matProps.clearcoat} onChange={(v) => handleMaterialPropChange('clearcoat', v)} />}
                    {matProps.transmission !== undefined && <NumberInput label="Transmission" value={matProps.transmission} onChange={(v) => handleMaterialPropChange('transmission', v)} />}
                    {matProps.ior !== undefined && <NumberInput label="IOR" value={matProps.ior} onChange={(v) => handleMaterialPropChange('ior', v)} />}

                    {matProps.opacity !== undefined && <NumberInput label="Opacity" value={matProps.opacity} onChange={(v) => handleMaterialPropChange('opacity', v)} />}
                    {matProps.transparent !== undefined && <CheckboxInput label="Transparent" checked={matProps.transparent} onChange={(v) => handleMaterialPropChange('transparent', v)} />}
                    {matProps.wireframe !== undefined && <CheckboxInput label="Wireframe" checked={matProps.wireframe} onChange={(v) => handleMaterialPropChange('wireframe', v)} />}
                    {matProps.flatShading !== undefined && <CheckboxInput label="Flat Shading" checked={matProps.flatShading} onChange={(v) => handleMaterialPropChange('flatShading', v)} />}

                    <div className="inspector-divider" style={{ height: '1px', backgroundColor: '#1f1f1f', margin: '8px 0' }} />

                    {/* --- TEXTURE MAPS SECTION (DUMMY) --- */}
                    <div className="inspector-subsection-title">Texture Maps</div>
                    {/* --- TEXTURE MAPS SECTION (UPDATED) --- */}

                    {Object.keys(textureMaps).map((mapName) => (
                        <div className="inspector-row" key={`tex-${mapName}`}>
                            <span className="inspector-label" style={{ textTransform: 'capitalize' }}>{mapName}</span>
                            <select
                                className="inspector-select"
                                onChange={(e) => handleTextureMapChange(mapName, e)}
                                value={textureMaps[mapName] || ""}
                            >
                                <option value="">None</option>
                                {/* Map through your actual textures state */}
                                {availableTextures && availableTextures.map((path) => (
                                    <option key={path} value={path}>
                                        {path.split('/').pop()} {/* Shows filename only for cleaner UI */}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
}