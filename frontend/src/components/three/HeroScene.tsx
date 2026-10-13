import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import ThreeErrorBoundary from './ErrorBoundary';
import MedicalCross from './MedicalCross';
import FloatingElements from './FloatingElements';

// ─── Reduced Motion Hook ────────────────────────────────────────────────────
function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── Floating Pills (orbit path) ───────────────────────────────────────────
const FloatingPills: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const pillData = [
    { radius: 2.8, speed: 0.4, yOffset: 0.4, phase: 0 },
    { radius: 2.4, speed: 0.6, yOffset: -0.3, phase: Math.PI * 0.4 },
    { radius: 3.2, speed: 0.35, yOffset: 0.6, phase: Math.PI * 0.8 },
    { radius: 2.6, speed: 0.55, yOffset: -0.5, phase: Math.PI * 1.2 },
    { radius: 3.0, speed: 0.45, yOffset: 0.2, phase: Math.PI * 1.6 },
  ];

  return (
    <>
      {pillData.map((p, i) => (
        <OrbitingPill key={i} {...p} index={i} reducedMotion={reducedMotion} />
      ))}
    </>
  );
};

interface OrbitingPillProps {
  radius: number;
  speed: number;
  yOffset: number;
  phase: number;
  index: number;
  reducedMotion: boolean;
}

const OrbitingPill: React.FC<OrbitingPillProps> = ({
  radius,
  speed,
  yOffset,
  phase,
  index,
  reducedMotion,
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const colors = ['#06b6d4', '#22d3ee', '#0e7490', '#67e8f9', '#3b82f6'];

  useFrame(({ clock }) => {
    if (ref.current && !reducedMotion) {
      const t = clock.getElapsedTime() * speed + phase;
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      ref.current.position.y = yOffset + Math.sin(t * 2) * 0.2;
      ref.current.rotation.x += 0.02;
      ref.current.rotation.z += 0.01;
    }
  });

  return (
    <mesh ref={ref} castShadow>
      <capsuleGeometry args={[0.1, 0.3, 8, 16]} />
      <meshStandardMaterial
        color={colors[index % colors.length]}
        metalness={0.3}
        roughness={0.4}
        emissive={colors[index % colors.length]}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

// ─── Clinic Model ───────────────────────────────────────────────────────────
const ClinicModel: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.2, 0]}>
      {/* Building body */}
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[2.8, 1.8, 1.8]} />
        <meshStandardMaterial color="#f0f9ff" metalness={0.05} roughness={0.7} />
      </mesh>

      {/* Roof */}
      <mesh castShadow position={[0, 1.9, 0]}>
        <boxGeometry args={[3.2, 0.25, 2.2]} />
        <meshStandardMaterial color="#0e7490" metalness={0.1} roughness={0.6} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.35, 0.91]}>
        <boxGeometry args={[0.5, 0.85, 0.06]} />
        <meshStandardMaterial color="#1e3a6e" metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Left Window */}
      <mesh position={[-0.85, 0.85, 0.92]}>
        <boxGeometry args={[0.5, 0.45, 0.06]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.4} roughness={0.2} transparent opacity={0.7} />
      </mesh>

      {/* Right Window */}
      <mesh position={[0.85, 0.85, 0.92]}>
        <boxGeometry args={[0.5, 0.45, 0.06]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.4} roughness={0.2} transparent opacity={0.7} />
      </mesh>

      {/* Medical cross on building */}
      <mesh position={[0, 1.05, 0.93]}>
        <boxGeometry args={[0.28, 0.08, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.05, 0.93]}>
        <boxGeometry args={[0.08, 0.28, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>

      {/* Steps */}
      <mesh receiveShadow position={[0, -0.06, 1.05]}>
        <boxGeometry args={[0.8, 0.12, 0.25]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#1e3a6e" transparent opacity={0.35} roughness={1} />
      </mesh>
    </group>
  );
};

// ─── Loading Fallback ───────────────────────────────────────────────────────
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0f172a] to-[#1e3a6e]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-cyan-300 text-sm font-medium">Loading 3D Scene…</span>
    </div>
  </div>
);

// ─── Scene Contents ─────────────────────────────────────────────────────────
const SceneContents: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => (
  <>
    <ambientLight intensity={0.6} />
    <pointLight position={[10, 10, 10]} color="#06b6d4" intensity={1.2} castShadow />
    <pointLight position={[-10, -10, -10]} color="#1e3a6e" intensity={0.8} />
    <spotLight position={[0, 8, 4]} angle={0.4} penumbra={0.5} intensity={0.6} color="#ffffff" castShadow />

    <Stars radius={80} depth={50} count={2000} factor={4} saturation={0.3} fade speed={reducedMotion ? 0 : 1} />
    <Environment preset="city" />

    <MedicalCross position={[0, 0.6, 0]} scale={1.1} color="#06b6d4" rotationSpeed={reducedMotion ? 0 : 0.5} />
    <FloatingPills reducedMotion={reducedMotion} />
    <ClinicModel reducedMotion={reducedMotion} />

    <OrbitControls
      autoRotate={!reducedMotion}
      autoRotateSpeed={0.5}
      enableZoom={false}
      enablePan={false}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 1.8}
    />
  </>
);

// ─── Main Export ─────────────────────────────────────────────────────────────
const HeroScene: React.FC = () => {
  const reducedMotion = useReducedMotion();

  return (
    <ThreeErrorBoundary>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <SceneContents reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </ThreeErrorBoundary>
  );
};

export default HeroScene;
