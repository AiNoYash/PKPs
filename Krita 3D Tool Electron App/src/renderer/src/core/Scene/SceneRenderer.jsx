import { useStore } from "zustand";
import { SceneNode } from "./SceneNode";


export function SceneRenderer() {
    const rootObjectIds = useStore((state) => state.rootObjectIds);

    const renderChildren = () => {
        return rootObjectIds.map((rootObjectId) => (
            <SceneNode key={rootObjectId} id={rootObjectId} />
        ));
    };

    return (
        <>
            {renderChildren()}
        </>
    );
}