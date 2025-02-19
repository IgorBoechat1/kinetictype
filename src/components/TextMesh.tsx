'use client';
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

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
  isMicActive: boolean;
  font: keyof typeof fontFiles;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function TextMesh({ text, color, displacementIntensity, scalingIntensity, rotationIntensity, waveIntensity, isMicActive, font }: TextProps) {
  const groupRef = useRef<THREE.Group>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const clock = new THREE.Clock();
  const { size, camera, scene } = useThree();
  const attractors = useRef<THREE.Vector3[]>([
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(1, 0, -0.5),
    new THREE.Vector3(0, 0.5, 1),
  ]);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load(fontFiles[font], (font) => {
      if (groupRef.current) {
        groupRef.current.clear();
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

        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox?.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const numVertices = positionAttribute.count;
        const positions = new Float32Array(numVertices * 3 * 2); // Adjust size for additional points
        const indices = geometry.getIndex(); // Access face indices

        // Add vertices
        for (let i = 0; i < numVertices; i++) {
          const x = positionAttribute.getX(i);
          const y = positionAttribute.getY(i);
          const z = positionAttribute.getZ(i);
          positions.set([x, y, z], i * 3);
        }

        if (indices) {
          for (let i = 0; i < indices.count; i += 3) {
            const a = indices.getX(i);
            const b = indices.getX(i + 1);
            const c = indices.getX(i + 2);

            const vA = new THREE.Vector3(
              positionAttribute.getX(a),
              positionAttribute.getY(a),
              positionAttribute.getZ(a)
            );

            const vB = new THREE.Vector3(
              positionAttribute.getX(b),
              positionAttribute.getY(b),
              positionAttribute.getZ(b)
            );

            const vC = new THREE.Vector3(
              positionAttribute.getX(c),
              positionAttribute.getY(c),
              positionAttribute.getZ(c)
            );

            // Generate points inside the triangle
            for (let j = 0; j < 3; j++) {  // Change `3` to increase density
              const r1 = Math.random();
              const r2 = Math.random();
              const sqrtR1 = Math.sqrt(r1);

              // Barycentric coordinates
              const newX = (1 - sqrtR1) * vA.x + (sqrtR1 * (1 - r2)) * vB.x + (sqrtR1 * r2) * vC.x;
              const newY = (1 - sqrtR1) * vA.y + (sqrtR1 * (1 - r2)) * vB.y + (sqrtR1 * r2) * vC.y;
              const newZ = (1 - sqrtR1) * vA.z + (sqrtR1 * (1 - r2)) * vB.z + (sqrtR1 * r2) * vC.z;

              positions.set([newX, newY, newZ], (numVertices + i + j) * 3);
            }
          }
        }

        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const initialPosition = lineGeometry.attributes.position.clone();
        lineGeometry.setAttribute('initialPosition', initialPosition);

        const material = new THREE.LineBasicMaterial({ color });
        const lines = new THREE.LineSegments(lineGeometry, material);
        groupRef.current.add(lines);
        scene.add(groupRef.current);
      }
    });

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

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

    return () => {
      audioContext.close();
    };
  }, [text, color, displacementIntensity, scalingIntensity, waveIntensity, isMicActive, font, scene]);

  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const easedT = easeInOutCubic(t);
      const time = clock.getElapsedTime();

      groupRef.current.children.forEach((child) => {
        const lines = child as THREE.LineSegments;
        const geometry = lines.geometry as THREE.BufferGeometry;
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const initialPositionAttribute = geometry.getAttribute('initialPosition') as THREE.BufferAttribute;

        for (let i = 0; i < positionAttribute.count; i++) {
          const x = initialPositionAttribute.getX(i);
          const y = initialPositionAttribute.getY(i);
          const z = initialPositionAttribute.getZ(i);

          // Apply random displacement to vertices
          positionAttribute.setXYZ(
            i,
            x + (Math.random() - 0.5) * displacementIntensity * t,
            y + (Math.random() - 0.5) * displacementIntensity * t,
            z + (Math.random() - 0.5) * displacementIntensity * t
          );
        }
        positionAttribute.needsUpdate = true;

        // Apply attractor forces to lines
        for (let i = 0; i < positionAttribute.count; i++) {
          const x = positionAttribute.getX(i);
          const y = positionAttribute.getY(i);
          const z = positionAttribute.getZ(i);
          const position = new THREE.Vector3(x, y, z);

          attractors.current.forEach((attractor) => {
            const direction = attractor.clone().sub(position).normalize();
            const distance = attractor.distanceTo(position);
            const force = direction.multiplyScalar(1 / (distance * distance));
            position.add(force.multiplyScalar(t * waveIntensity));
          });

          positionAttribute.setXYZ(i, position.x, position.y, position.z);
        }
        positionAttribute.needsUpdate = true;
      });
    }
  });

  return <group ref={groupRef} />;
}

export default TextMesh;