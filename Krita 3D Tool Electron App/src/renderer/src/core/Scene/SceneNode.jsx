import { useStore } from '../../context/useStore';
import { TransformControls } from '@react-three/drei';
import { ObjectTypes } from '../../_enums/ObjectTypesEnum';
import { HandTools } from '../../_enums/HandToolsEnum';

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
        if (obj.locked)
            return;

        e.stopPropagation();
        selectObject(id);
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

        return(
            <>
            </>
        )

        default:
            return null;
    }
}