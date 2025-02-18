'use client';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FontLoader, Font } from 'three-stdlib';
import { TextGeometry } from 'three-stdlib';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const textMesh1Ref = useRef<THREE.Mesh>();
  const textMesh2Ref = useRef<THREE.Mesh>();
  const textGeoRef = useRef<TextGeometry>();
  const materialsRef = useRef<THREE.Material[]>([]);
  const fontRef = useRef<Font>();
  const pointLightRef = useRef<THREE.PointLight>();

  let firstLetter = true;
  let text = 'three.js';
  let bevelEnabled = true;
  let fontName = 'optimer';
  let fontWeight = 'bold';

  const depth = 20;
  const size = 70;
  const hover = 30;
  const curveSegments = 4;
  const bevelThickness = 2;
  const bevelSize = 1.5;
  const mirror = true;

  const fontMap = {
    helvetiker: 0,
    optimer: 1,
    gentilis: 2,
    'droid/droid_sans': 3,
    'droid/droid_serif': 4,
  };

  const weightMap = {
    regular: 0,
    bold: 1,
  };

  const reverseFontMap = Object.keys(fontMap).reduce((acc, key) => {
    acc[fontMap[key as keyof typeof fontMap]] = key;
    return acc;
  }, {} as { [key: number]: string });

  const reverseWeightMap = Object.keys(weightMap).reduce((acc, key) => {
    acc[weightMap[key as keyof typeof weightMap]] = key;
    return acc;
  }, {} as { [key: number]: string });

  let targetRotation = 0;
  let targetRotationOnPointerDown = 0;
  let pointerX = 0;
  let pointerXOnPointerDown = 0;
  let windowHalfX = window.innerWidth / 2;
  let fontIndex = 1;

  useEffect(() => {
    init();
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
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

    loadFont();

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
    renderer.setAnimationLoop(animate);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // EVENTS
    container.style.touchAction = 'none';
    container.addEventListener('pointerdown', onPointerDown);

    document.addEventListener('keypress', onDocumentKeyPress);
    document.addEventListener('keydown', onDocumentKeyDown);

    const params = {
      changeColor: () => {
        pointLight.color.setHSL(Math.random(), 1, 0.5);
      },
      changeFont: () => {
        fontIndex++;
        fontName = reverseFontMap[fontIndex % Object.keys(reverseFontMap).length];
        loadFont();
      },
      changeWeight: () => {
        fontWeight = fontWeight === 'bold' ? 'regular' : 'bold';
        loadFont();
      },
      changeBevel: () => {
        bevelEnabled = !bevelEnabled;
        refreshText();
      },
    };

    const gui = new GUI();
    gui.add(params, 'changeColor').name('change color');
    gui.add(params, 'changeFont').name('change font');
    gui.add(params, 'changeWeight').name('change weight');
    gui.add(params, 'changeBevel').name('change bevel');
    gui.open();

    window.addEventListener('resize', onWindowResize);
  };

  const onWindowResize = () => {
    windowHalfX = window.innerWidth / 2;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (firstLetter) {
      firstLetter = false;
      text = '';
    }

    const keyCode = event.keyCode;
    if (keyCode === 8) {
      event.preventDefault();
      text = text.substring(0, text.length - 1);
      refreshText();
      return false;
    }
  };

  const onDocumentKeyPress = (event: KeyboardEvent) => {
    const keyCode = event.which;
    if (keyCode === 8) {
      event.preventDefault();
    } else {
      const ch = String.fromCharCode(keyCode);
      text += ch;
      refreshText();
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

  const onPointerDown = (event: PointerEvent) => {
    if (event.isPrimary === false) return;
    pointerXOnPointerDown = event.clientX - windowHalfX;
    targetRotationOnPointerDown = targetRotation;
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.isPrimary === false) return;
    pointerX = event.clientX - windowHalfX;
    targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.isPrimary === false) return;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
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

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default ThreeScene;