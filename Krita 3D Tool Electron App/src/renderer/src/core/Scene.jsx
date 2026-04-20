import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useStore } from "../context/useStore";
import * as THREE from 'three';



export function Scene() {
    return (
        <>
            <div>
                <Canvas>
                    <color attach="background" args={['#1e1e1e']} />
                    <ambientLight intensity={0.4} />

                    <OrbitControls makeDefault />
                    <Grid
                        infiniteGrid
                        fadeDistance={50}
                        sectionColor="#444444"
                        cellColor="#222222"
                    />
                </Canvas>
            </div>
        </>
    );
}