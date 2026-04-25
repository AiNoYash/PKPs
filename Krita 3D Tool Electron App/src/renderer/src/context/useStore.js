import { create } from 'zustand';
import { HandTools } from '../_enums/HandToolsEnum';
import { ObjectTypes } from '../_enums/ObjectTypesEnum';
import { GeometryTypes } from '../_enums/GeometryTypesEnum';
import { MaterialTypes } from '../_enums/MaterialTypesEnum';

export const useStore = create((set) => ({

    selectedHandTool: HandTools.PAN,
    selectHandTool: (handTool) => { set({ selectedHandTool: handTool }); },



    selectedObjectId: null,
    selectObject: (id) => set({ selectedObjectId: id }),

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




    toggleVisibility: (id) => set((state) => {
        const obj = state.objects[id];
        if (!obj) return state;
        return {
            objects: {
                ...state.objects,
                [id]: { ...obj, visible: !obj.visible }
            }
        };
    }),

    toggleLock: (id) => set((state) => {
        const obj = state.objects[id];
        if (!obj) return state;
        return {
            objects: {
                ...state.objects,
                [id]: { ...obj, locked: !obj.locked }
            }
        };
    }),
}));