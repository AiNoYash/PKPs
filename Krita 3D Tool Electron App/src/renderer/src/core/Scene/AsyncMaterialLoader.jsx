import { useState, useEffect, Suspense } from 'react';
import { MaterialTypes } from '../../_enums/MaterialTypesEnum';
import * as THREE from 'three';
import { fetchTextureDataUri } from './MaterialWithTexture';
import { MaterialWithTextures } from './MaterialWithTexture';

export function AsyncMaterialLoader({ obj }) {
    const [resolvedUrls, setResolvedUrls] = useState(null);
    const { materialType, materialProps, textureMaps } = obj.meshData;

    useEffect(() => {
        let isMounted = true;

        const loadTextures = async () => {
            if (!textureMaps) {
                if (isMounted) setResolvedUrls({});
                return;
            }

            // Fetch all base64 strings in parallel
            const urls = {};
            if (textureMaps.map) urls.map = await fetchTextureDataUri(textureMaps.map);
            if (textureMaps.alphaMap) urls.alphaMap = await fetchTextureDataUri(textureMaps.alphaMap);
            if (textureMaps.normalMap) urls.normalMap = await fetchTextureDataUri(textureMaps.normalMap);
            if (textureMaps.roughnessMap) urls.roughnessMap = await fetchTextureDataUri(textureMaps.roughnessMap);
            if (textureMaps.metalnessMap) urls.metalnessMap = await fetchTextureDataUri(textureMaps.metalnessMap);
            if (textureMaps.emissiveMap) urls.emissiveMap = await fetchTextureDataUri(textureMaps.emissiveMap);

            if (isMounted) {
                setResolvedUrls(urls);
            }
        };

        loadTextures();

        return () => {
            isMounted = false; // Cleanup if component unmounts before IPC finishes
        };
    }, [textureMaps]);

    // IPC Krita maps are still loading...
    if (!resolvedUrls) {
        return <meshBasicMaterial color="gray" wireframe />;
    }

    // Check if we actually found any valid URLs to pass to useTexture
    const hasTextures = Object.values(resolvedUrls).some(url => url !== null);

    if (!hasTextures) {
        // Fast path: No valid textures, just render the color/settings
        const props = { ...materialProps, side: THREE[materialProps.side] };
        switch (materialType) {
            case MaterialTypes.BASIC_MATERIAL: return <meshBasicMaterial {...props} />;
            case MaterialTypes.PHYSICAL_MATERIAL: return <meshPhysicalMaterial {...props} />;
            case MaterialTypes.STANDARD_MATERIAL:
            default: return <meshStandardMaterial {...props} />;
        }
    }

    // We have Krita maps! Pass them down.
    return (
        <Suspense fallback={<meshBasicMaterial color="gray" wireframe />}>
            <MaterialWithTextures 
                materialType={materialType} 
                materialProps={materialProps} 
                resolvedUrls={resolvedUrls} 
            />
        </Suspense>
    );
}