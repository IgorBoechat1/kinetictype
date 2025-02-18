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

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

      if (!showPointCloud) {
        // Create multiple triangles
        for (let i = 0; i < 5; i++) {
          const triangleGeometry = new THREE.BufferGeometry();
          const vertices = new Float32Array([
            Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1,
            Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1,
            Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1,
          ]);
          triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          const initialPosition = triangleGeometry.attributes.position.clone();
          triangleGeometry.setAttribute('initialPosition', initialPosition);

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
      } else {
        // Create organic shape point cloud
        const pointCount = 10000;
        const pointGeometry = new THREE.BufferGeometry();
        const pointVertices = new Float32Array(pointCount * 3);
        for (let i = 0; i < pointCount; i++) {
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = Math.cbrt(Math.random());
          pointVertices[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          pointVertices[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pointVertices[i * 3 + 2] = r * Math.cos(phi);
        }
        pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointVertices, 3));
        const initialPosition = pointGeometry.attributes.position.clone();
        pointGeometry.setAttribute('initialPosition', initialPosition);

        const pointMaterial = new THREE.PointsMaterial({ color: color, size: 0.01 });
        const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
        groupRef.current.add(pointCloud);
      }
    }
  }, [color, showPointCloud]);

  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const easedT = easeInOutCubic(t);
      const time = clock.getElapsedTime();

      groupRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh | THREE.Points;
        const geometry = mesh.geometry as THREE.BufferGeometry;
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const initialPositionAttribute = geometry.getAttribute('initialPosition') as THREE.BufferAttribute;

        // Update position based on velocity if it's a mesh
        if (child.type === 'Mesh') {
          const velocity = mesh.userData.velocity as THREE.Vector3;
          mesh.position.add(velocity);

          // Ensure the triangles stay within bounds
          if (mesh.position.x < -1 || mesh.position.x > 1) velocity.x = -velocity.x;
          if (mesh.position.y < -1 || mesh.position.y > 1) velocity.y = -velocity.y;
          if (mesh.position.z < -1 || mesh.position.z > 1) velocity.z = -velocity.z;

          // Apply rotation
          mesh.rotation.x += rotationIntensity * 0.01;
          mesh.rotation.y += rotationIntensity * 0.01;

          // Apply scale based on sound data
          const scale = 1 + t * scalingIntensity * 0.3;
          mesh.scale.set(scale, scale, scale);
        }

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
        }
        positionAttribute.needsUpdate = true;

        // Apply attractor forces to point cloud
        if (child.type === 'Points') {
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
        }
      });
    }
  });

  return (
    <group ref={groupRef} />
  );
};

export default TriangleMesh;