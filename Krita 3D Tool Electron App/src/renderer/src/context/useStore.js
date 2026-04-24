import { create } from 'zustand';

export const useStore = create((set) => ({

    selectedObjectId: null,
    rootObjectIds: ['obj-krita-plane', 'obj-light-1'],

    objects: {
        'obj-krita-plane': {
            id: 'obj-krita-plane',
            name: 'Krita Layer Sync',
            type: 'krita-image',
            parentId: null,
            childrenIds: [],
            transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            },
        },

        'obj-light-1': {
            id: 'obj-light-1',
            name: 'Directional Light',
            type: 'light',
            parentId: null,
            childrenIds: [],
            transform: {
                position: { x: 5, y: 10, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            },
        }
    },

    selectObject: (id) => set({ selectedObjectId: id }),

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


    addObject: (newObj) => set((state) => ({
        rootObjectIds: [...state.rootObjectIds, newObj.id],
        objects: { ...state.objects, [newObj.id]: newObj }
    }))
}));