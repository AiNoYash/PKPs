import { transformControlRef, useStore } from '../../context/useStore';
import { TransformControls } from '@react-three/drei';
import { ObjectTypes } from '../../_enums/ObjectTypesEnum';
import { HandTools } from '../../_enums/HandToolsEnum';
import { GeometryTypes } from '../../_enums/GeometryTypesEnum';
import { MaterialTypes } from '../../_enums/MaterialTypesEnum';
import * as THREE from 'three';
import { CameraTypes } from '../../_enums/CameraTypesEnum';
import { LightTypes } from '../../_enums/LightTypesEnum';
import { PerspectiveCamera } from '@react-three/drei';
import { OrthographicCamera } from '@react-three/drei';


export function SceneNode({ id }) {
    const obj = useStore((state) => state.objects[id]);
    const selectedObjectId = useStore((state) => state.selectedObjectId);
    const selectObject = useStore((state) => state.selectObject);
    const selectInspectorObject = useStore((state) => state.selectInspectorObject);
    const selectedHandTool = useStore((state) => state.selectedHandTool);

    if (!obj) return null;

    const pos = [obj.transform.position.x, obj.transform.position.y, obj.transform.position.z];
    const rot = [obj.transform.rotation.x, obj.transform.rotation.y, obj.transform.rotation.z];
    const scl = [obj.transform.scale.x, obj.transform.scale.y, obj.transform.scale.z];


    // ? Here because idk you can't call react hooks inside conditional statements
    const targetId = obj?.lightData?.targetId;
    const targetObj = useStore((state) => targetId ? state.objects[targetId] : null);


    const renderChildren = () => {
        return obj.childrenIds.map((childId) => (
            <SceneNode key={childId} id={childId} />
        ));
    };

    const handlePointerDown = (e) => {
        if (obj.locked || selectedHandTool === HandTools.PAN) return;

        if (transformControlRef.current && transformControlRef.current.axis !== null) {
            return;
        }


        e.stopPropagation();
        selectObject(id);
        selectInspectorObject(id);
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
                    castShadow
                    receiveShadow
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

        case ObjectTypes.CAMERA: {
            const { cameraType, near, far, zoom, manual, aspect, fov, frustumSize } = obj.cameraData;

            // Calculate orthographic bounds ONLY if manual is active and aspect is provided
            const orthoBounds = (manual && aspect) ? {
                left: -(frustumSize * aspect) / 2,
                right: (frustumSize * aspect) / 2,
                top: frustumSize / 2,
                bottom: -frustumSize / 2,
            } : {};

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
                    {cameraType === CameraTypes.PERSPECTIVE && (
                        <PerspectiveCamera
                            fov={fov}
                            near={near}
                            far={far}
                            zoom={zoom}
                            manual={manual}
                            aspect={manual ? aspect : undefined}
                        />
                    )}

                    {cameraType === CameraTypes.ORTHOGRAPHIC && (
                        <OrthographicCamera
                            near={near}
                            far={far}
                            zoom={zoom}
                            manual={manual}
                            {...orthoBounds}
                        />
                    )}
                    {renderChildren()}
                </group>
            );
        }

        case ObjectTypes.LIGHT: {

            const { lightType, targetId, color, intensity, castShadow } = obj.lightData;


            const localTargetPos = targetObj
                ? [
                    targetObj.transform.position.x - obj.transform.position.x,
                    targetObj.transform.position.y - obj.transform.position.y,
                    targetObj.transform.position.z - obj.transform.position.z
                ]
                : [0, -1, 0];


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

                    {lightType === LightTypes.AMBIENT && (
                        <>
                            <ambientLight intensity={intensity} color={color} />
                        </>
                    )}

                    {lightType === LightTypes.DIRECTIONAL && (
                        <directionalLight
                            intensity={intensity}
                            color={color}
                            castShadow={castShadow}
                        >
                            <object3D attach="target" position={localTargetPos} />
                        </directionalLight>
                    )}

                    {renderChildren()}
                </group>
            );
        }
        default:
            return null;
    }
}