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
        geometry.computeBoundingSphere();

        const boundingBox = geometry.boundingBox;
        const pointsGeometry = new THREE.BufferGeometry();
        const numPoints = 5000; // Reduced number of points for better performance
        const positions = new Float32Array(numPoints * 3);

        if (boundingBox) {
          for (let i = 0; i < numPoints; i++) {
            let x, y, z;
            let point;
            do {
              x = THREE.MathUtils.randFloat(boundingBox.min.x, boundingBox.max.x);
              y = THREE.MathUtils.randFloat(boundingBox.min.y, boundingBox.max.y);
              z = THREE.MathUtils.randFloat(boundingBox.min.z, boundingBox.max.z);
              point = new THREE.Vector3(x, y, z);
            } while (!isPointInsideGeometry(point, geometry));
            positions.set([x, y, z], i * 3);
          }
        }

        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({ color, size: 0.05 });
        const points = new THREE.Points(pointsGeometry, material);
        groupRef.current.add(points);
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

      groupRef.current.children.forEach((child) => {
        const points = child as THREE.Points;
        const geometry = points.geometry as THREE.BufferGeometry;
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;

        for (let i = 0; i < positionAttribute.count; i++) {
          const x = positionAttribute.getX(i);
          const y = positionAttribute.getY(i);
          const z = positionAttribute.getZ(i);
          positionAttribute.setXYZ(i, x, y, z);
        }
        positionAttribute.needsUpdate = true;
      });
    }
  });

  return <group ref={groupRef} />;
}

function isPointInsideGeometry(point: THREE.Vector3, geometry: THREE.BufferGeometry): boolean {
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3(1, 0, 0);
  raycaster.set(point, direction);
  const intersects = raycaster.intersectObject(new THREE.Mesh(geometry));
  return intersects.length % 2 === 1;
}

export default TextMesh;