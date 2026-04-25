import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from "../context/useStore";
import * as THREE from 'three';
import { useRef } from 'react';

import { SceneOverlay } from './Scene/SceneOverlay';

import { HandTools } from '../_enums/HandToolsEnum';
import { SceneTransformController } from './Scene/SceneTransformController';
import { SceneRenderer } from './Scene/SceneRenderer';
import { Suspense } from 'react';

export function Scene() {

    const selectedHandTool = useStore((state) => state.selectedHandTool);
    const selectHandTool = useStore((state) => state.selectHandTool);

    const orbitRef = useRef(null);

    return (
        <>
            <div className='docker-content-container'>
                <SceneOverlay />
                <Canvas>
                    <color attach="background" args={['#1e1e1e']} />

                    <Grid
                        infiniteGrid={true}
                        cellSize={1}
                        cellThickness={0.5}
                        fadeDistance={10000}
                        sectionColor="#444444" // ? border color
                        cellColor="#222222" // ? color inside of the cell
                        side={THREE.DoubleSide}
                    />

                    <GizmoHelper
                        alignment="top-right"
                        margin={[80, 80]}
                        onTarget={() => orbitRef.current?.target}
                    >
                        <GizmoViewport axisColors={['#C95D5D', '#7EA656', '#4C80B6']} labelColor="#D6D6D6" />
                    </GizmoHelper>

                    <OrbitControls makeDefault
                        ref={orbitRef}
                        mouseButtons={{
                            LEFT: THREE.MOUSE.PAN,     // Left click + drag = Move/Pan
                            MIDDLE: THREE.MOUSE.DOLLY, // Scroll wheel click + drag = Zoom in/out
                            RIGHT: THREE.MOUSE.ROTATE  // Right click (or Ctrl+Click) = Rotate
                        }}
                        enabled={selectedHandTool === HandTools.PAN} // ! This could get overriden by some weird component updating default oribitcontrols' threejs state without chaning react state  
                    />

                    <directionalLight position={[5, 10, 5]} intensity={1} />
                    <ambientLight intensity={0.4} />


                    <Suspense fallback={null}>
                        <SceneRenderer />
                        <SceneTransformController />
                    </Suspense>

                </Canvas>
            </div>
        </>
    );
}