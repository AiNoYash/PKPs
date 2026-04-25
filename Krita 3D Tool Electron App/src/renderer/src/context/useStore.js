import { create } from 'zustand';
import { HandTools } from '../_enums/HandToolsEnum';
import { ObjectTypes } from '../_enums/ObjectTypesEnum';

export const useStore = create((set) => ({

    selectedHandTool: HandTools.PAN,
    selectHandTool: (handTool) => { set({ selectedHandTool: handTool }); },



    selectedObjectId: null,
    selectObject: (id) => set({ selectedObjectId: id }),
    
    rootObjectIds: ['1', '2'],

    objects: {
        '1': {
            id: '1',
            name: 'Main container',
            type: ObjectTypes.GROUP,
            visible: true,
            locked: false,
            parentId: null,
            childrenIds: [],
            transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            },
        },

        '2': {
            id: '2',
            name: 'group 2',
            type: ObjectTypes.GROUP,
            visible: true,
            locked: false,
            parentId: null,
            childrenIds: [],
            transform: {
                position: { x: 5, y: 10, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            },
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