import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from "../context/useStore";
import * as THREE from 'three';
import { useRef, Suspense, useEffect } from 'react';

import { SceneOverlay } from './Scene/SceneOverlay';
import { HandTools } from '../_enums/HandToolsEnum';
import { SceneTransformController } from './Scene/SceneTransformController';
import { SceneRenderer } from './Scene/SceneRenderer';

// function to match res in krita and app
function KritaHighResExporter() {
    const { gl, scene, camera } = useThree();

    useEffect(() => {
        window.captureKritaSnapshot = async () => {
            console.log("Fetching Krita resolution...");
            try {
                const res = await fetch('http://127.0.0.1:5000/resolution');
                const { width, height } = await res.json();
                
                console.log(`Krita resolution is ${width}x${height}. Resizing WebGL buffer...`);

                const originalWidth = gl.domElement.width;
                const originalHeight = gl.domElement.height;
                const originalPixelRatio = gl.getPixelRatio();

                gl.setPixelRatio(1);
                gl.setSize(width, height, false);
                
                gl.render(scene, camera);
                const dataUrl = gl.domElement.toDataURL('image/png');

                gl.setPixelRatio(originalPixelRatio);
                gl.setSize(originalWidth, originalHeight, false);

                console.log("Sending high-res snapshot to Krita...");

                const response = await fetch('http://127.0.0.1:5000/snapshot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: dataUrl })
                });

                if (response.ok) {
                    console.log("Snapshot sent successfully!");
                }
            } catch (err) {
                alert("Failed to connect to Krita! Is the Python plugin running?");
                console.error(err);
            }
        };
    }, [gl, scene, camera]);

    return null; // This component doesn't render anything visible
}

export function Scene() {
    const selectedHandTool = useStore((state) => (state.selectedHandTool));
    const orbitRef = useRef(null);

    return (
        <div className='docker-content-container' style={{ position: 'relative' }}>
            
            <div style={{ position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <SceneOverlay />
                </div>

                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Trigger the global capture function attached by the Canvas
                        if (window.captureKritaSnapshot) {
                            window.captureKritaSnapshot();
                        }
                    }} 
                    style={{ 
                        position: 'absolute', bottom: '20px', right: '20px', 
                        pointerEvents: 'auto', padding: '12px 20px',
                        backgroundColor: '#C95D5D', color: 'white',
                        border: 'none', borderRadius: '4px',
                        cursor: 'pointer', fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                    }}
                >
                    Send Snapshot to Krita
                </button>
            </div>

            <Canvas gl={{ preserveDrawingBuffer: true }}>
                
                <KritaHighResExporter />

                <color attach="background" args={['#1e1e1e']} />

                <Grid
                    infiniteGrid={true} cellSize={1} cellThickness={0.5}
                    fadeDistance={10000} sectionColor="#444444" cellColor="#222222" 
                    side={THREE.DoubleSide}
                />

                <GizmoHelper alignment="top-right" margin={[80, 80]} onTarget={() => orbitRef.current?.target}>
                    <GizmoViewport axisColors={['#C95D5D', '#7EA656', '#4C80B6']} labelColor="#D6D6D6" />
                </GizmoHelper>

                <OrbitControls makeDefault ref={orbitRef}
                    mouseButtons={{
                        LEFT: THREE.MOUSE.PAN,     
                        MIDDLE: THREE.MOUSE.DOLLY, 
                        RIGHT: THREE.MOUSE.ROTATE  
                    }}
                    enabled={selectedHandTool === HandTools.PAN} 
                />

                <directionalLight position={[5, 10, 5]} intensity={1} />
                <ambientLight intensity={0.4} />

                <Suspense fallback={null}>
                    <SceneRenderer />
                    <SceneTransformController />
                </Suspense>
            </Canvas>
        </div>
    );
}