import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
    FiRefreshCw,
    FiBox,
    FiCamera,
    FiInfo,
    FiAlignCenter,
    FiRotateCw,
    FiMaximize,
    FiThumbsUp,
    FiThumbsDown
} from "react-icons/fi";

import "../styles/BrainViewer.css";
import useWindowSize from "../hooks/useWindowSize";

function BrainViewer({ file, onFeedback, showReportButton, onGenerateReport }) {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const modelRef = useRef(null);
    const cameraRef = useRef(null);

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWireframe, setIsWireframe] = useState(false);
    const [notification, setNotification] = useState(null);
    const [rotationAngle, setRotationAngle] = useState(0);
    const [showInfo, setShowInfo] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFeedbackButtons, setShowFeedbackButtons] = useState(false);

    const { width, height } = useWindowSize();

    const showViewerNotification = (msg) => {
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
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
                setShowFeedbackButtons(true);
                animate();
            },
            undefined,
            (err) => {
                console.error("Error loading model:", err);
                setError("Failed to load the brain model.");
                setIsLoading(false);
            }
        );

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        return () => {
            // Cleanup: Only remove if still present
            if (rendererRef.current && rendererRef.current.domElement && mountRef.current) {
                if (mountRef.current.contains(rendererRef.current.domElement)) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
        };
    }, [file]);

    // Adjust camera & renderer on window size change
    useEffect(() => {
        if (rendererRef.current && cameraRef.current && mountRef.current) {
            const newWidth = mountRef.current.clientWidth;
            const newHeight = mountRef.current.clientHeight;
            rendererRef.current.setSize(newWidth, newHeight);
            cameraRef.current.aspect = newWidth / newHeight;
            cameraRef.current.updateProjectionMatrix();
        }
    }, [width, height]);

    const resetView = () => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(0, 1.5, 3);
        controlsRef.current.target.set(0, 0.5, 0);
        controlsRef.current.update();
        showViewerNotification("View reset");
    };

    const toggleWireframe = () => {
        if (!modelRef.current) return;
        modelRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.wireframe = !child.material.wireframe;
            }
        });
        setIsWireframe((prev) => !prev);
        showViewerNotification(isWireframe ? "Solid mode" : "Wireframe mode");
    };

    const rotateModel = () => {
        if (!modelRef.current) return;
        setRotationAngle((prev) => prev + 90);
        const rad = (rotationAngle + 90) * (Math.PI / 180);
        modelRef.current.rotation.y = rad;
        showViewerNotification("Model rotated");
    };

    const takeScreenshot = () => {
        showViewerNotification("Screenshot captured (simulated)");
    };

    const centerModel = () => {
        if (!modelRef.current) return;
        modelRef.current.position.set(0, 0, 0);
        showViewerNotification("Model centered");
    };

    const viewInfo = () => {
        setShowInfo((prev) => !prev);
    };

    const toggleFullscreen = () => {
        setIsFullscreen((prev) => !prev);
    };

    const handleLike = () => {
        onFeedback && onFeedback('like');
        showViewerNotification("Thanks for your feedback!");
    };

    const handleDislike = () => {
        onFeedback && onFeedback('dislike');
        showViewerNotification("Thanks for your feedback!");
    };

    return (
        <div className={`brain-viewer-root ${isFullscreen ? 'fullscreen' : ''}`}>
            {isLoading && <div className="loading-spinner">Loading model...</div>}
            {error && <div className="brain-viewer-error">{error}</div>}

            <div className="brain-viewer-mount" ref={mountRef}></div>

            {!isLoading && !error && (
                <>
                    <div className="viewer-toolbar">
                        <button onClick={toggleFullscreen} className="toolbar-button" title="Toggle Fullscreen"><FiMaximize /></button>
                        <button onClick={resetView} className="toolbar-button" title="Reset View"><FiRefreshCw /></button>
                        <button onClick={toggleWireframe} className="toolbar-button" title="Toggle Wireframe"><FiBox /></button>
                        <button onClick={rotateModel} className="toolbar-button" title="Rotate Model"><FiRotateCw /></button>
                        <button onClick={centerModel} className="toolbar-button" title="Center Model"><FiAlignCenter /></button>
                        <button onClick={takeScreenshot} className="toolbar-button" title="Screenshot"><FiCamera /></button>
                        <button onClick={viewInfo} className="toolbar-button" title="View Info"><FiInfo /></button>
                    </div>

                    {showFeedbackButtons && (
                        <div className="feedback-buttons">
                            <button className="like-button" onClick={handleLike}><FiThumbsUp /> Like</button>
                            <button className="dislike-button" onClick={handleDislike}><FiThumbsDown /> Dislike</button>
                        </div>
                    )}

                    {showReportButton && (
                        <div className="generate-report-button">
                            <button className="primary-button" onClick={onGenerateReport}>Generate AI Report</button>
                        </div>
                    )}
                </>
            )}

            {showInfo && !isLoading && !error && (
                <div className="info-overlay">
                    <h4>Brain Model Info</h4>
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
