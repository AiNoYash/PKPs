import { useStore } from "../../context/useStore";
import { ObjectFactory } from "../../_classes/ObjectFactory";
import { GeometryTypes } from "../../_enums/GeometryTypesEnum";
import { CameraTypes } from "../../_enums/CameraTypesEnum";
import { LightTypes } from "../../_enums/LightTypesEnum";

export const emptySpaceMenuItems = [
    {
        label: "Create",
        children: [
            {
                label: "Empty Group",
                action: () => useStore.getState().addRootObject(ObjectFactory.createGroup('New Group'))
            },
            { type: "divider" },
            {
                label: "3D Object",
                children: [
                    { label: "Box", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Box', GeometryTypes.BOX)) },
                    { label: "Capsule", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Capsule', GeometryTypes.CAPSULE)) },
                    { label: "Cone", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Cone', GeometryTypes.CONE)) },
                    { label: "Cylinder", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Cylinder', GeometryTypes.CYLINDER)) },
                    { label: "Sphere", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Sphere', GeometryTypes.SPHERE)) },
                    { label: "Tetrahedron", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Tetrahedron', GeometryTypes.TETRAHEDRON)) },
                    { label: "Torus", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Torus', GeometryTypes.TORUS)) },
                    { label: "TorusKnot", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('TorusKnot', GeometryTypes.TORUS_KNOT)) }
                ]
            },
            {
                label: "2D Object",
                children: [
                    { label: "Circle", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Circle', GeometryTypes.CIRCLE)) },
                    { label: "Plane", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Plane', GeometryTypes.PLANE)) },
                    { label: "Ring", action: () => useStore.getState().addRootObject(ObjectFactory.createGeometricObject('Ring', GeometryTypes.RING)) }
                ]
            },
            { type: "divider" },
            {
                label: "Camera",
                children: [
                    { label: "Perspective", action: () => useStore.getState().addRootObject(ObjectFactory.createCameraObject('Perspective', CameraTypes.PERSPECTIVE)) },
                    { label: "Orthographic", action: () => useStore.getState().addRootObject(ObjectFactory.createCameraObject('Orthographic', CameraTypes.ORTHOGRAPHIC)) }
                ]
            },
            {
                label: "Light",
                children: [
                    { label: "Ambient", action: () => useStore.getState().addRootObject(ObjectFactory.createLightObject('Ambient', LightTypes.AMBIENT)) },
                    { 
                        label: "Directional", 
                        action: () => {
                            const store = useStore.getState();
                            const { baseNode, targetNode } = ObjectFactory.createLightObject('Directional Light', LightTypes.DIRECTIONAL);
                            store.addRootObject(baseNode);
                            store.addChildObject(baseNode.id, targetNode);
                        } 
                    }
                ]
            },
            { type: "divider" },
            { label: "Import Model...", action: () => console.log("Open File Dialog") }
        ]
    }
];

export const objectMenuItems = [
    {
        label: "Create Child",
        children: [
            {
                label: "Empty Group",
                action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGroup('New Group'))
            },
            { type: "divider" },
            {
                label: "3D Object",
                children: [
                    { label: "Box", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Box', GeometryTypes.BOX)) },
                    { label: "Capsule", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Capsule', GeometryTypes.CAPSULE)) },
                    { label: "Cone", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Cone', GeometryTypes.CONE)) },
                    { label: "Cylinder", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Cylinder', GeometryTypes.CYLINDER)) },
                    { label: "Sphere", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Sphere', GeometryTypes.SPHERE)) },
                    { label: "Tetrahedron", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Tetrahedron', GeometryTypes.TETRAHEDRON)) },
                    { label: "Torus", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Torus', GeometryTypes.TORUS)) },
                    { label: "TorusKnot", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('TorusKnot', GeometryTypes.TORUS_KNOT)) }
                ]
            },
            {
                label: "2D Object",
                children: [
                    { label: "Circle", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Circle', GeometryTypes.CIRCLE)) },
                    { label: "Plane", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Plane', GeometryTypes.PLANE)) },
                    { label: "Ring", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createGeometricObject('Ring', GeometryTypes.RING)) }
                ]
            },
            { type: "divider" },
            {
                label: "Camera",
                children: [
                    { label: "Perspective", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createCameraObject('Perspective', CameraTypes.PERSPECTIVE)) },
                    { label: "Orthographic", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createCameraObject('Orthographic', CameraTypes.ORTHOGRAPHIC)) }
                ]
            },
            {
                label: "Light",
                children: [
                    { label: "Ambient", action: () => useStore.getState().addChildObject(useStore.getState().activeMenusObjectId, ObjectFactory.createLightObject('Ambient', LightTypes.AMBIENT)) },
                    { 
                        label: "Directional", 
                        action: () => {
                            const store = useStore.getState();
                            const parentId = store.activeMenusObjectId;
                            const { baseNode, targetNode } = ObjectFactory.createLightObject('Directional Light', LightTypes.DIRECTIONAL);
                            store.addChildObject(parentId, baseNode);
                            store.addChildObject(baseNode.id, targetNode);
                        } 
                    }
                ]
            },
            { type: "divider" },
            { label: "Import Model...", action: () => console.log("Open File Dialog") }
        ]
    },
    { type: "divider" },
    {
        label: "Delete",
        action: () => useStore.getState().deleteObject(useStore.getState().activeMenusObjectId)
    }
];