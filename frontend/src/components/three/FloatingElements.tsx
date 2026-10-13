import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingElementProps {
  position: [number, number, number];
  type: 'pill' | 'cross' | 'heart';
  color: string;
  speed: number;
  phaseOffset: number;
  reducedMotion?: boolean;
}

const FloatingPill: React.FC<{ color: string }> = ({ color }) => (
  <mesh castShadow>
    <capsuleGeometry args={[0.08, 0.22, 8, 16]} />
    <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} emissive={color} emissiveIntensity={0.1} />
  </mesh>
);

const FloatingCross: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh castShadow>
      <boxGeometry args={[0.28, 0.1, 0.06]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} emissive={color} emissiveIntensity={0.1} />
    </mesh>
    <mesh castShadow>
      <boxGeometry args={[0.1, 0.28, 0.06]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} emissive={color} emissiveIntensity={0.1} />
    </mesh>
  </group>
);

const FloatingHeart: React.FC<{ color: string }> = ({ color }) => (
  <group>
    <mesh castShadow position={[-0.07, 0.05, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} emissive={color} emissiveIntensity={0.15} />
    </mesh>
    <mesh castShadow position={[0.07, 0.05, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} emissive={color} emissiveIntensity={0.15} />
    </mesh>
    <mesh castShadow position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.14, 0.14, 0.08]} />
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  </group>
);

const FloatingElement: React.FC<FloatingElementProps> = ({
  position,
  type,
  color,
  speed,
  phaseOffset,
  reducedMotion = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && !reducedMotion) {
      const t = clock.getElapsedTime() * speed + phaseOffset;
      groupRef.current.position.y = position[1] + Math.sin(t) * 0.3;
      groupRef.current.rotation.y = t * 0.5;
      groupRef.current.rotation.z = Math.sin(t * 0.7) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {type === 'pill' && <FloatingPill color={color} />}
      {type === 'cross' && <FloatingCross color={color} />}
      {type === 'heart' && <FloatingHeart color={color} />}
    </group>
  );
};

interface FloatingElementsProps {
  count?: number;
  reducedMotion?: boolean;
}

const FloatingElements: React.FC<FloatingElementsProps> = ({
  count = 15,
  reducedMotion = false,
}) => {
  const elements = useMemo(() => {
    const types: Array<'pill' | 'cross' | 'heart'> = ['pill', 'cross', 'heart'];
    const colors = ['#06b6d4', '#0e7490', '#22d3ee', '#67e8f9', '#a5f3fc', '#1e3a6e', '#3b82f6'];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6 - 2,
      ] as [number, number, number],
      type: types[i % types.length],
      color: colors[i % colors.length],
      speed: 0.3 + Math.random() * 0.5,
      phaseOffset: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  return (
    <>
      {elements.map((el) => (
        <FloatingElement key={el.id} {...el} reducedMotion={reducedMotion} />
      ))}
    </>
  );
};

export default FloatingElements;
