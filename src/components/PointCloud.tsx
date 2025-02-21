import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface PointCloudProps {
  color: THREE.Color;
  isMicActive: boolean;
  displacementIntensity: number;
  waveIntensity: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const PointCloud: React.FC<PointCloudProps> = ({
  color,
  isMicActive,
  displacementIntensity,
  waveIntensity,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const clock = new THREE.Clock();
  const attractors = useRef<THREE.Vector3[]>([
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(1, 0, -0.5),
    new THREE.Vector3(0, 0.5, 1),
  ]);

  useEffect(() => {
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
  }, [isMicActive]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.clear();

      // Create organic shape point cloud
      const pointCount = 10000;
      const pointGeometry = new THREE.BufferGeometry();
      const pointVertices = new Float32Array(pointCount * 3);
      const pointColors = new Float32Array(pointCount * 3); // Add color attribute

      for (let i = 0; i < pointCount; i++) {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random());
        pointVertices[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pointVertices[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pointVertices[i * 3 + 2] = r * Math.cos(phi);

        // Set initial colors
        pointColors[i * 3] = color.r;
        pointColors[i * 3 + 1] = color.g;
        pointColors[i * 3 + 2] = color.b;
      }

      pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointVertices, 3));
      pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3)); // Add color attribute
      const initialPosition = pointGeometry.attributes.position.clone();
      pointGeometry.setAttribute('initialPosition', initialPosition);

      const pointMaterial = new THREE.PointsMaterial({ vertexColors: true, size: 0.01 });
      const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
      groupRef.current.add(pointCloud);
    }
  }, [color]);

  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const easedT = easeInOutCubic(t);
      const time = clock.getElapsedTime();

      groupRef.current.children.forEach((child) => {
        const points = child as THREE.Points;
        const geometry = points.geometry as THREE.BufferGeometry;
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const initialPositionAttribute = geometry.getAttribute('initialPosition') as THREE.BufferAttribute;
        const colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute;

        // Morph vertices based on sound data
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

          // Update colors based on sound data
          const intensity = Math.abs(Math.sin(time + i * 0.1) * t);
          colorAttribute.setXYZ(
            i,
            color.r * intensity,
            color.g * intensity,
            color.b * intensity
          );
        }
        positionAttribute.needsUpdate = true;
        colorAttribute.needsUpdate = true;

        // Apply attractor forces to point cloud
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

  return (
    <group ref={groupRef} />
  );
};

export default PointCloud;