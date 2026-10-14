import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const ClinicScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {/* Ground platform */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[2.8, 3, 0.2, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Main Clinic Building */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.4, 1.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.5, 0.6, 4]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} />
      </mesh>

      {/* Medical Cross on Front */}
      <group position={[0, 0.95, 0.72]}>
        {/* Vertical bar */}
        <mesh>
          <boxGeometry args={[0.12, 0.45, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
        </mesh>
        {/* Horizontal bar */}
        <mesh>
          <boxGeometry args={[0.45, 0.12, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Clinic Door */}
      <mesh position={[0, 0.4, 0.71]}>
        <planeGeometry args={[0.4, 0.7]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.2} />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.5, 0.9, 0.71]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} />
      </mesh>
      <mesh position={[0.5, 0.9, 0.71]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} />
      </mesh>

      {/* Small Camp Trees */}
      {[-1.8, 1.8].map((x, i) => (
        <group key={i} position={[x, 0, (i % 2 === 0 ? 0.8 : -0.8)]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.6]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.4, 0.8, 8]} />
            <meshStandardMaterial color="#10b981" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Ambulance / Medical Tent Mini Box */}
      <group position={[1.4, 0.3, 0.5]}>
        <mesh>
          <boxGeometry args={[0.8, 0.5, 0.6]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>
    </group>
  );
};

export const ClinicModel: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full h-80 relative ${className}`}>
      <Canvas
        camera={{ position: [3, 2.5, 4], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-4, 4, -4]} intensity={0.4} color="#38bdf8" />
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <ClinicScene />
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
};

export default ClinicModel;
