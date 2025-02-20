import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import vertexShader from '../shaders/vertex.glsl';
import fragmentShader from '../shaders/fragment.glsl';

interface TriangleMeshProps {
  color: THREE.Color;
  isMicActive: boolean;
  displacementIntensity: number;
  scalingIntensity: number;
  rotationIntensity: number;
  waveIntensity: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const TriangleMesh: React.FC<TriangleMeshProps> = ({
  color,
  isMicActive,
  displacementIntensity,
  scalingIntensity,
  rotationIntensity,
  waveIntensity,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const clock = new THREE.Clock();
  const { size, viewport } = useThree();
  const [mouse, setMouse] = useState(new THREE.Vector2());

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

      // Create multiple shapes
      for (let i = 0; i < 5; i++) {
        // Create geometry (cube, cylinder, pyramid, or sphere)
        const geometry = (() => {
          switch (Math.floor(Math.random() * 4)) {
            case 0:
              return new THREE.BoxGeometry(1, 1, 1, 20, 20, 20); // Cube
            case 1:
              return new THREE.CylinderGeometry(1, 1, 4, 64, 64, true); // Cylinder
            case 2:
              return new THREE.ConeGeometry(1, 2, 32, 32); // Pyramid
            case 3:
              return new THREE.SphereGeometry(1, 32, 32); // Sphere
            default:
              return new THREE.BoxGeometry(1, 1, 1, 20, 20, 20); // Default to Cube
          }
        })();

        // Store initial positions
        const initialPosition = geometry.attributes.position.clone();
        geometry.setAttribute('initialPosition', initialPosition);

        // Create custom shader material
        const material = new THREE.ShaderMaterial({
          side: THREE.DoubleSide,
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          transparent: true,
          uniforms: {
            time: { value: 0 },
            offsetSize: { value: 2 },
            size: { value: 2 },
            frequency: { value: 2 },
            amplitude: { value: 0.8 },
            offsetGain: { value: 0.5 },
            maxDistance: { value: 1.8 },
            startColor: { value: new THREE.Color(0xff00ff) },
            endColor: { value: new THREE.Color(0x00ffff) },
            attractorPosition: { value: new THREE.Vector3() },
            soundIntensity: { value: 0 },
            mousePosition: { value: new THREE.Vector2() },
          },
        });

        const mesh = new THREE.Points(geometry, material);
        mesh.castShadow = true; // Enable shadow casting
        mesh.receiveShadow = true; // Enable shadow receiving
        mesh.userData.velocity = new THREE.Vector3(Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01);
        groupRef.current.add(mesh);
      }
    }
  }, [color]);

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

  useFrame(() => {
    if (groupRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avgFrequency = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const t = avgFrequency / 256;
      const easedT = easeInOutCubic(t);
      const time = clock.getElapsedTime();

      groupRef.current.children.forEach((child) => {
        const mesh = child as THREE.Points;
        const geometry = mesh.geometry as THREE.BufferGeometry;
        const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
        const initialPositionAttribute = geometry.getAttribute('initialPosition') as THREE.BufferAttribute;

        // Update position based on velocity if it's a mesh
        const velocity = mesh.userData.velocity as THREE.Vector3;
        mesh.position.add(velocity);

        // Ensure the shapes stay within bounds
        if (mesh.position.x < -1 || mesh.position.x > 1) velocity.x = -velocity.x;
        if (mesh.position.y < -1 || mesh.position.y > 1) velocity.y = -velocity.y;
        if (mesh.position.z < -1 || mesh.position.z > 1) velocity.z = -velocity.z;

        // Apply rotation with acceleration based on sound intensity
        const rotationSpeed = rotationIntensity * 0.01 * t;
        mesh.rotation.x += rotationSpeed;
        mesh.rotation.y += rotationSpeed;

        // Apply scale based on sound data
        const scale = 1 + t * scalingIntensity * 0.3;
        mesh.scale.set(scale, scale, scale);

        // Update shader uniforms
        const material = mesh.material as THREE.ShaderMaterial;
        material.uniforms.time.value = time;
        material.uniforms.soundIntensity.value = t;
        material.uniforms.attractorPosition.value.set(
          Math.sin(time) * 2,
          Math.cos(time) * 2,
          Math.sin(time) * 2
        );
        material.uniforms.mousePosition.value.copy(mouse);

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
      });
    }
  });

  return (
    <group ref={groupRef} />
  );
};

export default TriangleMesh;