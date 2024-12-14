// src/components/BrainViewer.js

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function BrainViewer({ file }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const [error, setError] = useState(null);

    // State to manage full-screen mode
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Reference to initial camera position for reset
    const initialCameraPosition = useRef({ x: 0, y: 1, z: 3 });

    useEffect(() => {
        if (!file) return;

        // Initialize Scene
        const scene = new THREE.Scene();

        // Initialize Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(
            initialCameraPosition.current.x,
            initialCameraPosition.current.y,
            initialCameraPosition.current.z
        );

        // Initialize Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controlsRef.current = controls;

        // Within the useEffect hook in BrainViewer.js

        // Add additional lights for better visualization
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);


        // Load GLTF Model
        const loader = new GLTFLoader();
        loader.load(
            file,
            (gltf) => {
                const model = gltf.scene;
                // Optional: Scale and position the model
                model.scale.set(1, 1, 1);
                scene.add(model);
                animate();
            },
            undefined,
            (error) => {
                console.error("An error occurred while loading the model:", error);
                setError("Failed to load the brain model.");
            }
        );


        // Handle Window Resize
        const handleResize = () => {
            if (!mountRef.current || !rendererRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", handleResize);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        // Cleanup on Unmount
        return () => {
            if (mountRef.current && rendererRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            window.removeEventListener("resize", handleResize);
        };
    }, [file]);

    // Function to toggle full-screen mode
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            mountRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    // Listen for full-screen change to update state
    useEffect(() => {
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullScreen(false);
            }
        };
        document.addEventListener("fullscreenchange", handleFullScreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullScreenChange);
        };
    }, []);

    // Function to reset the camera view
    const resetView = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    if (error) {
        return <div className="brain-viewer-error">{error}</div>;
    }

    return (
        <div className="brain-viewer-container">
            <div className="brain-viewer-wrapper" ref={mountRef}></div>
            {/* Control Buttons */}
            <div className="brain-viewer-controls">
                <button className="reset-button" onClick={resetView}>
                    Reset View
                </button>
                <button className="fullscreen-button" onClick={toggleFullScreen}>
                    {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                </button>
            </div>
        </div>
    );
}

export default BrainViewer;
