import { TransformControls } from '@react-three/drei';

import { useStore } from '../context/useStore';
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
        e.stopPropagation();
        selectObject(id);
    };


    switch (obj.type) {
        case ObjectTypes.GROUP:
            return (
                <>
                    {selectedObjectId === id && selectedHandTool !== HandTools.PAN ?
                        <TransformControls mode={selectedHandTool.toLowerCase()}>
                            <group
                                position={pos}
                                rotation={rot}
                                scale={scl}
                                visible={obj.visible}
                                name={obj.name}
                                userData={{ isLocked: obj.locked }}
                            >
                                {renderChildren()}
                            </group>
                        </TransformControls>
                        :
                        <group
                            position={pos}
                            rotation={rot}
                            scale={scl}
                            visible={obj.visible}
                            name={obj.name}
                            userData={{ isLocked: obj.locked }}
                        >
                            {renderChildren()}
                        </group>
                    }
                </>
            );


        default:
            return null;
    }
}