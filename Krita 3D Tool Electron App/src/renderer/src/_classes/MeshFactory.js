import { MaterialFactory } from "./MaterialFactory";
import { MaterialTypes } from "../_enums/MaterialTypesEnum";


const getDefaultArgsForGeometry = (type) => {
    switch (type) {
        case GeometryTypes.BOX: return [1, 1, 1]; // width, height, depth
        case GeometryTypes.SPHERE: return [1, 32, 16]; // radius, widthSegments, heightSegments
        case GeometryTypes.PLANE: return [1, 1]; // width, height
        case GeometryTypes.CYLINDER: return [1, 1, 1, 32]; // radiusTop, radiusBottom, height, radialSegments
        case GeometryTypes.CONE: return [1, 1, 32]; // radius, height, radialSegments
        case GeometryTypes.TORUS: return [1, 0.4, 16, 50]; // radius, tube, radialSegments, tubularSegments
        case GeometryTypes.CAPSULE: return [1, 1, 4, 16]; // radius, length, capSegments, radialSegments
        case GeometryTypes.CIRCLE: return [1, 32]; // radius, segments
        case GeometryTypes.RING: return [0.5, 1, 32]; // innerRadius, outerRadius, thetaSegments
        case GeometryTypes.TETRAHEDRON: return [1, 0]; // radius, detail
        case GeometryTypes.TORUS_KNOT: return [1, 0.3, 64, 16]; // radius, tube, tubularSegments, radialSegments

        default: {
            console.error("Not matching any geometry type > MeshFactory.js > getDefaultArgsForGeometry");
            return null;
        }
    }
};


export const generateMeshData = (geometryType) => {

    return {
        geometryType: geometryType,
        geometryArgs: getDefaultArgsForGeometry(geometryType),
        materialType: MaterialTypes.STANDARD_MATERIAL,
        materialProps: { ...MaterialFactory.meshStandardMaterialTemplate.materialProps },
        textureMaps: { ...MaterialFactory.meshStandardMaterialTemplate.textureMaps }
    };
};