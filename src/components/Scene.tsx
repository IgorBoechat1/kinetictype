'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TextMesh from './TextMesh';
import TriangleMesh from './TriangleMesh';
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
  texture,
  showTextMesh,
  showPointCloud,
}) => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas style={{ width: '100%', height: '100vh' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        {showTextMesh ? (
          <TextMesh
            text={text}
            color={color}
            displacementIntensity={displacementIntensity}
            scalingIntensity={scalingIntensity}
            rotationIntensity={rotationIntensity}
            waveIntensity={waveIntensity}
            isMicActive={isMicActive}
            font={font}
          />
        ) : (
          <TriangleMesh
            color={color}
            isMicActive={isMicActive}
            showPointCloud={showPointCloud}
            displacementIntensity={displacementIntensity}
            scalingIntensity={scalingIntensity}
            rotationIntensity={rotationIntensity}
            waveIntensity={waveIntensity}
            fragmentationIntensity={fragmentationIntensity}
          />
        )}
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
};

export default Scene;