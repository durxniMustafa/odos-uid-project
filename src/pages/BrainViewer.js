// src/pages/BrainViewer.js

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function BrainViewer({ file }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!file) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 1, 3);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controlsRef.current = controls;

        // Lighting
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
                model.scale.set(1, 1, 1);
                scene.add(model);
                setIsLoading(false);
                animate();
            },
            undefined,
            (error) => {
                console.error("Error loading model:", error);
                setError("Failed to load the brain model.");
                setIsLoading(false);
            }
        );

        // Handle Resize
        const handleResize = () => {
            if (!mountRef.current || !rendererRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", handleResize);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        // Cleanup
        return () => {
            if (mountRef.current && rendererRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            window.removeEventListener("resize", handleResize);
        };
    }, [file]);

    return (
        <div className="brain-viewer-container">
            {isLoading && <div className="loading-spinner">Loading...</div>}
            <div className="brain-viewer-wrapper" ref={mountRef}></div>
            {error && <div className="brain-viewer-error">{error}</div>}
        </div>
    );
}

export default BrainViewer;
