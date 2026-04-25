export const MaterialFactory = {
    meshStandardMaterialTemplate: {
        materialProps: {
            color: '#ffffff',
            emissive: '#000000',
            emissiveIntensity: 1,
            roughness: 1,
            metalness: 0,
            transparent: false,
            opacity: 1,
            alphaTest: 0,
            wireframe: false,
            flatShading: false,
            side: 'FrontSide'
        },
        textureMaps: {
            map: null,
            alphaMap: null,
            normalMap: null,
            roughnessMap: null,
            metalnessMap: null,
            emissiveMap: null
        }
    },

    meshBasicMaterialTemplate: {
        materialProps: {
            // 1. Base Color
            color: '#ffffff',

            // 2. Transparency
            transparent: true,
            opacity: 1,
            alphaTest: 0, // Useful for hard-edged cutouts (like pixel art)

            // 3. Rendering
            wireframe: false,
            side: 'DoubleSide' // Crucial so Krita planes don't disappear from behind
        },
        textureMaps: {
            map: null,      // Base image (Your Krita layer export)
            alphaMap: null  // Separate transparency cutout image
        }
    },

    meshPhysicalMaterialTemplate: {
        materialProps: {
            // 1. Base Colors
            color: '#ffffff',
            emissive: '#000000',
            emissiveIntensity: 1,

            // 2. PBR Core
            roughness: 1,
            metalness: 0,

            // 3. Clearcoat (Wet look, varnished wood, car paint)
            clearcoat: 0,
            clearcoatRoughness: 0,

            // 4. Transmission (Solid glass, water, ice)
            transmission: 0,
            ior: 1.5, // 1.33 for water, 1.5 for glass
            thickness: 0,

            // 5. Transparency & Rendering
            transparent: false,
            opacity: 1,
            side: 'FrontSide'
        },
        textureMaps: {
            map: null,          // Base image
            alphaMap: null,     // Cutouts
            normalMap: null,    // Bumps and dents
            roughnessMap: null, // Shiny vs dull areas
            metalnessMap: null  // Metallic areas
        }
    }
}

