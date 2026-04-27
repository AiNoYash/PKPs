import { create } from 'zustand';
import { HandTools } from '../_enums/HandToolsEnum';
import { ObjectTypes } from '../_enums/ObjectTypesEnum';
import { GeometryTypes } from '../_enums/GeometryTypesEnum';
import { MaterialTypes } from '../_enums/MaterialTypesEnum';

export const useStore = create((set) => ({

    activeMenu: null,
    setActiveMenu: (newActiveMenu) => { set({ activeMenu: newActiveMenu }) },

    activeMenusObjectId: null,
    setActiveMenusObjectId: (newActiveMenusObjectId) => { set({ activeMenusObjectId: newActiveMenusObjectId }) },

    activeProjectPath: null,
    setActiveProjectPath: (path) => { set({ activeProjectPath: path }) },

    selectedHandTool: HandTools.PAN,
    selectHandTool: (handTool) => { set({ selectedHandTool: handTool }); },

    activeSceneName: "New Scene",
    setActiveSceneName: (newSceneName) => { set({ activeSceneName: newSceneName }) },

    // ! uhhh name of setter and prop are not same uh noooooo!!
    selectedObjectId: null,
    selectObject: (id) => set({ selectedObjectId: id }),

    selectedInspectorObjectId: null,
    selectInspectorObject: (id) => set({ selectedInspectorObjectId: id }),

    rootObjectIds: ['character-base-group', 'ground-plane'],

    objects: {
        'character-base-group': {
            id: 'character-base-group',
            name: 'Hero Character Base',
            type: ObjectTypes.GROUP,
            visible: true,
            locked: false,
            parentId: null,
            childrenIds: ['head-box', 'torso-sphere'],
            transform: {
                position: { x: 0, y: 2, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            }
        },

        'head-box': {
            id: 'head-box',
            name: 'Head Marker',
            type: ObjectTypes.THREE_D,
            visible: true,
            locked: false,
            parentId: 'character-base-group',
            childrenIds: [],
            transform: {
                position: { x: 0, y: 1.5, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            },
            meshData: {
                geometryType: GeometryTypes.BOX,
                geometryArgs: [1, 1, 1],
                materialType: MaterialTypes.STANDARD_MATERIAL,
                materialProps: { color: '#ffccaa', side: 'FrontSide' }
            }
        },

        'torso-sphere': {
            id: 'torso-sphere',
            name: 'Torso',
            type: ObjectTypes.THREE_D,
            visible: true,
            locked: false,
            parentId: 'character-base-group',
            childrenIds: [],
            transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1.5, z: 1 }
            },
            meshData: {
                geometryType: GeometryTypes.SPHERE,
                geometryArgs: [1, 32, 16],
                materialType: MaterialTypes.STANDARD_MATERIAL,
                materialProps: { color: '#4C80B6', side: 'FrontSide' }
            }
        },

        'ground-plane': {
            id: 'ground-plane',
            name: 'Ground Reference',
            type: ObjectTypes.THREE_D,
            visible: true,
            locked: true,
            parentId: null,
            childrenIds: [],
            transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: -Math.PI / 2, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            },
            meshData: {
                geometryType: GeometryTypes.PLANE,
                geometryArgs: [10, 10],
                materialType: MaterialTypes.STANDARD_MATERIAL,
                materialProps: { color: '#333333', side: 'DoubleSide' }
            }
        }
    },

    updateTransform: (id, partialTransform) => set((state) => {
        const obj = state.objects[id];
        if (!obj) return state;

        return {
            objects: {
                ...state.objects,
                [id]: {
                    ...obj,
                    transform: {
                        ...obj.transform,

                        ...(partialTransform.position && { position: { ...obj.transform.position, ...partialTransform.position } }),
                        ...(partialTransform.rotation && { rotation: { ...obj.transform.rotation, ...partialTransform.rotation } }),
                        ...(partialTransform.scale && { scale: { ...obj.transform.scale, ...partialTransform.scale } })
                    }
                }
            }
        };
    }),


    addRootObject: (newObj) => set((state) => ({
        rootObjectIds: [...state.rootObjectIds, newObj.id],
        objects: { ...state.objects, [newObj.id]: newObj }
    })),

    addChildObject: (parentId, newObj) => set((state) => {
        const parent = state.objects[parentId];

        if (!parent) {
            console.warn(`Parent object with ID ${parentId} not found.`);
            return state;
        }

        const childToAdd = {
            ...newObj,
            parentId: parentId
        };

        return {
            objects: {
                ...state.objects,
                [newObj.id]: childToAdd,
                [parentId]: {
                    ...parent,
                    childrenIds: [...(parent.childrenIds || []), newObj.id]
                }
            }
        };
    }),

    deleteObject: (idToDelete) => set((state) => {
        const objToDelete = state.objects[idToDelete];
        if (!objToDelete) return state;

        const idsToDelete = new Set([idToDelete]);

        const collectDescendants = (id) => {
            const obj = state.objects[id];
            if (obj && obj.childrenIds) {
                obj.childrenIds.forEach(childId => {
                    idsToDelete.add(childId);
                    collectDescendants(childId);
                });
            }
        };

        collectDescendants(idToDelete);

        // 2. Create a new objects map and delete the gathered IDs
        const newObjects = { ...state.objects };
        idsToDelete.forEach(id => {
            delete newObjects[id];
        });

        // 3. If it had a parent, remove this ID from the parent's childrenIds array
        if (objToDelete.parentId && newObjects[objToDelete.parentId]) {
            newObjects[objToDelete.parentId] = {
                ...newObjects[objToDelete.parentId],
                childrenIds: newObjects[objToDelete.parentId].childrenIds.filter(childId => childId !== idToDelete)
            };
        }

        // 4. If it was a root object, remove it from the rootObjectIds array
        const newRootObjectIds = objToDelete.parentId === null
            ? state.rootObjectIds.filter(rootId => rootId !== idToDelete)
            : state.rootObjectIds;

        // 5. Deselect if the currently selected or active menu object was deleted
        const newSelectedObjectId = idsToDelete.has(state.selectedObjectId) ? null : state.selectedObjectId;
        const newActiveMenusObjectId = idsToDelete.has(state.activeMenusObjectId) ? null : state.activeMenusObjectId;

        return {
            objects: newObjects,
            rootObjectIds: newRootObjectIds,
            selectedObjectId: newSelectedObjectId,
            activeMenusObjectId: newActiveMenusObjectId
        };
    }),

    toggleVisibility: (id) => set((state) => {
        const obj = state.objects[id];
        if (!obj) return state;
        return {
            objects: {
                ...state.objects,
                [id]: { ...obj, visible: !obj.visible }
            },
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        };
    }),

    toggleLock: (id) => set((state) => {
        const obj = state.objects[id];
        if (!obj) return state;

        return {
            objects: {
                ...state.objects,
                [id]: { ...obj, locked: !obj.locked }
            },
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        };
    }),

    setAllVisibility: (visible) => set((state) => {
        const newObjects = {};
        for (const key in state.objects) {
            newObjects[key] = { ...state.objects[key], visible };
        }
        return {
            objects: newObjects,
            selectedObjectId: null
        };
    }),

    setAllLock: (locked) => set((state) => {
        const newObjects = {};
        for (const key in state.objects) {
            newObjects[key] = { ...state.objects[key], locked };
        }
        return {
            objects: newObjects,
            selectedObjectId: null
        };
    }),

    updateCameraData: (id, partialCameraData) => set((state) => {
        const obj = state.objects[id];
        if (!obj || !obj.cameraData) return state;

        return {
            objects: {
                ...state.objects,
                [id]: {
                    ...obj,
                    cameraData: {
                        ...obj.cameraData,
                        ...partialCameraData
                    }
                }
            }
        };
    }),


    updateLightData: (id, partialLightData) => set((state) => {
        const obj = state.objects[id];
        if (!obj || !obj.lightData) return state;

        return {
            objects: {
                ...state.objects,
                [id]: {
                    ...obj,
                    lightData: {
                        ...obj.lightData,
                        ...partialLightData
                    }
                }
            }
        };
    }),


    sKritaConnected: false,
    setKritaConnected: (isConnected) => set({ isKritaConnected: isConnected }),

    isExportingToKrita: false,
    setExportingToKrita: (isExporting) => set({ isExportingToKrita: isExporting }),

    kritaLayers: [],
    setKritaLayers: (layers) => set({ kritaLayers: layers }),
}));

export const transformControlRef = { current: null };