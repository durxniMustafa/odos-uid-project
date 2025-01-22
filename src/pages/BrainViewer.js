import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../styles/BrainViewer.css";

/**
 * Color bounding boxes by confidence (pseudo heatmap):
 * - 90+ => red
 * - 80+ => orange
 * - 70+ => yellow
 * - 60+ => lime green
 * - else => gray
 */
function getBoxColor(confString) {
    if (!confString) return 0x999999;
    const val = parseInt(confString, 10);
    if (val >= 90) return 0xff0000;
    if (val >= 80) return 0xff8c00;
    if (val >= 70) return 0xffff00;
    if (val >= 60) return 0x32cd32;
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

    useEffect(() => {
        const scene = new THREE.Scene();
        // **Change background** from default black to a neutral color:
        scene.background = new THREE.Color("#f9f9f9");

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
                    // Optional: auto-center model using bounding box
                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());

                    // Reposition the model so it's centered at (0,0,0) or near target
                    gltf.scene.position.x -= center.x;
                    gltf.scene.position.y -= center.y;
                    gltf.scene.position.z -= center.z;

                    // Move camera to fit the bounding box
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const fov = camera.fov * (Math.PI / 180);
                    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                    cameraZ *= 1.2; // padding
                    camera.position.set(0, 0, cameraZ);
                    camera.lookAt(0, 0, 0);
                },
                undefined,
                (err) => {
                    console.error("3D Model load error:", err);
                }
            );
        }

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle resizing
        const handleResize = () => {
            if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            rendererRef.current.setSize(width, height);
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
        };
        window.addEventListener("resize", handleResize);
        // Call once to sync on initial load
        handleResize();

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                if (rendererRef.current.domElement && mountRef.current) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
            }
        };
    }, [file]);

    // Render bounding boxes (pseudo heatmap)
    useEffect(() => {
        if (!showAIHighlights || !sceneRef.current) return;
        regionMeshes.forEach((m) => sceneRef.current.remove(m));
        setRegionMeshes([]);

        const newMeshes = regionData.map((r) => {
            const geo = new THREE.BoxGeometry(r.size.x, r.size.y, r.size.z);
            const color = getBoxColor(r.confidence);
            const mat = new THREE.MeshBasicMaterial({
                color,
                wireframe: true,
                transparent: true,
                opacity: 0.85,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(r.position.x, r.position.y, r.position.z);
            sceneRef.current.add(mesh);
            return mesh;
        });
        setRegionMeshes(newMeshes);
    }, [regionData, showAIHighlights]);

    // Render annotation spheres
    useEffect(() => {
        if (!sceneRef.current) return;
        annotationSpheres.forEach((s) => sceneRef.current.remove(s));
        setAnnotationSpheres([]);

        const newSpheres = annotationPoints.map((pos) => {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.01, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x0000ff })
            );
            sphere.position.set(pos.x, pos.y, pos.z);
            sceneRef.current.add(sphere);
            return sphere;
        });
        setAnnotationSpheres(newSpheres);
    }, [annotationPoints]);

    // Click to add annotation
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
            {/* Optionally: Add a small overlay or legend here */}
        </div>
    );
}
