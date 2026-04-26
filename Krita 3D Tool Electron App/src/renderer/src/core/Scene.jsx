import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from "../context/useStore";
import * as THREE from 'three';
import { useRef, Suspense } from 'react';

import { SceneOverlay } from './Scene/SceneOverlay';
import { HandTools } from '../_enums/HandToolsEnum';
import { SceneTransformController } from './Scene/SceneTransformController';
import { SceneRenderer } from './Scene/SceneRenderer';

export function Scene() {

    const selectedHandTool = useStore((state) => (state.selectedHandTool));
    const orbitRef = useRef(null);

    const sendSnapshot = async () => {
        console.log("Button clicked! Capturing canvas...");
        
        // 1. Find Canvas
        const canvasElement = document.querySelector('canvas');
        if (!canvasElement) {
            alert("Error: Canvas element not found in the DOM!");
            return;
        }

        // 2. Get Data URL
        const dataUrl = canvasElement.toDataURL('image/png');
        console.log("Canvas data extracted. First 50 chars:", dataUrl.substring(0, 50));

        // 3. Send to Python Server
        try {
            const response = await fetch('http://127.0.0.1:5000/snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl })
            });
            
            if (response.ok) {
                console.log("Snapshot sent to Krita successfully!");
                // alert("Sent to Krita successfully!"); // Uncomment if you want an alert on success
            } else {
                alert("Server responded with an error: " + response.status);
            }
        } catch (err) {
            console.error("Fetch failed.", err);
            alert("Failed to connect to Krita! Is the Python plugin running and listening on port 5000?");
        }
    };

    return (
        <div className='docker-content-container' style={{ position: 'relative' }}>
            
            {/* --- ISOLATED UI LAYER --- */}
            {/* pointerEvents: 'none' ensures the invisible parts of this div don't block the 3D Canvas */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
                
                {/* Re-enable pointer events for the overlay */}
                <div style={{ pointerEvents: 'auto' }}>
                    <SceneOverlay />
                </div>

                {/* The brute-force button */}
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        sendSnapshot();
                    }} 
                    style={{ 
                        position: 'absolute', 
                        bottom: '20px', 
                        right: '20px', 
                        pointerEvents: 'auto', // ! Forces it to be clickable
                        padding: '12px 20px',
                        backgroundColor: '#C95D5D', // Made it red so you know this version loaded
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                    }}
                >
                    Send to Krita
                </button>
            </div>

            {/* --- CANVAS LAYER --- */}
            {/* gl={{ preserveDrawingBuffer: true }} is required to not get a black screen */}
            <Canvas gl={{ preserveDrawingBuffer: true }}>
                <color attach="background" args={['#1e1e1e']} />

                <Grid
                    infiniteGrid={true}
                    cellSize={1}
                    cellThickness={0.5}
                    fadeDistance={10000}
                    sectionColor="#444444" 
                    cellColor="#222222" 
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