import { CameraTypes } from "../_enums/CameraTypesEnum";
import { GeometryTypes } from "../_enums/GeometryTypesEnum";
import { LightTypes } from "../_enums/LightTypesEnum";
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

const generateCamera = (cameraType) => {

    const defaultCameraData = {
        far: 2000,
        near: 0.1,
        zoom: 1,
        manual: false,
        aspect: null,
    };

    if (cameraType === CameraTypes.ORTHOGRAPHIC) {
        return {
            cameraType: CameraTypes.ORTHOGRAPHIC,
            frustumSize: 10,
            ...defaultCameraData,
        };
    }
    else if (cameraType === CameraTypes.PERSPECTIVE) {
        return {
            cameraType: CameraTypes.PERSPECTIVE,
            fov: 50,
            ...defaultCameraData
        };
    }
}

function generateLight(lightType) {
    const baseLight = {
        lightType: lightType,
        color: "#ffffff",
        intensity: 1,
    }

    if (lightType === LightTypes.DIRECTIONAL) {
        baseLight.castShadow = true;
        baseLight.targetId = null;
    }
    return baseLight;
}

export const ObjectFactory = {
    createGroup: (name = 'New Group', parentId = null) => {
        return generateBaseNode(name, ObjectTypes.GROUP, parentId);
    },

    createGeometricObject: (name = 'New Object', geometryType, parentId = null) => {
        const baseNode = generateBaseNode(name, ObjectTypes.THREE_D, parentId);
        baseNode.meshData = generateMeshData(geometryType);
        return baseNode;
    },

    createCameraObject: (name = 'New Camera', cameraType, parentId = null) => {
        let baseNode = generateBaseNode(name, ObjectTypes.CAMERA, parentId);
        baseNode.cameraData = generateCamera(cameraType);

        return baseNode;
    },


    createLightObject: (name = 'Directional Light', lightType, parentId = null) => {
        const baseNode = generateBaseNode(name, ObjectTypes.LIGHT, parentId);
        baseNode.lightData = generateLight(lightType);


        // ? if a light is a directional light then we return both a target node and light node but remember the target node is not yet child of light
        if (lightType === LightTypes.DIRECTIONAL) {
            const targetNode = generateBaseNode("Target", ObjectTypes.GROUP, null);
            return { baseNode, targetNode };
        }


        // ? This is for ambient light
        return baseNode;
    }
};