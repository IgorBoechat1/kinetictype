'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { mirrorFragmentShader, mirrorVertexShader } from '../shaders/locoShader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

// Define the available font files
const fontFiles = {
  Playfair: '/assets/Playfair.json',
  Monigue: '/assets/Monigue.json',
  Cocogoose: '/assets/Cocogoose.json',
  Bodoni: '/assets/Bodoni.json',
  AfterShok: '/assets/AfterShok.json',
  Batuphat: '/assets/Batuphat.json',
  Barrio: '/assets/Barrio.json',
  DinerFat: '/assets/DinerFat.json',
  LeagueGothic: '/assets/LeagueGothic.json',
  FancyPants: '/assets/FancyPants.json',
  db: '/assets/db.json',
  Seaside: '/assets/Seaside.json',
};

// Define the properties for the Iridescent component
interface TextProps {
  text: string;
  color: THREE.Color;
  displacementIntensity: number;
  waveIntensity: number;
  isMicActive: boolean;
  font: keyof typeof fontFiles;
  scalingIntensity: number;
  useShader: boolean;
}

// Easing function for smooth transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 8 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Main Iridescent component
function Iridescent({ text, color, displacementIntensity, waveIntensity, isMicActive, font, scalingIntensity, useShader }: TextProps) {
  const groupRef = useRef<THREE.Group>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const clock = new THREE.Clock();
  const { scene, size, camera } = useThree();
  const [vertexRestPositions, setVertexRestPositions] = useState<THREE.Vector3[]>([]);
  const [mouse, setMouse] = useState(new THREE.Vector2());

  useEffect(() => {
    // Load the selected font and create the text geometry
    const loader = new FontLoader();
    loader.load(fontFiles[font], (font) => {
      if (groupRef.current) {
        groupRef.current.clear();

        // Create the text geometry
        const geometry = new TextGeometry(text, {
          font: font,
          size: 3,
          height: 0.1,
          curveSegments: 32,
          bevelEnabled: true,
          bevelThickness: 0.2,
          bevelSize: 0.2,
          bevelOffset: 0,
          bevelSegments: 8,
        });

        // Center the text geometry
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox?.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Store the original vertex positions for restoring
        const originalPositions: THREE.Vector3[] = [];
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < positionAttribute.count; i++) {
          const position = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
          );
          originalPositions.push(position);
        }
        setVertexRestPositions(originalPositions);

        // Load environment map
        const envMap = new THREE.CubeTextureLoader()
          .setPath('/path/to/envmap/')
          .load([
            'px.jpg', 'nx.jpg',
            'py.jpg', 'ny.jpg',
            'pz.jpg', 'nz.jpg'
          ]);

        // Create the material and mesh for the text with the mirror shader
        const material = new THREE.ShaderMaterial({
          vertexShader: mirrorVertexShader,
          fragmentShader: mirrorFragmentShader,
          uniforms: {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uLightPosition: { value: new THREE.Vector3(5.0, 5.0, 5.0) },
            uEnvMap: { value: envMap },
            uAudioData: { value: 0 }, // Add uniform for audio data
          },
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        groupRef.current.add(mesh);

        scene.add(groupRef.current);
      }
    });

    // Setup the audio analyser
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Function to setup the microphone input
    const setupMic = async () => {
      if (isMicActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
        } catch (error) {
          console.error(error);
        }
      }
    };

    setupMic();

    // Cleanup function to close the audio context
    return () => {
      audioContext.close();
    };
  }, [text, color, displacementIntensity, waveIntensity, isMicActive, font, scene, useShader]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / size.width) * 2 - 1;
      const y = -(event.clientY / size.height) * 2 + 1;
      setMouse(new THREE.Vector2(x, y));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [size]);

  // Animation loop to update the text mesh based on audio data
  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current && vertexRestPositions.length > 0) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const easedT = easeInOutCubic(t);
      const time = clock.getElapsedTime();

      groupRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const geometry = mesh.geometry as THREE.BufferGeometry;
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;

        for (let i = 0; i < positionAttribute.count; i++) {
          const restPosition = vertexRestPositions[i];
          const x = restPosition.x;
          const y = restPosition.y;
          const z = restPosition.z;

          // Apply the coil effect based on the audio data
          const coilEffect = Math.sin(time * 2 + i * 0.1) * waveIntensity * 0.1 * easedT;
          const extrudeEffect = Math.sin(time * 2 + i * 0.05) * displacementIntensity * 0.1 * easedT;

          // Smoothly transition the vertex position using a blending factor
          const smoothFactor = 10.1;
          positionAttribute.setXYZ(i, 
            x + coilEffect * smoothFactor, 
            y + coilEffect * smoothFactor, 
            z + extrudeEffect * smoothFactor
          );
        }
        positionAttribute.needsUpdate = true;

        // Update shader uniform time and audio data
        const material = mesh.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.uTime.value = time;
          material.uniforms.uAudioData.value = avgFrequency / 256; // Pass audio data to shader
        }
      });
    }
  });

  return (
    <group ref={groupRef} />
  );
}

export default Iridescent;