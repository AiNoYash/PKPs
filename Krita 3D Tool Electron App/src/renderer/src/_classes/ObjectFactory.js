import { GeometryTypes } from "../_enums/GeometryTypesEnum";
import { ObjectTypes } from "../_enums/ObjectTypesEnum";
import { generateMeshData } from "./MeshFactory";

const generateBaseNode = (name, type, parentId = null) => ({
    id: `${type.toLowerCase()}-${Date.now()}`,
    name: name,
    type: type,
    visible: true,
    locked: false,
    parentId: parentId,
    childrenIds: [],
    transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
});



export const ObjectFactory = {
    createGroup: (name = 'New Group', parentId = null) => {
        return generateBaseNode(name, ObjectTypes.GROUP, parentId);
    },

    createGeometricObject: (name = 'New Object', geometryType, parentId = null) => {
        const baseNode = generateBaseNode(name, ObjectTypes.THREE_D, parentId);
        baseNode.meshData = generateMeshData(geometryType);
        return baseNode;
    }
};