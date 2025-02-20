'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
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

// Define the properties for the TextMesh component
interface TextProps {
  text: string;
  color: THREE.Color;
  displacementIntensity: number;
  waveIntensity: number;
  isMicActive: boolean;
  font: keyof typeof fontFiles;
  scalingIntensity: number; // Add the missing prop
}

// Easing function for smooth transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 8 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Main TextMesh component
function TextMesh({ text, color, displacementIntensity, waveIntensity, isMicActive, font, scalingIntensity }: TextProps) {
  const groupRef = useRef<THREE.Group>(null); // Reference to the group containing the text mesh
  const analyserRef = useRef<AnalyserNode | null>(null); // Reference to the audio analyser
  const dataArrayRef = useRef<Uint8Array | null>(null); // Reference to the audio data array
  const clock = new THREE.Clock(); // Clock to track elapsed time
  const { scene } = useThree(); // Access the scene from the Three.js context

  const [vertexRestPositions, setVertexRestPositions] = useState<THREE.Vector3[]>([]); // Store the original vertex positions

  useEffect(() => {
    // Load the selected font and create the text geometry
    const loader = new FontLoader();
    loader.load(fontFiles[font], (font) => {
      if (groupRef.current) {
        groupRef.current.clear(); // Clear any existing children in the group
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
        setVertexRestPositions(originalPositions); // Store the original positions

        // Create the material and line segments for the text
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
        const lines = new THREE.LineSegments(geometry, material);
        lines.castShadow = true; // Enable shadow casting
        lines.receiveShadow = true; // Enable shadow receiving
        groupRef.current.add(lines); // Add the lines to the group

        // Create thicker outlines for the text edges
        const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 4 });
        const outlineLines = new THREE.LineSegments(geometry, outlineMaterial);
        outlineLines.castShadow = true; // Enable shadow casting
        outlineLines.receiveShadow = true; // Enable shadow receiving
        groupRef.current.add(outlineLines); // Add the outline lines to the group

        scene.add(groupRef.current); // Add the group to the scene
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
  }, [text, color, displacementIntensity, waveIntensity, isMicActive, font, scene]);

  // Animation loop to update the text mesh based on audio data
  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current && vertexRestPositions.length > 0) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current); // Get the audio data
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const easedT = easeInOutCubic(t);
      const time = clock.getElapsedTime();

      // Update the position of each vertex in the text geometry
      groupRef.current.children.forEach((child) => {
        const lines = child as THREE.LineSegments;
        const geometry = lines.geometry as THREE.BufferGeometry;
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
          const smoothFactor = 10.1; // Controls how quickly the animation returns to the rest position
          positionAttribute.setXYZ(i, 
            x + coilEffect * smoothFactor, 
            y + coilEffect * smoothFactor, 
            z + extrudeEffect * smoothFactor
          );
        }
        positionAttribute.needsUpdate = true; // Mark the attribute as needing an update
      });
    }
  });

  return <group ref={groupRef} />; // Return the group containing the text mesh
}

export default TextMesh;