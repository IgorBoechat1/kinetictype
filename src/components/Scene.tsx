'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TextMesh from './TextMesh';
import TriangleMesh from './TriangleMesh';
import PointCloud from './PointCloud';
import * as THREE from 'three';

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

interface SceneProps {
  text: string;
  color: THREE.Color;
  displacementIntensity: number;
  scalingIntensity: number;
  rotationIntensity: number;
  waveIntensity: number;
  fragmentationIntensity: number;
  isMicActive: boolean;
  font: keyof typeof fontFiles;
  texture: string;
  showTextMesh: boolean;
  showTriangleMesh: boolean;
  showPointCloud: boolean;
  useShader: boolean;
}

const Scene: React.FC<SceneProps> = ({
  text,
  color,
  displacementIntensity,
  scalingIntensity,
  rotationIntensity,
  waveIntensity,
  fragmentationIntensity,
  isMicActive,
  font,
  useShader,
  texture,
  showTextMesh,
  showTriangleMesh,
  showPointCloud,
}) => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        style={{ width: '100%', height: '100vh' }}
        shadows // Enable shadows in the renderer
        camera={{ position: [0, 0, 10], fov: 50 }}
      >
        <ambientLight intensity={1} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={12}
          castShadow // Enable shadow casting for the light
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        {showTextMesh ? (
          <TextMesh
            text={text}
            color={color}
            displacementIntensity={displacementIntensity}
            waveIntensity={waveIntensity}
            isMicActive={isMicActive}
            useShader={useShader}
            font={font}
            scalingIntensity={scalingIntensity}
          />
        ) : showTriangleMesh ? (
          <TriangleMesh
            color={color}
            isMicActive={isMicActive}
            displacementIntensity={displacementIntensity}
            scalingIntensity={scalingIntensity}
            rotationIntensity={rotationIntensity}
            waveIntensity={waveIntensity}
          />
        ) : (
          <PointCloud
            color={color}
            isMicActive={isMicActive}
            displacementIntensity={displacementIntensity}
            waveIntensity={waveIntensity}
          />
        )}
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
};

export default Scene;