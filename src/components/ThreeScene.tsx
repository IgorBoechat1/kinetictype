'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FontLoader, Font } from 'three-stdlib';
import { TextGeometry } from 'three-stdlib';
import ThreeSceneControls from './ThreeSceneControls';

const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null); // Reference to the container div
  const groupRef = useRef<THREE.Group>(new THREE.Group()); // Reference to the group containing the text mesh
  const cameraRef = useRef<THREE.PerspectiveCamera>(); // Reference to the camera
  const sceneRef = useRef<THREE.Scene>(); // Reference to the scene
  const rendererRef = useRef<THREE.WebGLRenderer>(); // Reference to the renderer
  const textMesh1Ref = useRef<THREE.Mesh>(); // Reference to the first text mesh
  const textMesh2Ref = useRef<THREE.Mesh>(); // Reference to the second text mesh (mirror)
  const materialsRef = useRef<THREE.Material[]>([]); // Reference to the materials
  const fontRef = useRef<Font>(); // Reference to the font
  const pointLightRef = useRef<THREE.PointLight>(); // Reference to the point light

  const [text, setText] = useState('three.js'); // Initial text
  const [targetRotation, setTargetRotation] = useState(0); // Target rotation for the group
  const [targetRotationOnPointerDown, setTargetRotationOnPointerDown] = useState(0); // Target rotation on pointer down
  const [pointerX, setPointerX] = useState(0); // Pointer X position
  const [pointerXOnPointerDown, setPointerXOnPointerDown] = useState(0); // Pointer X position on pointer down
  const [windowHalfX, setWindowHalfX] = useState(window.innerWidth / 2); // Half of the window width

  let bevelEnabled = true; // Flag to enable/disable bevel
  let fontName = 'optimer'; // Initial font name
  let fontWeight = 'bold'; // Initial font weight

  const depth = 20; // Depth of the text
  const size = 70; // Size of the text
  const hover = 30; // Hover effect for the text
  const curveSegments = 4; // Number of curve segments
  const bevelThickness = 2; // Thickness of the bevel
  const bevelSize = 1.5; // Size of the bevel
  const mirror = true; // Flag to enable/disable mirror effect

  useEffect(() => {
    init(); // Initialize the scene
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose(); // Dispose the renderer on unmount
      }
    };
  }, []);

  const init = () => {
    const container = containerRef.current;
    if (!container) return;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
    camera.position.set(0, 400, 700);
    cameraRef.current = camera;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 250, 1400);
    sceneRef.current = scene;

    // LIGHTS
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(0, 0, 1).normalize();
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xffffff, 4.5, 0, 0);
    pointLight.color.setHSL(Math.random(), 1, 0.5);
    pointLight.position.set(0, 100, 90);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    materialsRef.current = [
      new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
      new THREE.MeshPhongMaterial({ color: 0xffffff }), // side
    ];

    const group = groupRef.current;
    group.position.y = 100;
    scene.add(group);

    loadFont(); // Load the font

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000),
      new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
    );
    plane.position.y = 100;
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate); // Set the animation loop
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    window.addEventListener('resize', onWindowResize);
  };

  const onWindowResize = () => {
    setWindowHalfX(window.innerWidth / 2);
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  const loadFont = () => {
    const loader = new FontLoader();
    loader.load(`/fonts/${fontName}_${fontWeight}.typeface.json`, (response) => {
      fontRef.current = response;
      refreshText();
    });
  };

  const createText = () => {
    const font = fontRef.current;
    if (!font) return;

    const textGeo = new TextGeometry(text, {
      font: font,
      size: size,
      height: depth,
      curveSegments: curveSegments,
      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: bevelEnabled,
    });

    textGeo.computeBoundingBox();
    const centerOffset = -0.5 * (textGeo.boundingBox!.max.x - textGeo.boundingBox!.min.x);

    const textMesh1 = new THREE.Mesh(textGeo, materialsRef.current);
    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;
    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;
    groupRef.current.add(textMesh1);
    textMesh1Ref.current = textMesh1;

    if (mirror) {
      const textMesh2 = new THREE.Mesh(textGeo, materialsRef.current);
      textMesh2.position.x = centerOffset;
      textMesh2.position.y = -hover;
      textMesh2.position.z = depth;
      textMesh2.rotation.x = Math.PI;
      textMesh2.rotation.y = Math.PI * 2;
      groupRef.current.add(textMesh2);
      textMesh2Ref.current = textMesh2;
    }
  };

  const refreshText = () => {
    const group = groupRef.current;
    if (textMesh1Ref.current) group.remove(textMesh1Ref.current);
    if (mirror && textMesh2Ref.current) group.remove(textMesh2Ref.current);
    if (!text) return;
    createText();
  };

  const animate = () => {
    const group = groupRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    if (group && camera && renderer && scene) {
      group.rotation.y += (targetRotation - group.rotation.y) * 0.05;
      camera.lookAt(new THREE.Vector3(0, 150, 0));
      renderer.clear();
      renderer.render(scene, camera);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <ThreeSceneControls
        text={text}
        setText={setText}
        targetRotation={targetRotation}
        setTargetRotation={setTargetRotation}
        targetRotationOnPointerDown={targetRotationOnPointerDown}
        setTargetRotationOnPointerDown={setTargetRotationOnPointerDown}
        pointerX={pointerX}
        setPointerX={setPointerX}
        pointerXOnPointerDown={pointerXOnPointerDown}
        setPointerXOnPointerDown={setPointerXOnPointerDown}
        windowHalfX={windowHalfX}
      />
    </div>
  );
};

export default ThreeScene;