import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { HandTools } from '../../_enums/HandToolsEnum';
import { transformControlRef, useStore } from '../../context/useStore';

export function SceneTransformController() {

    const { scene } = useThree();
    const selectedObjectId = useStore((state) => state.selectedObjectId);
    const selectedHandTool = useStore((state) => state.selectedHandTool);
    const updateTransform = useStore((state) => state.updateTransform);

    const [targetObject, setTargetObject] = useState(null);

    // Sync the Three.js object reference when selection changes
    useEffect(() => {
        if (selectedObjectId) {
            const obj3d = scene.getObjectByName(selectedObjectId);
            setTargetObject(obj3d || null);
        } else {
            setTargetObject(null);
        }
    }, [selectedObjectId, scene]);

    const handleTransformEnd = () => {
        if (!targetObject || !selectedObjectId) return;
        updateTransform(selectedObjectId, {
            position: { x: targetObject.position.x, y: targetObject.position.y, z: targetObject.position.z },
            rotation: { x: targetObject.rotation.x, y: targetObject.rotation.y, z: targetObject.rotation.z },
            scale: { x: targetObject.scale.x, y: targetObject.scale.y, z: targetObject.scale.z }
        });
    };

    if (!targetObject || selectedHandTool === HandTools.PAN) return null;

    return (
        <TransformControls
            ref={(node) => { transformControlRef.current = node }}
            object={targetObject}
            mode={selectedHandTool.toLowerCase()}
            onMouseUp={handleTransformEnd}
        />
    );
}


