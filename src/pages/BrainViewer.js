// src/pages/BrainViewer.js
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FaRedo, FaCube, FaCamera, FaRulerCombined, FaArrowsAlt, FaMagic, FaVolumeUp, FaAdjust, FaInfoCircle, FaAlignCenter } from "react-icons/fa";
import "../styles/BrainViewer.css";

function BrainViewer({ file }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const modelRef = useRef(null);
    const cameraRef = useRef(null);

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWireframe, setIsWireframe] = useState(false);
    const [notification, setNotification] = useState(null);
    const [analysisMode, setAnalysisMode] = useState(false);
    const [rotationAngle, setRotationAngle] = useState(0);
    const [arMode, setArMode] = useState(false);
    const [envBright, setEnvBright] = useState(true);
    const [fullScreen, setFullScreen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2000);
    };

    useEffect(() => {
        if (!file) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            60,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 1.5, 3);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.target.set(0, 0.5, 0);
        controlsRef.current = controls;

        const ambientLight = new THREE.AmbientLight(0xffffff, envBright ? 1.0 : 0.3);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, envBright ? 0.4 : 0.1);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        const loader = new GLTFLoader();
        loader.load(
            file,
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);
                modelRef.current = model;
                setIsLoading(false);
                animate();
            },
            undefined,
            (err) => {
                console.error("Error loading model:", err);
                setError("Failed to load the brain model.");
                setIsLoading(false);
            }
        );

        const handleResize = () => {
            if (!mountRef.current || !rendererRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", handleResize);

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        return () => {
            if (mountRef.current && rendererRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            window.removeEventListener("resize", handleResize);
        };
    }, [file, envBright]);

    const resetView = () => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(0, 1.5, 3);
        controlsRef.current.target.set(0, 0.5, 0);
        controlsRef.current.update();
        showNotification("View reset");
    };

    const toggleWireframe = () => {
        if (!modelRef.current) return;
        modelRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.wireframe = !child.material.wireframe;
            }
        });
        setIsWireframe((prev) => !prev);
        showNotification(isWireframe ? "Solid mode" : "Wireframe mode");
    };

    const takeScreenshot = () => {
        showNotification("Screenshot captured (simulated)");
    };

    const toggleAnalysis = () => {
        setAnalysisMode((prev) => !prev);
        showNotification(!analysisMode ? "Analysis mode on" : "Analysis mode off");
    };

    const rotateModel = () => {
        if (!modelRef.current) return;
        setRotationAngle((prev) => prev + 90);
        const rad = (rotationAngle + 90) * (Math.PI / 180);
        modelRef.current.rotation.y = rad;
        showNotification("Model rotated 90°");
    };

    const toggleAR = () => {
        setArMode((prev) => !prev);
        showNotification(!arMode ? "AR Mode Activated" : "AR Mode Deactivated");
    };

    const toggleEnv = () => {
        setEnvBright((prev) => !prev);
        showNotification(envBright ? "Dim Environment" : "Bright Environment");
    };

    const toggleFullScreen = () => {
        setFullScreen((prev) => !prev);
        showNotification(!fullScreen ? "Full Screen Mode" : "Windowed Mode");
    };

    const voiceAssistant = () => {
        showNotification("Voice Assistant: Brain Model Overview");
    };

    const centerModel = () => {
        if (!modelRef.current) return;
        modelRef.current.position.set(0, 0, 0);
        showNotification("Model centered");
    };

    const viewInfo = () => {
        setShowInfo((prev) => !prev);
    };

    return (
        <div className={`brain-viewer-root ${analysisMode ? 'analysis' : ''} ${arMode ? 'ar-mode' : ''} ${fullScreen ? 'full-screen' : ''}`}>
            {isLoading && <div className="loading-spinner">Loading model...</div>}
            {error && <div className="brain-viewer-error">{error}</div>}

            <div className="brain-viewer-mount" ref={mountRef}></div>

            {!isLoading && !error && (
                <div className="viewer-toolbar">
                    <button onClick={resetView} title="Reset View" className="toolbar-button"><FaRedo /></button>
                    <button onClick={toggleWireframe} title="Toggle Wireframe" className="toolbar-button"><FaCube /></button>
                    <button onClick={takeScreenshot} title="Screenshot" className="toolbar-button"><FaCamera /></button>
                    <button onClick={rotateModel} title="Rotate Model" className="toolbar-button">&#8635;</button>
                    <button onClick={toggleAnalysis} title="Analysis Mode" className="toolbar-button"><FaRulerCombined /></button>
                    <button onClick={toggleAR} title="AR Mode" className="toolbar-button"><FaMagic /></button>
                    <button onClick={voiceAssistant} title="Voice Assistant" className="toolbar-button"><FaVolumeUp /></button>
                    <button onClick={toggleEnv} title="Toggle Environment" className="toolbar-button"><FaAdjust /></button>
                    <button onClick={toggleFullScreen} title="Full Screen" className="toolbar-button"><FaArrowsAlt /></button>
                    <button onClick={centerModel} title="Center Model" className="toolbar-button"><FaAlignCenter /></button>
                    <button onClick={viewInfo} title="View Info" className="toolbar-button"><FaInfoCircle /></button>
                </div>
            )}

            {analysisMode && !isLoading && !error && (
                <div className="analysis-overlay">Measurements & Analysis Overlay</div>
            )}

            {showInfo && !isLoading && !error && (
                <div className="info-overlay">
                    <h4>Brain Model Metadata</h4>
                    <p>Name: Example Brain</p>
                    <p>Size: ~2MB</p>
                    <p>Created: Jan 12, 2022</p>
                </div>
            )}

            {notification && <div className="viewer-notification">{notification}</div>}
        </div>
    );
}

export default BrainViewer;
