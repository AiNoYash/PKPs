export const emptySpaceMenuItems = [
    {
        label: "Create",
        children: [
            { label: "Empty Group", action: () => console.log("Create Group in Root") },
            { type: "divider" },
            {
                label: "3D Object",
                children: [
                    { label: "Box", action: () => console.log("Add Box") },
                    { label: "Capsule", action: () => console.log("Add Capsule") },
                    { label: "Cone", action: () => console.log("Add Cone") },
                    { label: "Cylinder", action: () => console.log("Add Cylinder") },
                    { label: "Sphere", action: () => console.log("Add Sphere") },
                    { label: "Tetrahedron", action: () => console.log("Add Tetrahedron") },
                    { label: "Torus", action: () => console.log("Add Torus") },
                    { label: "TorusKnot", action: () => console.log("Add TorusKnot") }
                ]
            },
            {
                label: "2D Object",
                children: [
                    { label: "Circle", action: () => console.log("Add Circle") },
                    { label: "Plane", action: () => console.log("Add Plane") },
                    { label: "Ring", action: () => console.log("Add Ring") }
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
        action: () => {  console.log("Open File Dialog") }
    }
]