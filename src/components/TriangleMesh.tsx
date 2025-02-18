import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface TriangleMeshProps {
  color: THREE.Color;
  isMicActive: boolean;
  showPointCloud: boolean;
  displacementIntensity: number;
  scalingIntensity: number;
  rotationIntensity: number;
  waveIntensity: number;
  fragmentationIntensity: number;
}

const TriangleMesh: React.FC<TriangleMeshProps> = ({
  color,
  isMicActive,
  showPointCloud,
  displacementIntensity,
  scalingIntensity,
  rotationIntensity,
  waveIntensity,
  fragmentationIntensity,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const clock = new THREE.Clock();

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

      // Create multiple triangles
      for (let i = 0; i < 5; i++) {
        const triangleGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1,
          Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1,
          Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1,
        ]);
        triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const triangleMaterial = new THREE.MeshBasicMaterial({
          color: color,
          side: THREE.DoubleSide,
          wireframe: true,
          wireframeLinewidth: 1,
          wireframeLinecap: 'round',
          wireframeLinejoin: 'round',
        });
        const triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);
        triangleMesh.userData.velocity = new THREE.Vector3(Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01);
        groupRef.current.add(triangleMesh);
      }
    }
  }, [color]);

  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const time = clock.getElapsedTime();

      groupRef.current.children.forEach((child, index) => {
        if (child.type === 'Mesh') {
          const mesh = child as THREE.Mesh;
          const velocity = mesh.userData.velocity as THREE.Vector3;

          // Update position based on velocity
          mesh.position.add(velocity);

          // Ensure the triangles stay within bounds
          if (mesh.position.x < -1 || mesh.position.x > 1) velocity.x = -velocity.x;
          if (mesh.position.y < -1 || mesh.position.y > 1) velocity.y = -velocity.y;
          if (mesh.position.z < -1 || mesh.position.z > 1) velocity.z = -velocity.z;

          // Apply rotation
          mesh.rotation.x += rotationIntensity * 0.01;
          mesh.rotation.y += rotationIntensity * 0.01;

          // Apply scale based on sound data
          const scale = 1 + t * scalingIntensity * 0.5;
          mesh.scale.set(scale, scale, scale);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {showPointCloud ? (
        <points>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0])}
              itemSize={3}
              count={3}
            />
          </bufferGeometry>
          <pointsMaterial attach="material" color={color} size={0.1} />
        </points>
      ) : (
        <></>
      )}
    </group>
  );
};

export default TriangleMesh;