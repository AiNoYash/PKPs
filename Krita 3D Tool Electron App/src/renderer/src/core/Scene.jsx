import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useStore } from "../context/useStore";
import * as THREE from 'three';
import { useRef, Suspense, useEffect } from 'react';

import { OrthographicCamera } from '@react-three/drei';

import { SceneOverlay } from './Scene/SceneOverlay';
import { HandTools } from '../_enums/HandToolsEnum';
import { SceneTransformController } from './Scene/SceneTransformController';
import { SceneRenderer } from './Scene/SceneRenderer';
import './Scene/SceneOverlay.css';

// function to match res between krita canvas and three.js sene
function KritaHighResExporter() {
    const { gl, scene, camera } = useThree();

    const isExportingToKrita = useStore((state) => state.isExportingToKrita);
    const setExportingToKrita = useStore((state) => state.setExportingToKrita);
    const setKritaConnected = useStore((state) => state.setKritaConnected);

    useEffect(() => {
        const captureAndSend = async () => {
            if (!isExportingToKrita) return;

            console.log("Fetching Krita resolution via IPC...");
            try {
                // get res from krita
                const resolution = await window.kritaAPI.getResolution();
                
                // If it returns null, Krita was closed after we connected!
                if (!resolution) {
                    throw new Error("Connection lost");
                }

                const { width, height } = resolution;

                const originalWidth = gl.domElement.width;
                const originalHeight = gl.domElement.height;
                const originalPixelRatio = gl.getPixelRatio();

                // resize WebGL drawing buffer to match Krita precisely
                gl.setPixelRatio(1);
                gl.setSize(width, height, false);

                // force a high-res render and extract base64 PNG
                gl.render(scene, camera);
                const dataUrl = gl.domElement.toDataURL('image/png');

                // shrink back to normal UI size
                gl.setPixelRatio(originalPixelRatio);
                gl.setSize(originalWidth, originalHeight, false);

                console.log("Sending high-res snapshot via IPC...");

                // send payload 
                const success = await window.kritaAPI.sendSnapshot(dataUrl);

                if (success) {
                    console.log("Snapshot successfully injected into Krita!");
                } else {
                    throw new Error("Send failed");
                }
            } catch (err) {
                console.error("Export pipeline failed:", err);
                alert("Connection to Krita lost! Please ensure Krita and the plugin are running.");
                // Revert the UI state back to the red "Connect" button
                setKritaConnected(false); 
            } finally {
                // reset the Zustand trigger so we can fire it again later
                setExportingToKrita(false);
            }
        };

        captureAndSend();
    }, [isExportingToKrita, gl, scene, camera, setExportingToKrita, setKritaConnected]);

    return null;
}

export function Scene() {
    const selectedHandTool = useStore((state) => state.selectedHandTool);
    const isExportingToKrita = useStore((state) => state.isExportingToKrita);
    const setExportingToKrita = useStore((state) => state.setExportingToKrita);
    const isKritaConnected = useStore((state) => state.isKritaConnected);
    const setKritaConnected = useStore((state) => state.setKritaConnected);
    
    const orbitRef = useRef(null);

    // Manual connection check for the smart button
    const connectToKrita = async () => {
        const connected = await window.kritaAPI.checkConnection();
        if (connected) {
            setKritaConnected(true);
        } else {
            alert("Could not connect to Krita. Is the application open and the plugin running?");
        }
    };

    return (
        <div className='docker-content-container' style={{ position: 'relative' }}>

            <div style={{ position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <SceneOverlay />
                </div>

                <button
                    className={isKritaConnected ? "krita-export-btn" : "krita-connect-btn"}
                    disabled={isExportingToKrita}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isKritaConnected) {
                            connectToKrita();
                        } else {
                            setExportingToKrita(true);
                        }
                    }}
                >
                    {!isKritaConnected 
                        ? "Connect to Krita" 
                        : (isExportingToKrita ? "Sending..." : "Send Snapshot to Krita")
                    }
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
                    enabled={true}
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