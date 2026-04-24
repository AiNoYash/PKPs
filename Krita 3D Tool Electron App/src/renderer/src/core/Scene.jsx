import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useStore } from "../context/useStore";
import * as THREE from 'three';



export function Scene() {
    return (
        <>
            <div className='docker-content-container'>
                <Canvas>
                    <color attach="background" args={['#1e1e1e']} />

                    <ambientLight intensity={0.4} />
                    <directionalLight position={[5, 10, 5]} intensity={1} />


                    <OrbitControls makeDefault />
                    <Grid
                        infiniteGrid={true}
                        cellSize={1}
                        cellThickness={0.5}
                        fadeDistance={10000}
                        sectionColor="#444444" // ? border color
                        cellColor="#222222" // ? color inside of the cell
                        side={THREE.DoubleSide}
                    />


                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial color="mediumpurple" />
                    </mesh>

                </Canvas>
            </div>
        </>
    );
}