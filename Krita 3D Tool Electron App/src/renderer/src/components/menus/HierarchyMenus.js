import { useStore } from "../../context/useStore";
import { ObjectFactory } from "../../_classes/ObjectFactory";
import { GeometryTypes } from "../../_enums/GeometryTypesEnum";

const state = useStore.getState();

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
                    { label: "Perspective", action: () => console.log("Add Perspective Camera") },
                    { label: "Orthographic", action: () => console.log("Add Orthographic Camera") }
                ]
            },
            {
                label: "Light",
                children: [
                    { label: "Ambient", action: () => console.log("Add Ambient Light") },
                    { label: "Directional", action: () => console.log("Add Directional Light") },
                    { label: "Point", action: () => console.log("Add Point Light") }
                ]
            },
            { type: "divider" },
            { label: "Import Model...", action: () => console.log("Open File Dialog") }
        ]
    }
];


export const objectMenuItems = [
    ...emptySpaceMenuItems,
    {
        label: "Delete",
        action: () => { console.log("Open File Dialog") }
    }
];