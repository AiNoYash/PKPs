import { useStore } from "../../context/useStore";
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