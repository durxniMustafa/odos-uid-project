import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../styles/BrainViewer.css";

// Simple function to color bounding boxes based on confidence
function getBoxColor(confString) {
    if (!confString) return 0x999999; // no data => gray
    const val = parseInt(confString, 10); // "75%" => 75
    if (val >= 90) return 0xff0000; // red
    if (val >= 80) return 0xff8c00; // dark orange
    if (val >= 70) return 0xffff00; // yellow
    if (val >= 60) return 0x32cd32; // limegreen
    return 0x999999;
}

export default function BrainViewer({
    file,
    regionData,
    showAIHighlights,
    annotationPoints = [],
    setAnnotationPoints = () => { },
}) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);

    const [regionMeshes, setRegionMeshes] = useState([]);
    const [annotationSpheres, setAnnotationSpheres] = useState([]);

    // Initialize Three.js
    useEffect(() => {
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
            60,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 1.5, 3);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.target.set(0, 0.5, 0);
        controlsRef.current = controls;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight.position.set(5, 10, 5);
        scene.add(dirLight);

        // Load 3D model
        if (file) {
            const loader = new GLTFLoader();
            loader.load(
                file,
                (gltf) => {
                    scene.add(gltf.scene);
                },
                undefined,
                (err) => {
                    console.error("3D Model load error:", err);
                }
            );
        }

        // Animate
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            if (rendererRef.current) {
                rendererRef.current.dispose();
                if (rendererRef.current.domElement && mountRef.current) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
            }
        };
    }, [file]);

    // Heatmap bounding boxes for regionData
    useEffect(() => {
        if (!showAIHighlights || !sceneRef.current) return;
        // Remove old
        regionMeshes.forEach((m) => sceneRef.current.remove(m));
        setRegionMeshes([]);

        // Add new
        const newMeshes = regionData.map((r) => {
            const geo = new THREE.BoxGeometry(r.size.x, r.size.y, r.size.z);
            const color = getBoxColor(r.confidence);
            const mat = new THREE.MeshBasicMaterial({
                color,
                wireframe: true,
                transparent: true,
                opacity: 0.8,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(r.position.x, r.position.y, r.position.z);
            sceneRef.current.add(mesh);
            return mesh;
        });
        setRegionMeshes(newMeshes);
    }, [regionData, showAIHighlights]);

    // Update annotation spheres whenever annotationPoints changes
    useEffect(() => {
        if (!sceneRef.current) return;
        annotationSpheres.forEach((s) => sceneRef.current.remove(s));
        setAnnotationSpheres([]);

        const newSpheres = annotationPoints.map((pos) => {
            const sphereGeo = new THREE.SphereGeometry(0.01, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.set(pos.x, pos.y, pos.z);
            sceneRef.current.add(sphere);
            return sphere;
        });
        setAnnotationSpheres(newSpheres);
    }, [annotationPoints]);

    // Let user add annotation by clicking on the scene
    const handleSceneClick = useCallback(
        (e) => {
            if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
            const rect = rendererRef.current.domElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const mouse = new THREE.Vector2(
                (x / rect.width) * 2 - 1,
                -(y / rect.height) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, cameraRef.current);
            const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                setAnnotationPoints([...annotationPoints, { x: point.x, y: point.y, z: point.z }]);
            }
        },
        [annotationPoints, setAnnotationPoints]
    );

    useEffect(() => {
        const domEl = rendererRef.current?.domElement;
        if (!domEl) return;
        domEl.addEventListener("mousedown", handleSceneClick);
        return () => {
            domEl.removeEventListener("mousedown", handleSceneClick);
        };
    }, [handleSceneClick]);

    return (
        <div className="brain-viewer-root">
            <div className="brain-viewer-mount" ref={mountRef} />
            {/* (Optional) You could add a small overlay for a "confidence graph" or instructions */}
        </div>
    );
}
