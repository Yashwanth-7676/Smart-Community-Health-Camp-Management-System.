import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MedicalCrossProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  rotationSpeed?: number;
  reducedMotion?: boolean;
}

const MedicalCross: React.FC<MedicalCrossProps> = ({
  position = [0, 0, 0],
  scale = 1,
  color = '#06b6d4',
  rotationSpeed = 0.5,
  reducedMotion = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * rotationSpeed;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Horizontal bar */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.35, 0.18]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Vertical bar */}
      <mesh castShadow>
        <boxGeometry args={[0.35, 1.2, 0.18]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
};

export default MedicalCross;
