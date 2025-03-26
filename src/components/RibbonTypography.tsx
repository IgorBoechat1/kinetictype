import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface RibbonTypographyProps {
  text: string;
  color: THREE.Color;
  font: string;
}

const RibbonContent: React.FC<RibbonTypographyProps> = ({ text, color, font }) => {
  const ribbonRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);

  // Create a curved path using CatmullRomCurve3
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3, 0, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(3, 0, 0),
    ]);
  }, []);

  useFrame(({ clock }) => {
    if (textRef.current) {
      textRef.current.position.x = Math.sin(clock.elapsedTime) * 0.5; // Move text slightly
    }
  });

  return (
    <group>
      {/* Ribbon Geometry */}
      <mesh ref={ribbonRef}>
        <tubeGeometry args={[curve, 70, 0.2, 8, false]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Text on the Ribbon */}
      <Text
        ref={textRef}
        fontSize={0.3}
        color={color.getStyle()}
        position={[0, 0.2, 0]}
        font={`/fonts/${font}.json`}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

const RibbonTypography: React.FC<RibbonTypographyProps> = (props) => {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      camera={{ position: [0, 0, 5], fov: 50 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 5, 5]} intensity={1} />
      <RibbonContent {...props} />
    </Canvas>
  );
};

export default RibbonTypography;