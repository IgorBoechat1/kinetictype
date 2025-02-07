'use client';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import vertexShader from '../shaders/vertexShader';
import mirrorShader from '../shaders/mirrorShader';
import glassShader from '../shaders/glassShader';
import linesShader from '../shaders/linesShader';
import randomShader from '../shaders/randomShader';
import fragmentShader from '../shaders/fragmentShader';
import poserShader from '@/shaders/poserShader';
import pavoiShader from '@/shaders/pavoiShader';
import locoShader from '@/shaders/locoShader';

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

const fragmentShaders = {
  Mirror: mirrorShader,
  Glass: glassShader,
  Lines: linesShader,
  Random: randomShader,
  Fragment: fragmentShader,
  Poser: poserShader,
  Loco: locoShader,
  Pavoi: pavoiShader,
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
  texture: keyof typeof fragmentShaders | 'Standard';
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function TextMesh({ text, color, displacementIntensity, scalingIntensity, rotationIntensity, waveIntensity, fragmentationIntensity, isMicActive, font, texture }: TextProps) {
  const groupRef = useRef<THREE.Group>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const initialPositionsRef = useRef<THREE.Vector3[]>([]);
  const clock = new THREE.Clock();
  const { size, mouse, camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const loader = new FontLoader();
    loader.load(fontFiles[font], (font) => {
      if (groupRef.current) {
        groupRef.current.clear(); // Clear previous characters
        initialPositionsRef.current = []; // Clear previous initial positions

        text.split('').forEach((char, index) => {
          const geometry = new TextGeometry(char, {
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

          let material;
          if (texture === 'Standard') {
            material = new THREE.MeshStandardMaterial({
              color: color,
              roughness: 0.5,
              metalness: 0.5,
            });
          } else {
            material = new THREE.ShaderMaterial({
              vertexShader,
              fragmentShader: fragmentShaders[texture],
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
            });
          }

          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true; // Enable casting shadows
          mesh.receiveShadow = true; // Enable receiving shadows
          mesh.position.x = index * 3; // Adjust spacing between characters

          initialPositionsRef.current.push(mesh.position.clone()); // Store initial position

          if (groupRef.current) {
            groupRef.current.add(mesh);
          }
        });

        // Adjust the initial position of the text group
        groupRef.current.position.set(-text.length * 1.5, 0, -10); // Center the text group in front of the camera
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
  }, [text, color, displacementIntensity, scalingIntensity, rotationIntensity, waveIntensity, fragmentationIntensity, isMicActive, font, texture, size]);

  useFrame(() => {
    if (groupRef.current) {
      if (isMicActive && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
        const t = avgFrequency / 256;
        const easedT = easeInOutCubic(t);

        groupRef.current.children.forEach((child, index) => {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.ShaderMaterial;
          if (material.uniforms) {
            material.uniforms.u_time.value = clock.getElapsedTime();
            material.uniforms.u_soundData.value = t; // Update sound data uniform
            material.uniforms.u_displacementIntensity.value = displacementIntensity;
            material.uniforms.u_scalingIntensity.value = scalingIntensity;
            material.uniforms.u_rotationIntensity.value = rotationIntensity;
            material.uniforms.u_waveIntensity.value = waveIntensity;
            material.uniforms.u_fragmentationIntensity.value = fragmentationIntensity;
          }

          // Apply sound-reactive effects to individual characters
          const time = clock.getElapsedTime();
          const frequency = dataArrayRef.current![index % dataArrayRef.current!.length] / 256;

          // Get initial position
          const initialPosition = initialPositionsRef.current[index];

          // Displacement
          const displacement = displacementIntensity * frequency * Math.sin(time * 2 + index * 0.5);
          mesh.position.y = lerp(mesh.position.y, initialPosition.y + (isNaN(displacement) ? 0 : displacement), 0.1);

          // Scaling & Stretching
          const scale = 1 + scalingIntensity * frequency;
          mesh.scale.set(lerp(mesh.scale.x, scale, 0.1), lerp(mesh.scale.y, scale, 0.1), lerp(mesh.scale.z, scale, 0.1));

          // Rotation & Skewing
          const rotation = rotationIntensity * frequency;
          mesh.rotation.z = lerp(mesh.rotation.z, rotation, 0.1);

          // Wave & Ripple Distortion
          const wave = Math.sin(time * waveIntensity) * 0.05;
          mesh.position.x = lerp(mesh.position.x, initialPosition.x + wave, 0.1);

          // Fragmentation & Noise
          const fragmentation = fragmentationIntensity * frequency;
          mesh.position.z = lerp(mesh.position.z, initialPosition.z + fragmentation, 0.1);
        });
      } else {
        // Reset the effects when not hovering
        groupRef.current.children.forEach((child, index) => {
          const mesh = child as THREE.Mesh;
          const initialPosition = initialPositionsRef.current[index];
          mesh.scale.set(1, 1, 1);
          mesh.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
          mesh.rotation.set(0, 0, 0);
        });
      }

      // Rotate the entire group
      groupRef.current.rotation.y += 0.0001; // Adjust the rotation speed as needed
    }
  });

  return <group ref={groupRef} />;
}

export default TextMesh;