import { transformControlRef, useStore } from '../../context/useStore';
import { TransformControls } from '@react-three/drei';
import { ObjectTypes } from '../../_enums/ObjectTypesEnum';
import { HandTools } from '../../_enums/HandToolsEnum';
import { GeometryTypes } from '../../_enums/GeometryTypesEnum';
import { MaterialTypes } from '../../_enums/MaterialTypesEnum';
import * as THREE from 'three';

export function SceneNode({ id }) {
    const obj = useStore((state) => state.objects[id]);
    const selectedObjectId = useStore((state) => state.selectedObjectId);
    const selectObject = useStore((state) => state.selectObject);
    const selectedHandTool = useStore((state) => state.selectedHandTool);

    if (!obj) return null;

    const pos = [obj.transform.position.x, obj.transform.position.y, obj.transform.position.z];
    const rot = [obj.transform.rotation.x, obj.transform.rotation.y, obj.transform.rotation.z];
    const scl = [obj.transform.scale.x, obj.transform.scale.y, obj.transform.scale.z];

    const renderChildren = () => {
        return obj.childrenIds.map((childId) => (
            <SceneNode key={childId} id={childId} />
        ));
    };

    const handlePointerDown = (e) => {
        if (obj.locked) return;
        
        if (transformControlRef.current && transformControlRef.current.axis !== null) {
            return; 
        }
        
        
        e.stopPropagation();
        selectObject(id);
    };

    const renderMaterial = () => {
        // Convert string 'FrontSide' / 'DoubleSide' to actual THREE constants
        const props = { ...obj.meshData.materialProps, side: THREE[obj.meshData.materialProps.side] };

        switch (obj.meshData.materialType) {
            case MaterialTypes.BASIC_MATERIAL:
                return <meshBasicMaterial {...props} />;
            case MaterialTypes.PHYSICAL_MATERIAL:
                return <meshPhysicalMaterial {...props} />;
            case MaterialTypes.STANDARD_MATERIAL:
            default:
                return <meshStandardMaterial {...props} />;
        }
    };

    switch (obj.type) {
        case ObjectTypes.GROUP:
            return (
                <group
                    name={id}
                    position={pos}
                    rotation={rot}
                    scale={scl}
                    visible={obj.visible}
                    userData={{ isLocked: obj.locked }}
                    onPointerDown={handlePointerDown}
                >
                    {renderChildren()}
                </group>
            );

        case ObjectTypes.THREE_D:
            return (
                <mesh
                    name={id}
                    position={pos}
                    rotation={rot}
                    scale={scl}
                    visible={obj.visible}
                    userData={{ isLocked: obj.locked }}
                    onPointerDown={handlePointerDown}
                >
                    {obj.meshData.geometryType === GeometryTypes.BOX && <boxGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.CAPSULE && <capsuleGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.CIRCLE && <circleGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.CONE && <coneGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.CYLINDER && <cylinderGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.PLANE && <planeGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.RING && <ringGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.SPHERE && <sphereGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.TETRAHEDRON && <tetrahedronGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.TORUS && <torusGeometry args={obj.meshData.geometryArgs} />}
                    {obj.meshData.geometryType === GeometryTypes.TORUS_KNOT && <torusKnotGeometry args={obj.meshData.geometryArgs} />}

                    {renderMaterial()}
                    {renderChildren()}
                </mesh>
            );

        default:
            return null;
    }
}