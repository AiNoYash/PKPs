const tempObj = {
    id: 'primitive-123',
    name: 'Cube 1',
    type: ObjectTypes.THREE_D, // From your enum
    visible: true,
    locked: false,
    parentId: null,
    childrenIds: [],
    transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
    },
    // ---- NEW MESH SPECIFIC PROPERTIES ----
    meshData: {
        geometryType: 'Box',       // 'Box', 'Sphere', 'Plane', 'Cylinder', etc.
        geometryArgs: [1, 1, 1],   // The args passed to the geometry (width, height, depth)
        materialType: 'Standard',  // 'Standard', 'Basic', etc.
        materialProps: {           // The JSON properties for the material
            color: '#ffffff',
            wireframe: false,
            opacity: 1,
            transparent: false
        }
    }
}