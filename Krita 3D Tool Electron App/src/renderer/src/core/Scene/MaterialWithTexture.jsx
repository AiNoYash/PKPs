import { useTexture } from '@react-three/drei';
import { MaterialTypes } from '../../_enums/MaterialTypesEnum';
import * as THREE from 'three';


const textureBase64Map = {};

export const fetchTextureDataUri = async (path) => {
    if (!path) return null;
    
    // Return cached promise/string if it exists to prevent duplicate IPC calls
    if (textureBase64Map[path]) {
        return textureBase64Map[path];
    }
    
    const response = await window.Project.invoke("asset:getBase64", path);
    if (!response || !response.base64) return null;

    // Safely check if the prefix is already there to avoid doubling it up
    if (response.base64.startsWith('data:image')) {
        textureBase64Map[path] = response.base64;
    } else {
        // Fallback just in case some textures come through raw
        textureBase64Map[path] = `data:image/png;base64,${response.base64}`;
    }
    return textureBase64Map[path];
};



export function MaterialWithTextures({ materialType, materialProps, resolvedUrls }) {
    // Strip out null values so useTexture doesn't crash on invalid paths
    const validUrls = Object.fromEntries(
        Object.entries(resolvedUrls).filter(([_, url]) => url != null)
    );

    // useTexture handles the heavy lifting of converting data URIs to THREE.Texture
    const loadedTextures = useTexture(validUrls);

    const props = { 
        ...materialProps, 
        side: THREE[materialProps.side],
        ...loadedTextures 
    };

    switch (materialType) {
        case MaterialTypes.BASIC_MATERIAL: return <meshBasicMaterial {...props} />;
        case MaterialTypes.PHYSICAL_MATERIAL: return <meshPhysicalMaterial {...props} />;
        case MaterialTypes.STANDARD_MATERIAL:
        default: return <meshStandardMaterial {...props} />;
    }
}