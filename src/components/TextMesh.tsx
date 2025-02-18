'use client';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import vertexShader from '../shaders/vertexShader';
import fragmentShader from '../shaders/fragmentShader';

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

interface TextProps {
  text: string;
  color: THREE.Color;
  displacementIntensity: number;
  scalingIntensity: number;
  rotationIntensity: number;
  waveIntensity: number;
  fragmentationIntensity: number;
  isMicActive: boolean;
  font: keyof typeof fontFiles;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function TextMesh({ text, color, displacementIntensity, scalingIntensity, rotationIntensity, waveIntensity, fragmentationIntensity, isMicActive, font }: TextProps) {
  const groupRef = useRef<THREE.Group>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const clock = new THREE.Clock();
  const { size, camera, scene } = useThree();

  useEffect(() => {
    const loader = new FontLoader();
    loader.load(fontFiles[font], (font) => {
      if (groupRef.current) {
        groupRef.current.clear(); // Clear previous characters

        const geometry = new TextGeometry(text, {
          font: font,
          size: 3,
          height: 0.1, // Reduce extrude depth
          curveSegments: 128, // Increase curve segments for smoother curves
          bevelEnabled: true,
          bevelThickness: 0.2, // Increase bevel thickness for more roundness
          bevelSize: 0.2, // Increase bevel size for more roundness
          bevelOffset: 0,
          bevelSegments: 36, // Increase bevel segments for smoother bevels
        });

        // Create initial position attribute
        const initialPosition = geometry.attributes.position.clone();
        geometry.setAttribute('initialPosition', initialPosition);

        const points = new THREE.Points(
          geometry,
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              u_time: { value: 0 },
              u_resolution: { value: new THREE.Vector2(size.width, size.height) },
              u_color: { value: color },
              u_lightPosition: { value: new THREE.Vector3(0, 10, 10) },
              u_viewPosition: { value: camera.position },
              u_soundData: { value: 0 }, // Add sound data uniform
              u_displacementIntensity: { value: displacementIntensity },
              u_scalingIntensity: { value: scalingIntensity },
              u_rotationIntensity: { value: rotationIntensity },
              u_waveIntensity: { value: waveIntensity },
              u_fragmentationIntensity: { value: fragmentationIntensity },
            },
            side: THREE.DoubleSide,
          })
        );

        groupRef.current.add(points);
        groupRef.current.position.set(-text.length * 1.5, 0, -10); // Center the text group in front of the camera
        scene.add(groupRef.current); // Add the group to the scene
      }
    });

    // Set up audio context and analyser
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Get microphone input
    if (isMicActive) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
      }).catch((err) => {
        console.error('Error accessing microphone:', err);
      });
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [text, color, displacementIntensity, scalingIntensity, rotationIntensity, waveIntensity, fragmentationIntensity, isMicActive, font, size, scene]);

  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const easedT = easeInOutCubic(t);
      const time = clock.getElapsedTime();

      groupRef.current.children.forEach((child, index) => {
        const points = child as THREE.Points;
        const material = points.material as THREE.ShaderMaterial;
        const geometry = points.geometry as THREE.BufferGeometry;
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const initialPositionAttribute = geometry.getAttribute('initialPosition') as THREE.BufferAttribute;

        // Update uniforms
        material.uniforms.u_time.value = time;
        material.uniforms.u_soundData.value = easedT;

        for (let i = 0; i < positionAttribute.count; i++) {
          const x = initialPositionAttribute.getX(i);
          const y = initialPositionAttribute.getY(i);
          const z = initialPositionAttribute.getZ(i);

          // Distort vertices based on sound data
          positionAttribute.setXYZ(i, x + x * t * 0.1, y + y * t * 0.1, z + z * t * 0.1);
        }
        positionAttribute.needsUpdate = true;

        points.scale.set(1 + easedT * scalingIntensity, 1 + easedT * scalingIntensity, 1 + easedT * scalingIntensity);
      });

      // Comment out or remove the following line to stop automatic rotation
      // groupRef.current.rotation.y += 0.01; // Adjust the rotation speed as needed
    }
  });

  return <group ref={groupRef} />;
}

export default TextMesh;